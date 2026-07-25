import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../../../../theme/colors.dart';
import '../../../../shared/widgets/premium_card.dart';
import '../../../../shared/widgets/premium_button.dart';
import '../../../../core/models/astrology_models.dart';
import '../../../../core/utils/validation.dart';
import '../providers/profile_provider.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  List<Map<String, dynamic>> _allProfiles = [];
  String _primaryUserId = '';
  String _activeProfileId = '';
  String _subscriptionTier = 'free';
  bool _isLoadingSaved = true;

  @override
  void initState() {
    super.initState();
    _loadSavedProfiles();
  }

  Future<void> _loadSavedProfiles() async {
    setState(() => _isLoadingSaved = true);
    final prefs = await SharedPreferences.getInstance();
    final primaryId = prefs.getString('user_id') ?? '';
    final activeId = prefs.getString('active_profile_id') ?? primaryId;
    final tier = prefs.getString('subscription_tier') ?? 'free';

    // Fetch primary profile data from backend if active
    final profileState = ref.read(profileProvider);
    final activeProfile = profileState.activeProfile;

    // Load saved profiles from SharedPreferences
    final profilesJson = prefs.getString('saved_profiles');
    List<Map<String, dynamic>> loadedList = [];
    if (profilesJson != null) {
      try {
        final decoded = json.decode(profilesJson);
        if (decoded is List) {
          loadedList = decoded.map((e) => Map<String, dynamic>.from(e)).toList();
        }
      } catch (_) {}
    }

    // Ensure primary profile is always the first item in the list
    final hasPrimary = loadedList.any((p) => p['id'] == primaryId);
    if (!hasPrimary && primaryId.isNotEmpty) {
      // Create primary profile representation
      final primaryDetails = activeProfile?.birthDetails;
      loadedList.insert(0, {
        'id': primaryId,
        'name': primaryDetails?.name ?? 'Primary User',
        'relationship': 'self',
        'gender': primaryDetails?.gender ?? 'male',
        'date_of_birth': primaryDetails?.dateOfBirth ?? '1995-10-18',
        'time_of_birth': primaryDetails?.timeOfBirth ?? '14:30:00',
        'latitude': primaryDetails?.latitude ?? 28.6139,
        'longitude': primaryDetails?.longitude ?? 77.2090,
        'timezone_offset': primaryDetails?.timezoneOffset ?? 5.5,
      });
      // Save this list back
      await prefs.setString('saved_profiles', json.encode(loadedList));
    }

    setState(() {
      _allProfiles = loadedList;
      _primaryUserId = primaryId;
      _activeProfileId = activeId;
      _subscriptionTier = tier;
      _isLoadingSaved = false;
    });
  }

  int _getMaxProfilesLimit() {
    switch (_subscriptionTier.toLowerCase()) {
      case 'standard':
        return 3;
      case 'pro':
        return 5;
      default:
        return 2; // Free tier
    }
  }

  Future<void> _switchActiveProfile(String profileId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('active_profile_id', profileId);
    setState(() {
      _activeProfileId = profileId;
    });
    
    // Trigger Riverpod to reload the active profile and chart data
    await ref.read(profileProvider.notifier).fetchProfile();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Active profile switched successfully! All tabs updated.')),
      );
    }
  }

  Future<void> _deleteSubProfile(String profileId) async {
    // 1. Delete from PostgreSQL backend
    final repo = ref.read(profileRepositoryProvider);
    try {
      await repo.updateProfile(profileId, BirthDetails(
        name: '',
        dateOfBirth: '',
        timeOfBirth: '',
        latitude: 0.0,
        longitude: 0.0,
        timezoneOffset: 0.0,
        gender: '',
        relationship: '',
      ));
    } catch (_) {}

    // 2. Remove from SharedPreferences list
    final prefs = await SharedPreferences.getInstance();
    final updatedList = _allProfiles.where((p) => p['id'] != profileId).toList();
    await prefs.setString('saved_profiles', json.encode(updatedList));

    // 3. Reset active profile if deleted was active
    if (_activeProfileId == profileId) {
      await prefs.setString('active_profile_id', _primaryUserId);
      _activeProfileId = _primaryUserId;
    }

    setState(() {
      _allProfiles = updatedList;
    });

    // Reload active profile
    await ref.read(profileProvider.notifier).fetchProfile();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile deleted successfully.')),
      );
    }
  }

  void _showAddProfileDialog() {
    final currentCount = _allProfiles.length;
    final limit = _getMaxProfilesLimit();

    if (currentCount >= limit) {
      _showUpgradePromptDialog(currentCount, limit);
      return;
    }

    showDialog(
      context: context,
      builder: (context) => AddProfileFormDialog(
        onSave: (newProfile) async {
          final messenger = ScaffoldMessenger.of(context);
          final prefs = await SharedPreferences.getInstance();
          
          // Compute chart on backend by saving profile
          final repo = ref.read(profileRepositoryProvider);
          final details = BirthDetails(
            name: newProfile['name'],
            dateOfBirth: newProfile['date_of_birth'],
            timeOfBirth: newProfile['time_of_birth'],
            latitude: newProfile['latitude'],
            longitude: newProfile['longitude'],
            timezoneOffset: newProfile['timezone_offset'],
            gender: newProfile['gender'],
            relationship: newProfile['relationship'],
          );
          
          await repo.updateProfile(newProfile['id'], details);

          // Append to SharedPreferences list
          final updatedList = List<Map<String, dynamic>>.from(_allProfiles);
          updatedList.add(newProfile);
          await prefs.setString('saved_profiles', json.encode(updatedList));

          // Set as active
          await prefs.setString('active_profile_id', newProfile['id']);

          setState(() {
            _allProfiles = updatedList;
            _activeProfileId = newProfile['id'];
          });

          // Reload active profile
          await ref.read(profileProvider.notifier).fetchProfile();

          messenger.showSnackBar(
            const SnackBar(content: Text('New profile added and activated!')),
          );
        },
      ),
    );
  }

  void _showUpgradePromptDialog(int current, int limit) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Upgrade Profile Limit'),
        content: Text(
          'You have reached the maximum of $limit profiles allowed on the ${_subscriptionTier.toUpperCase()} tier.\n\n'
          'Upgrade to Standard for up to 3 profiles, or Pro for up to 5 profiles!',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              context.push('/dashboard/subscription');
            },
            child: const Text('Upgrade Now'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoadingSaved) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: AstroColors.primary)),
      );
    }

    return Scaffold(
      backgroundColor: AstroColors.lightBackground,
      appBar: AppBar(
        title: const Text('My Profiles'),
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(20.0),
        children: [
          // Subscription status banner
          PremiumCard(
            color: AstroColors.primary,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Tier: ${_subscriptionTier.toUpperCase()}',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    Icon(
                      _subscriptionTier == 'free'
                          ? Icons.star_border
                          : _subscriptionTier == 'standard'
                              ? Icons.star_half
                              : Icons.auto_awesome,
                      color: Colors.white,
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Profile slots used: ${_allProfiles.length} / ${_getMaxProfilesLimit()}',
                  style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 13),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          const Text(
            'Saved Family & Friend Profiles',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AstroColors.lightTextPrimary),
          ),
          const SizedBox(height: 12),

          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _allProfiles.length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final p = _allProfiles[index];
              final isCurrentActive = _activeProfileId == p['id'];
              final isPrimary = p['id'] == _primaryUserId;

              return PremiumCard(
                borderWidth: isCurrentActive ? 2 : 1,
                color: isCurrentActive ? AstroColors.primary.withOpacity(0.06) : Colors.white,
                child: Row(
                  children: [
                    Radio<String>(
                      value: p['id'],
                      groupValue: _activeProfileId,
                      onChanged: (val) {
                        if (val != null) _switchActiveProfile(val);
                      },
                      activeColor: AstroColors.primary,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: () => _switchActiveProfile(p['id']),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              p['name'] ?? '',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Relation: ${p['relationship'].toString().toUpperCase()} · DOB: ${p['date_of_birth']}',
                              style: const TextStyle(color: AstroColors.lightTextSecondary, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ),
                    if (!isPrimary)
                      IconButton(
                        icon: const Icon(Icons.delete_outline, color: AstroColors.error),
                        onPressed: () => _deleteSubProfile(p['id']),
                      ),
                  ],
                ),
              );
            },
          ),
          const SizedBox(height: 32),

          PremiumButton(
            text: 'Add Family Profile',
            onTap: _showAddProfileDialog,
          ),
        ],
      ),
    );
  }
}

// Sub-Form Dialog to collect birth details for the new sub-profile
class AddProfileFormDialog extends StatefulWidget {
  final Function(Map<String, dynamic>) onSave;

  const AddProfileFormDialog({super.key, required this.onSave});

  @override
  State<AddProfileFormDialog> createState() => _AddProfileFormDialogState();
}

class _AddProfileFormDialogState extends State<AddProfileFormDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _dateController = TextEditingController();
  final _timeController = TextEditingController();
  final _locationController = TextEditingController();

  String _gender = 'male';
  String _relationship = 'spouse';

  double _latitude = 0.0;
  double _longitude = 0.0;
  double _timezoneOffset = 5.5;

  List<Map<String, dynamic>> _suggestions = [];
  bool _loadingSuggestions = false;
  Timer? _debounceTimer;

  @override
  void dispose() {
    _nameController.dispose();
    _dateController.dispose();
    _timeController.dispose();
    _locationController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  String _pad(int val) => val.toString().padLeft(2, '0');

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime(1996, 8, 12),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() {
        _dateController.text = '${picked.year}-${_pad(picked.month)}-${_pad(picked.day)}';
      });
    }
  }

  Future<void> _selectTime() async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: const TimeOfDay(hour: 9, minute: 15),
    );
    if (picked != null) {
      setState(() {
        _timeController.text = '${_pad(picked.hour)}:${_pad(picked.minute)}:00';
      });
    }
  }

  void _onLocationChanged(String query) {
    _debounceTimer?.cancel();
    if (query.trim().length < 3) {
      setState(() {
        _suggestions = [];
      });
      return;
    }

    _debounceTimer = Timer(const Duration(milliseconds: 600), () async {
      setState(() => _loadingSuggestions = true);
      try {
        final dio = Dio();
        final response = await dio.get(
          'https://nominatim.openstreetmap.org/search',
          queryParameters: {
            'format': 'json',
            'q': query,
            'limit': 5,
            'addressdetails': 1,
          },
          options: Options(
            headers: {
              'User-Agent': 'AstroSutra-Mobile/1.0.0',
            },
          ),
        );
        if (response.statusCode == 200 && response.data is List) {
          setState(() {
            _suggestions = List<Map<String, dynamic>>.from(
              response.data.map((e) => Map<String, dynamic>.from(e)),
            );
          });
        }
      } catch (_) {} finally {
        setState(() => _loadingSuggestions = false);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Add Sub-Profile'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Name'),
                validator: AstroValidator.validateName,
              ),
              const SizedBox(height: 12),

              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _gender,
                      decoration: const InputDecoration(labelText: 'Gender'),
                      items: const [
                        DropdownMenuItem(value: 'male', child: Text('Male')),
                        DropdownMenuItem(value: 'female', child: Text('Female')),
                        DropdownMenuItem(value: 'other', child: Text('Other')),
                      ],
                      onChanged: (val) => setState(() => _gender = val!),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _relationship,
                      decoration: const InputDecoration(labelText: 'Relation'),
                      items: const [
                        DropdownMenuItem(value: 'spouse', child: Text('Spouse')),
                        DropdownMenuItem(value: 'child', child: Text('Child')),
                        DropdownMenuItem(value: 'parent', child: Text('Parent')),
                        DropdownMenuItem(value: 'friend', child: Text('Friend')),
                        DropdownMenuItem(value: 'other', child: Text('Other')),
                      ],
                      onChanged: (val) => setState(() => _relationship = val!),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              TextFormField(
                controller: _dateController,
                readOnly: true,
                decoration: const InputDecoration(labelText: 'Date of Birth (YYYY-MM-DD)'),
                onTap: _selectDate,
                validator: AstroValidator.validateDate,
              ),
              const SizedBox(height: 12),

              TextFormField(
                controller: _timeController,
                readOnly: true,
                decoration: const InputDecoration(labelText: 'Time of Birth (HH:MM:SS)'),
                onTap: _selectTime,
                validator: AstroValidator.validateTime,
              ),
              const SizedBox(height: 12),

              TextFormField(
                controller: _locationController,
                decoration: InputDecoration(
                  labelText: 'Birthplace Location',
                  suffixIcon: _loadingSuggestions 
                      ? const SizedBox(
                          width: 18, 
                          height: 18, 
                          child: Padding(
                            padding: EdgeInsets.all(12.0),
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        ) 
                      : null,
                  helperText: 'Type city name and select from suggestions',
                ),
                onChanged: _onLocationChanged,
                validator: (val) {
                  if (val == null || val.trim().isEmpty) {
                    return 'Location is required';
                  }
                  return null;
                },
              ),

              if (_suggestions.isNotEmpty) ...[
                const SizedBox(height: 8),
                Card(
                  elevation: 2,
                  child: ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _suggestions.length,
                    separatorBuilder: (context, index) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final s = _suggestions[index];
                      return ListTile(
                        title: Text(s['display_name'] ?? '', style: const TextStyle(fontSize: 12)),
                        onTap: () {
                          final lat = double.tryParse(s['lat'] ?? '');
                          final lon = double.tryParse(s['lon'] ?? '');
                          setState(() {
                            _locationController.text = s['display_name'] ?? '';
                            if (lat != null) _latitude = lat;
                            if (lon != null) _longitude = lon;
                            if (lon != null) {
                              _timezoneOffset = ((lon / 15.0) * 2.0).roundToDouble() / 2.0;
                            }
                            _suggestions = [];
                          });
                        },
                      );
                    },
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () {
            if (_formKey.currentState!.validate()) {
              if (_latitude == 0.0 && _longitude == 0.0) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Please select location from suggestions')),
                );
                return;
              }
              final newProfile = {
                'id': 'profile_${DateTime.now().millisecondsSinceEpoch}',
                'name': _nameController.text.trim(),
                'relationship': _relationship,
                'gender': _gender,
                'date_of_birth': _dateController.text.trim(),
                'time_of_birth': _timeController.text.trim(),
                'latitude': _latitude,
                'longitude': _longitude,
                'timezone_offset': _timezoneOffset,
              };
              widget.onSave(newProfile);
              Navigator.pop(context);
            }
          },
          child: const Text('Save'),
        ),
      ],
    );
  }
}

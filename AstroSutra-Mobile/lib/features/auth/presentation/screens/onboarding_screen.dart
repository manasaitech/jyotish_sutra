import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../../../theme/colors.dart';
import '../../../shared/widgets/premium_card.dart';
import '../../../shared/widgets/premium_button.dart';
import '../../../shared/widgets/computing_card.dart';
import '../../../core/models/astrology_models.dart';
import '../../../core/utils/validation.dart';
import '../../profile/presentation/providers/profile_provider.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _formKey = GlobalKey<FormState>();
  
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _dateController = TextEditingController();
  final TextEditingController _timeController = TextEditingController();
  final TextEditingController _locationController = TextEditingController();

  String _gender = 'male';
  String _relationship = 'self';

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
      initialDate: DateTime(1995, 10, 18),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AstroColors.primary,
              onPrimary: Colors.white,
              onSurface: AstroColors.lightTextPrimary,
            ),
          ),
          child: child!,
        );
      },
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
      initialTime: const TimeOfDay(hour: 12, minute: 0),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AstroColors.primary,
              onPrimary: Colors.white,
              onSurface: AstroColors.lightTextPrimary,
            ),
          ),
          child: child!,
        );
      },
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

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;

    if (_latitude == 0.0 && _longitude == 0.0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a valid birthplace location from the list suggestions.')),
      );
      return;
    }

    final name = _nameController.text.trim();
    final date = _dateController.text.trim();
    final time = _timeController.text.trim();

    final details = BirthDetails(
      name: name,
      dateOfBirth: date,
      timeOfBirth: time,
      latitude: _latitude,
      longitude: _longitude,
      timezoneOffset: _timezoneOffset,
      gender: _gender,
      relationship: _relationship,
    );

    // Call updateDetails trigger
    await ref.read(profileProvider.notifier).updateDetails(details);

    // Check if configuration succeeded
    final profileState = ref.read(profileProvider);
    if (profileState.errorMessage == null && !profileState.isLoading) {
      if (mounted) {
        context.go('/dashboard');
      }
    } else if (profileState.errorMessage != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to save profile: ${profileState.errorMessage}')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final profileState = ref.watch(profileProvider);

    if (profileState.isLoading) {
      return const Scaffold(
        body: Center(
          child: Padding(
            padding: EdgeInsets.all(24.0),
            child: CelestialComputingCard(),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AstroColors.lightBackground,
      appBar: AppBar(
        title: const Text('Spiritual Onboarding'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Configure Birth Details',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AstroColors.lightTextPrimary,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Enter accurate birth details to align planetary computing engines and generate your Vedic charts.',
                style: TextStyle(
                  fontSize: 14,
                  color: AstroColors.lightTextSecondary,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 32),

              // Seeker Name
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Full Name',
                  prefixIcon: Icon(Icons.person_outline),
                  border: OutlineInputBorder(),
                ),
                validator: AstroValidator.validateName,
              ),
              const SizedBox(height: 20),

              // Row: Gender & Relationship
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _gender,
                      decoration: const InputDecoration(
                        labelText: 'Gender',
                        prefixIcon: Icon(Icons.wc),
                        border: OutlineInputBorder(),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'male', child: Text('Male')),
                        DropdownMenuItem(value: 'female', child: Text('Female')),
                        DropdownMenuItem(value: 'other', child: Text('Other')),
                      ],
                      onChanged: (val) {
                        if (val != null) setState(() => _gender = val);
                      },
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _relationship,
                      decoration: const InputDecoration(
                        labelText: 'Relation',
                        prefixIcon: Icon(Icons.people_outline),
                        border: OutlineInputBorder(),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'self', child: Text('Self')),
                        DropdownMenuItem(value: 'spouse', child: Text('Spouse')),
                        DropdownMenuItem(value: 'child', child: Text('Child')),
                        DropdownMenuItem(value: 'parent', child: Text('Parent')),
                        DropdownMenuItem(value: 'friend', child: Text('Friend')),
                        DropdownMenuItem(value: 'other', child: Text('Other')),
                      ],
                      onChanged: (val) {
                        if (val != null) setState(() => _relationship = val);
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Date of Birth
              TextFormField(
                controller: _dateController,
                readOnly: true,
                decoration: const InputDecoration(
                  labelText: 'Date of Birth (YYYY-MM-DD)',
                  prefixIcon: Icon(Icons.calendar_today_outlined),
                  border: OutlineInputBorder(),
                ),
                onTap: _selectDate,
                validator: AstroValidator.validateDate,
              ),
              const SizedBox(height: 20),

              // Time of Birth
              TextFormField(
                controller: _timeController,
                readOnly: true,
                decoration: const InputDecoration(
                  labelText: 'Time of Birth (HH:MM:SS)',
                  prefixIcon: Icon(Icons.access_time),
                  border: OutlineInputBorder(),
                ),
                onTap: _selectTime,
                validator: AstroValidator.validateTime,
              ),
              const SizedBox(height: 20),

              // Location Search input field with autocomplete
              TextFormField(
                controller: _locationController,
                decoration: InputDecoration(
                  labelText: 'Birthplace Location',
                  prefixIcon: const Icon(Icons.location_on_outlined),
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
                  border: const OutlineInputBorder(),
                  helperText: 'Type city name and select from the dropdown',
                ),
                onChanged: _onLocationChanged,
                validator: (val) {
                  if (val == null || val.trim().isEmpty) {
                    return 'Location is required';
                  }
                  return null;
                },
              ),
              
              // Suggestions list layout overlay
              if (_suggestions.isNotEmpty) ...[
                const SizedBox(height: 8),
                Card(
                  elevation: 4,
                  child: ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _suggestions.length,
                    separatorBuilder: (context, index) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final s = _suggestions[index];
                      return ListTile(
                        leading: const Icon(Icons.location_city, color: AstroColors.primary),
                        title: Text(s['display_name'] ?? '', style: const TextStyle(fontSize: 13)),
                        onTap: () {
                          final lat = double.tryParse(s['lat'] ?? '');
                          final lon = double.tryParse(s['lon'] ?? '');
                          setState(() {
                            _locationController.text = s['display_name'] ?? '';
                            if (lat != null) _latitude = lat;
                            if (lon != null) _longitude = lon;
                            // Estimate timezone offset locally:
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

              const SizedBox(height: 36),

              // Submit Action
              PremiumButton(
                text: 'Generate Birth Chart',
                onTap: _submitForm,
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

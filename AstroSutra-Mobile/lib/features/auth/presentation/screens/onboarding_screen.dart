import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../theme/colors.dart';
import '../../../../shared/widgets/premium_button.dart';
import '../../../../shared/widgets/computing_card.dart';
import '../../../../core/models/astrology_models.dart';
import '../../../../core/utils/validation.dart';
import '../../../profile/presentation/providers/profile_provider.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _formKey = GlobalKey<FormState>();
  
  late final TextEditingController _nameController;
  late final TextEditingController _dateController;
  late final TextEditingController _timeController;
  late final TextEditingController _latController;
  late final TextEditingController _lonController;
  late final TextEditingController _tzController;

  String _gender = 'male';
  String _relationship = 'self';

  @override
  void initState() {
    super.initState();
    // Prefill default Vedic Seeker details for easy simulator testing
    _nameController = TextEditingController(text: 'Vedic Seeker');
    _dateController = TextEditingController(text: '1995-10-18');
    _timeController = TextEditingController(text: '14:30:00');
    _latController = TextEditingController(text: '28.6139');
    _lonController = TextEditingController(text: '77.2090');
    _tzController = TextEditingController(text: '5.5');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _dateController.dispose();
    _timeController.dispose();
    _latController.dispose();
    _lonController.dispose();
    _tzController.dispose();
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
      initialTime: const TimeOfDay(hour: 14, minute: 30),
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

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;

    final name = _nameController.text.trim();
    final date = _dateController.text.trim();
    final time = _timeController.text.trim();
    final lat = double.tryParse(_latController.text.trim()) ?? 0.0;
    final lon = double.tryParse(_lonController.text.trim()) ?? 0.0;
    final tz = double.tryParse(_tzController.text.trim()) ?? 5.5;

    final details = BirthDetails(
      name: name,
      dateOfBirth: date,
      timeOfBirth: time,
      latitude: lat,
      longitude: lon,
      timezoneOffset: tz,
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

              // Row: Latitude & Longitude
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _latController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(
                        labelText: 'Latitude',
                        prefixIcon: Icon(Icons.location_on_outlined),
                        border: OutlineInputBorder(),
                      ),
                      validator: (val) => AstroValidator.validateLatitude(double.tryParse(val ?? '')),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      controller: _lonController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(
                        labelText: 'Longitude',
                        prefixIcon: Icon(Icons.location_on_outlined),
                        border: OutlineInputBorder(),
                      ),
                      validator: (val) => AstroValidator.validateLongitude(double.tryParse(val ?? '')),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Timezone Offset
              TextFormField(
                controller: _tzController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Timezone Offset (e.g. +5.5 for IST)',
                  prefixIcon: Icon(Icons.public),
                  border: OutlineInputBorder(),
                ),
                validator: (val) => AstroValidator.validateTimezone(double.tryParse(val ?? '')),
              ),
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

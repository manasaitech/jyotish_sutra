import '../models/astrology_models.dart';

class AstroValidator {
  static String? validateName(String? name) {
    if (name == null || name.trim().isEmpty) {
      return 'Name is required';
    }
    if (name.length < 2) {
      return 'Name must be at least 2 characters';
    }
    return null;
  }

  static String? validateDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) {
      return 'Date of birth is required';
    }
    // Match YYYY-MM-DD
    final regExp = RegExp(r'^\d{4}-\d{2}-\d{2}$');
    if (!regExp.hasMatch(dateStr)) {
      return 'Date must be in YYYY-MM-DD format';
    }
    try {
      final parsed = DateTime.parse(dateStr);
      if (parsed.isAfter(DateTime.now())) {
        return 'Date cannot be in the future';
      }
    } catch (_) {
      return 'Invalid calendar date';
    }
    return null;
  }

  static String? validateTime(String? timeStr) {
    if (timeStr == null || timeStr.isEmpty) {
      return 'Time of birth is required';
    }
    // Match HH:MM or HH:MM:SS
    final regExp = RegExp(r'^\d{2}:\d{2}(:\d{2})?$');
    if (!regExp.hasMatch(timeStr)) {
      return 'Time must be in HH:MM or HH:MM:SS format';
    }
    final parts = timeStr.split(':');
    final hour = int.tryParse(parts[0]) ?? -1;
    final minute = int.tryParse(parts[1]) ?? -1;
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return 'Invalid hours (0-23) or minutes (0-59)';
    }
    return null;
  }

  static String? validateLatitude(double? lat) {
    if (lat == null) {
      return 'Latitude is required';
    }
    if (lat < -90.0 || lat > 90.0) {
      return 'Latitude must be between -90 and 90';
    }
    return null;
  }

  static String? validateLongitude(double? lon) {
    if (lon == null) {
      return 'Longitude is required';
    }
    if (lon < -180.0 || lon > 180.0) {
      return 'Longitude must be between -180 and 180';
    }
    return null;
  }

  static String? validateTimezone(double? tz) {
    if (tz == null) {
      return 'Timezone offset is required';
    }
    if (tz < -12.0 || tz > 14.0) {
      return 'Timezone offset must be between -12 and +14';
    }
    return null;
  }

  static List<String> validateBirthDetails(BirthDetails details, {String mode = 'exact'}) {
    final errors = <String>[];
    
    final nameErr = validateName(details.name);
    if (nameErr != null) errors.add(nameErr);
    
    if (mode == 'exact' || mode == 'partial') {
      final dateErr = validateDate(details.dateOfBirth);
      if (dateErr != null) errors.add(dateErr);
    }
    
    if (mode == 'exact') {
      final timeErr = validateTime(details.timeOfBirth);
      if (timeErr != null) errors.add(timeErr);
    }
    
    final latErr = validateLatitude(details.latitude);
    if (latErr != null) errors.add(latErr);
    
    final lonErr = validateLongitude(details.longitude);
    if (lonErr != null) errors.add(lonErr);
    
    return errors;
  }
}

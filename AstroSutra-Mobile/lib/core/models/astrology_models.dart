class BirthDetails {
  final String name;
  final String dateOfBirth;
  final String timeOfBirth;
  final double latitude;
  final double longitude;
  final double timezoneOffset;
  final String? gender;
  final String? relationship;

  BirthDetails({
    required this.name,
    required this.dateOfBirth,
    required this.timeOfBirth,
    required this.latitude,
    required this.longitude,
    required this.timezoneOffset,
    this.gender,
    this.relationship,
  });

  factory BirthDetails.fromJson(Map<String, dynamic> json) {
    return BirthDetails(
      name: json['name'] ?? 'Seeker',
      dateOfBirth: json['date_of_birth'] ?? json['dateOfBirth'] ?? '',
      timeOfBirth: json['time_of_birth'] ?? json['timeOfBirth'] ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      timezoneOffset: (json['timezone_offset'] as num?)?.toDouble() ?? 5.5,
      gender: json['gender'],
      relationship: json['relationship'] ?? json['relationship_type'],
    );
  }

  Map<String, dynamic> toJson() {
    // Sanitize relationship to lowercase to match backend database CheckConstraint
    String rel = (relationship ?? 'self').toLowerCase().trim();
    if (!['self', 'spouse', 'child', 'parent', 'friend', 'other'].contains(rel)) {
      rel = 'other';
    }

    // Sanitize gender to lowercase
    String gen = (gender ?? 'male').toLowerCase().trim();
    if (!['male', 'female', 'other'].contains(gen)) {
      gen = 'male';
    }

    return {
      'name': name,
      'date_of_birth': dateOfBirth,
      'time_of_birth': timeOfBirth,
      'latitude': latitude,
      'longitude': longitude,
      'timezone_offset': timezoneOffset,
      'gender': gen,
      'relationship_type': rel,
    };
  }
}

class PlanetData {
  final String name;
  final String sign;
  final double degree;
  final int house;
  final String nakshatra;
  final int pada;
  final bool isRetrograde;

  PlanetData({
    required this.name,
    required this.sign,
    required this.degree,
    required this.house,
    required this.nakshatra,
    required this.pada,
    required this.isRetrograde,
  });

  factory PlanetData.fromJson(String key, Map<String, dynamic> json) {
    return PlanetData(
      name: key,
      sign: json['sign'] ?? '',
      degree: (json['degree'] as num?)?.toDouble() ?? 0.0,
      house: json['house'] ?? 1,
      nakshatra: json['nakshatra'] ?? '',
      pada: json['pada'] ?? 1,
      isRetrograde: json['is_retrograde'] ?? false,
    );
  }
}

class ChartSummary {
  final String name;
  final String ascendantSign;
  final String moonSign;
  final String nakshatra;
  final int pada;
  final String? currentDasha;
  final Map<String, PlanetData> planets;
  final Map<String, dynamic> computed;

  ChartSummary({
    required this.name,
    required this.ascendantSign,
    required this.moonSign,
    required this.nakshatra,
    required this.pada,
    this.currentDasha,
    required this.planets,
    required this.computed,
  });

  factory ChartSummary.fromJson(Map<String, dynamic> json) {
    final planetMap = <String, PlanetData>{};
    if (json['planets'] is Map) {
      (json['planets'] as Map).forEach((k, v) {
        if (v is Map) {
          planetMap[k.toString()] = PlanetData.fromJson(k.toString(), Map<String, dynamic>.from(v));
        }
      });
    }

    return ChartSummary(
      name: json['name'] ?? 'Seeker',
      ascendantSign: json['ascendant_sign'] ?? '',
      moonSign: json['moon_sign'] ?? '',
      nakshatra: json['nakshatra'] ?? '',
      pada: json['pada'] ?? 1,
      currentDasha: json['current_dasha'],
      planets: planetMap,
      computed: json['computed'] ?? {},
    );
  }
}

class UserProfile {
  final String id;
  final BirthDetails? birthDetails;
  final ChartSummary? chartSummary;

  UserProfile({
    required this.id,
    this.birthDetails,
    this.chartSummary,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] ?? '',
      birthDetails: json['birth_details'] != null
          ? BirthDetails.fromJson(Map<String, dynamic>.from(json['birth_details']))
          : null,
      chartSummary: json['chart_summary'] != null
          ? ChartSummary.fromJson(Map<String, dynamic>.from(json['chart_summary']))
          : null,
    );
  }
}

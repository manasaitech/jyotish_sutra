import '../../../../core/models/astrology_models.dart';

abstract class ProfileRepository {
  Future<UserProfile> loadProfile(String profileId);
  Future<void> updateProfile(String profileId, BirthDetails details);
}

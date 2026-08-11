import '../../domain/repositories/profile_repository.dart';
import '../../../../core/models/astrology_models.dart';
import '../../../../core/network/api_service.dart';

class ProfileRepositoryImpl implements ProfileRepository {
  final ApiService _apiService;

  ProfileRepositoryImpl(this._apiService);

  @override
  Future<UserProfile> loadProfile(String profileId) async {
    final response = await _apiService.get('/api/profile/$profileId');
    final data = response.data;
    if (data == null) {
      throw Exception('Failed to load profile data');
    }
    // We add user_id inside payload manually for compatibility
    final Map<String, dynamic> raw = Map<String, dynamic>.from(data);
    raw['id'] = profileId;
    return UserProfile.fromJson(raw);
  }

  @override
  Future<void> updateProfile(String profileId, BirthDetails details) async {
    await _apiService.put(
      '/api/profile/$profileId',
      data: details.toJson(),
    );
  }
}

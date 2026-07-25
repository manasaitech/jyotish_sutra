import '../../domain/repositories/auth_repository.dart';
import '../../../../core/network/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthRepositoryImpl implements AuthRepository {
  final ApiService _apiService;

  AuthRepositoryImpl(this._apiService);

  @override
  Future<Map<String, dynamic>> verifyToken(String firebaseIdToken) async {
    final response = await _apiService.post('/api/auth/verify', data: {
      'token': firebaseIdToken,
    });
    
    final data = response.data;
    if (data != null && data['success'] == true) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', firebaseIdToken);
      
      final dbUser = data['db_user'] ?? {};
      final tier = dbUser['subscription_tier'] ?? 'free';
      await prefs.setString('subscription_tier', tier);
      await prefs.setString('user_id', dbUser['id'] ?? '');
      await prefs.setString('user_email', dbUser['email'] ?? '');
      await prefs.setString('user_name', dbUser['display_name'] ?? '');
    }
    return data ?? {};
  }

  @override
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('subscription_tier');
    await prefs.remove('user_id');
    await prefs.remove('user_email');
    await prefs.remove('user_name');
  }

  @override
  Future<bool> checkAuthStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    return token != null && token.isNotEmpty;
  }
}

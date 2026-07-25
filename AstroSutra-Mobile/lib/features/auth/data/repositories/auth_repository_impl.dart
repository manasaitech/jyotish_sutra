import '../../domain/repositories/auth_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthRepositoryImpl implements AuthRepository {
  @override
  Future<void> loginWithGoogle() async {
    // Placeholder login flow: simulate saving firebase auth token on success
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', 'mock_firebase_id_token_xyz');
  }

  @override
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  @override
  Future<bool> checkAuthStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    return token != null && token.isNotEmpty;
  }
}

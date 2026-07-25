abstract class AuthRepository {
  Future<Map<String, dynamic>> verifyToken(String firebaseIdToken);
  Future<void> logout();
  Future<bool> checkAuthStatus();
}

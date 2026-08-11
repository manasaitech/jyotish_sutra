abstract class AuthRepository {
  Future<void> signInWithGoogle();
  Future<Map<String, dynamic>> verifyToken(String firebaseIdToken);
  Future<void> logout();
  Future<bool> checkAuthStatus();
}

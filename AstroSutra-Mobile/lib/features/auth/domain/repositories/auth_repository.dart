import 'package:flutter_riverpod/flutter_riverpod.dart';

abstract class AuthRepository {
  Future<void> loginWithGoogle();
  Future<void> logout();
  Future<bool> checkAuthStatus();
}

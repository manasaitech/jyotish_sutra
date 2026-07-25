import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../../../../theme/colors.dart';
import '../../../../shared/widgets/premium_button.dart';

class GoogleLoginScreen extends ConsumerWidget {
  const GoogleLoginScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    ref.listen<AuthState>(authProvider, (previous, next) {
      if (next.status == AuthStatus.authenticated) {
        context.go('/dashboard');
      } else if (next.errorMessage != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Login failed: ${next.errorMessage}')),
        );
      }
    });

    return Scaffold(
      backgroundColor: AstroColors.lightBackground,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.fingerprint,
                size: 90,
                color: AstroColors.primary,
              ),
              const SizedBox(height: 24),
              const Text(
                'Access Premium Horoscopes',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AstroColors.lightTextPrimary,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Unlock custom Vimshottari timelines, 64 Kalas rankings, and unlimited planetary interpretations.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: AstroColors.lightTextSecondary,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 48),
              PremiumButton(
                text: 'Sign In With Google',
                isLoading: authState.status == AuthStatus.loading,
                icon: Icons.g_mobiledata,
                onTap: () => ref.read(authProvider.notifier).login(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

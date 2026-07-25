import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../../../profile/presentation/providers/profile_provider.dart';
import '../../../../theme/colors.dart';
import '../../../../shared/widgets/gochara_orbits.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkRedirect();
  }

  void _checkRedirect() async {
    await Future.delayed(const Duration(seconds: 4)); // Enjoy the gorgeous Gochara orbit animation!
    if (!mounted) return;
    
    final authState = ref.read(authProvider);
    if (authState.status == AuthStatus.authenticated) {
      try {
        await ref.read(profileProvider.notifier).fetchProfile();
        final profileState = ref.read(profileProvider);
        if (profileState.activeProfile?.birthDetails?.name != null &&
            profileState.activeProfile!.birthDetails!.name.isNotEmpty) {
          if (mounted) context.go('/dashboard');
        } else {
          if (mounted) context.go('/onboarding');
        }
      } catch (_) {
        if (mounted) context.go('/onboarding');
      }
    } else {
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AstroColors.lightBackground,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            GocharaOrbits(size: 220),
            SizedBox(height: 24),
            Text(
              'ASTROSUTRA AI',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                letterSpacing: 2,
                color: AstroColors.lightTextPrimary,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Cosmic Insights & Vedic Guidance',
              style: TextStyle(
                fontSize: 14,
                color: AstroColors.lightTextSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

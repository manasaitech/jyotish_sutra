import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../theme/colors.dart';
import '../../../../shared/widgets/premium_button.dart';

class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AstroColors.lightBackground,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),
              const Icon(Icons.explore, size: 100, color: AstroColors.primary),
              const SizedBox(height: 32),
              const Text(
                'Discover Your Cosmic Blueprint',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  color: AstroColors.lightTextPrimary,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'AstroSutra AI guides you through personalized Vedic horoscope calculations, career mappings, relationships matching, and interactive RAG-based Bhagavad Gita AI guidance.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 15,
                  color: AstroColors.lightTextSecondary,
                  height: 1.5,
                ),
              ),
              const Spacer(),
              PremiumButton(
                text: 'Begin Spiritual Journey',
                onTap: () => context.go('/login'),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

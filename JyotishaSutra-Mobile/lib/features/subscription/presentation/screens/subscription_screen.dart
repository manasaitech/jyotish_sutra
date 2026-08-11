import 'package:flutter/material.dart';
import '../../../../theme/colors.dart';
import '../../../../shared/widgets/premium_card.dart';
import '../../../../shared/widgets/premium_button.dart';

class SubscriptionScreen extends StatelessWidget {
  const SubscriptionScreen({super.key});

  Widget _buildFeatureItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          const Icon(Icons.star, color: AstroColors.secondary, size: 18),
          const SizedBox(width: 8),
          Text(text, style: const TextStyle(fontSize: 14)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Spiritual Upgrades'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            // Standard Tier Card
            PremiumCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Standard Plan',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  const Text('For focused Vedic seekers', style: TextStyle(fontSize: 12, color: AstroColors.lightTextSecondary)),
                  const SizedBox(height: 12),
                  const Text(
                    '₹399',
                    style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AstroColors.primary),
                  ),
                  const Text('/month (Sandbox Trial)', style: TextStyle(fontSize: 12, color: AstroColors.lightTextSecondary)),
                  const SizedBox(height: 16),
                  _buildFeatureItem('Detailed Vimshottari Mahadashas'),
                  _buildFeatureItem('Manglik & Kaal Sarp Analysis'),
                  _buildFeatureItem('25 AI Vedic Chat queries / day'),
                  const SizedBox(height: 16),
                  PremiumButton(
                    text: 'Unlock Standard Tier',
                    onTap: () {},
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            
            // Pro Tier Card
            PremiumCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Pro Plan',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  const Text('For comprehensive spiritual guidance', style: TextStyle(fontSize: 12, color: AstroColors.lightTextSecondary)),
                  const SizedBox(height: 12),
                  const Text(
                    '₹799',
                    style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AstroColors.secondary),
                  ),
                  const Text('/month', style: TextStyle(fontSize: 12, color: AstroColors.lightTextSecondary)),
                  const SizedBox(height: 16),
                  _buildFeatureItem('64 Kalas Student Receptivity'),
                  _buildFeatureItem('Kundli Match Compatibility Reports'),
                  _buildFeatureItem('Unlimited AI Vedic Chat queries'),
                  const SizedBox(height: 16),
                  PremiumButton(
                    text: 'Unlock Pro Tier',
                    onTap: () {},
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

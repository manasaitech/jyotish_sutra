import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../theme/colors.dart';
import '../../../../shared/widgets/premium_card.dart';
import '../../../profile/presentation/providers/profile_provider.dart';

class CareerScreen extends ConsumerWidget {
  const CareerScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileState = ref.watch(profileProvider);
    final profile = profileState.activeProfile;
    final chart = profile?.chartSummary;

    // Find planets in 10th house (Karma Bhava)
    final List<String> planetsIn10th = [];
    if (chart != null) {
      chart.planets.forEach((name, data) {
        if (data.house == 10) {
          planetsIn10th.add(data.name);
        }
      });
    }

    String careerText = 'No planets occupy your 10th house (Karma Bhava) directly. This points to a steady career trajectory determined primarily by the placement of your 10th house lord.';
    if (planetsIn10th.isNotEmpty) {
      final planetsStr = planetsIn10th.join(', ');
      careerText = '$planetsStr occupy your 10th house (Karma Bhava), signifying strong active professional drives. Your career path will be highly dynamic and guided by the energies of $planetsStr.';
    }

    return Scaffold(
      backgroundColor: AstroColors.lightBackground,
      appBar: AppBar(
        title: const Text('Career & Business'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            PremiumCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.work, color: AstroColors.primary),
                      SizedBox(width: 8),
                      Text('10th House (Karma Bhava) Analysis', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    careerText,
                    style: const TextStyle(fontSize: 14, height: 1.5, color: AstroColors.lightTextPrimary),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            PremiumCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Favorable Professional Fields', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  const SizedBox(height: 12),
                  _buildBullet('Leadership & Administration'),
                  _buildBullet('Professional Advisory & Consulting'),
                  _buildBullet('Strategic Business Ventures'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBullet(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.check_circle_outline, color: AstroColors.success, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 13, color: AstroColors.lightTextSecondary),
            ),
          ),
        ],
      ),
    );
  }
}

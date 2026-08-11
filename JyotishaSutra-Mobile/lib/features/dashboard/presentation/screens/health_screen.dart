import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../shared/widgets/premium_card.dart';
import '../../../profile/presentation/providers/profile_provider.dart';
import '../../../../theme/colors.dart';

class HealthScreen extends ConsumerWidget {
  const HealthScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileState = ref.watch(profileProvider);
    final profile = profileState.activeProfile;
    final chart = profile?.chartSummary;

    // Find planets in 6th house (Shatru/Roga Bhava)
    final List<String> planetsIn6th = [];
    if (chart != null) {
      chart.planets.forEach((name, data) {
        if (data.house == 6) {
          planetsIn6th.add(data.name);
        }
      });
    }

    String healthText = 'No major planets occupy your 6th house (Roga Bhava) directly. This suggests solid foundational physical resilience, with day-to-day vitality governed by the 6th lord\'s transit positions.';
    if (planetsIn6th.isNotEmpty) {
      final planetsStr = planetsIn6th.join(', ');
      healthText = '$planetsStr occupy your 6th house (Roga Bhava). Take extra care of wellness spheres governed by $planetsStr, maintaining balanced lifestyle routines.';
    }

    return Scaffold(
      backgroundColor: AstroColors.lightBackground,
      appBar: AppBar(
        title: const Text('Health & Vitality'),
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            PremiumCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.healing, color: Colors.red),
                      SizedBox(width: 8),
                      Text('6th House & Lagna Lord', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    healthText,
                    style: const TextStyle(fontSize: 14, height: 1.5, color: AstroColors.lightTextPrimary),
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

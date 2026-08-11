import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../shared/widgets/premium_card.dart';
import '../../../profile/presentation/providers/profile_provider.dart';
import '../../../../theme/colors.dart';

class RelationshipsScreen extends ConsumerWidget {
  const RelationshipsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileState = ref.watch(profileProvider);
    final profile = profileState.activeProfile;
    final chart = profile?.chartSummary;

    // Find planets in 7th house (Kalatra Bhava)
    final List<String> planetsIn7th = [];
    if (chart != null) {
      chart.planets.forEach((name, data) {
        if (data.house == 7) {
          planetsIn7th.add(data.name);
        }
      });
    }

    String houseText = 'No planets occupy your 7th house (Kalatra Bhava) in your natal chart. This indicates a steady, calm partnership dynamic where the 7th lord\'s placement governs the spouse\'s nature.';
    if (planetsIn7th.isNotEmpty) {
      final planetsStr = planetsIn7th.join(', ');
      houseText = '$planetsStr occupy your 7th house (Kalatra Bhava), actively influencing your marital and partnership dynamics. Expect traits associated with $planetsStr to be prominent in your significant connections.';
    }

    return Scaffold(
      backgroundColor: AstroColors.lightBackground,
      appBar: AppBar(
        title: const Text('Relationships'),
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
                      Icon(Icons.favorite, color: Colors.pink),
                      SizedBox(width: 8),
                      Text('7th House (Kalatra Bhava)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    houseText,
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

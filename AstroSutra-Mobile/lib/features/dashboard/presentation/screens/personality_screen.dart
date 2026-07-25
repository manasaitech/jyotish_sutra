import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../shared/widgets/premium_card.dart';
import '../../../profile/presentation/providers/profile_provider.dart';
import '../../../../theme/colors.dart';

class PersonalityScreen extends ConsumerWidget {
  const PersonalityScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileState = ref.watch(profileProvider);
    final profile = profileState.activeProfile;
    final chart = profile?.chartSummary;

    // Find planets in 1st house (Lagna - self/identity) and 5th house (mind/intelligence)
    final List<String> planetsIn1st = [];
    final List<String> planetsIn5th = [];
    if (chart != null) {
      chart.planets.forEach((name, data) {
        if (data.house == 1) {
          planetsIn1st.add(data.name);
        } else if (data.house == 5) {
          planetsIn5th.add(data.name);
        }
      });
    }

    String personalityText = '';
    final moonSign = chart?.moonSign ?? 'Cancer';
    final lagna = chart?.ascendantSign ?? 'Aries';

    final List<String> parts = [];
    parts.add('Your Lagna is $lagna and your Moon Sign (Rashi) is $moonSign, which shapes your basic psychological blueprint.');
    if (planetsIn1st.isNotEmpty) {
      parts.add('${planetsIn1st.join(", ")} occupy your 1st house, directly projecting their attributes onto your physical presence and outlook.');
    }
    if (planetsIn5th.isNotEmpty) {
      parts.add('The presence of ${planetsIn5th.join(", ")} in your 5th house (intellect and discretion) enhances your decision-making and creative inclinations.');
    } else {
      parts.add('Your 5th house of intellect is clear, suggesting a balanced, reflective mental process guided by your house lord.');
    }
    personalityText = parts.join(' ');

    return Scaffold(
      backgroundColor: AstroColors.lightBackground,
      appBar: AppBar(
        title: const Text('Mind & Personality'),
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
                      Icon(Icons.psychology, color: Colors.indigo),
                      SizedBox(width: 8),
                      Text('Moon Sign & 5th House Analysis', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    personalityText,
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

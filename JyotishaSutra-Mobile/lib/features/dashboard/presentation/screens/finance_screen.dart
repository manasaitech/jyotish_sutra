import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../shared/widgets/premium_card.dart';
import '../../../profile/presentation/providers/profile_provider.dart';
import '../../../../theme/colors.dart';

class FinanceScreen extends ConsumerWidget {
  const FinanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileState = ref.watch(profileProvider);
    final profile = profileState.activeProfile;
    final chart = profile?.chartSummary;

    // Find planets in 2nd and 11th houses (Wealth & Gain Bhava)
    final List<String> planetsIn2nd = [];
    final List<String> planetsIn11th = [];
    if (chart != null) {
      chart.planets.forEach((name, data) {
        if (data.house == 2) {
          planetsIn2nd.add(data.name);
        } else if (data.house == 11) {
          planetsIn11th.add(data.name);
        }
      });
    }

    String financeText = '';
    if (planetsIn2nd.isEmpty && planetsIn11th.isEmpty) {
      financeText = 'No planets occupy your 2nd (Dhana) or 11th (Labha) houses. Your financial growth is steady and guided by transit cycles of the house lords.';
    } else {
      final List<String> parts = [];
      if (planetsIn2nd.isNotEmpty) {
        parts.add('${planetsIn2nd.join(", ")} in the 2nd house (assets accumulation)');
      }
      if (planetsIn11th.isNotEmpty) {
        parts.add('${planetsIn11th.join(", ")} in the 11th house (revenue and profits)');
      }
      financeText = 'Your wealth houses are active: ${parts.join(" and ")}. This highlights multiple avenues for strategic asset building and financial success.';
    }

    return Scaffold(
      backgroundColor: AstroColors.lightBackground,
      appBar: AppBar(
        title: const Text('D2 Hora Wealth'),
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
                      Icon(Icons.account_balance_wallet, color: Colors.amber),
                      SizedBox(width: 8),
                      Text('2nd & 11th House Analysis', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    financeText,
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

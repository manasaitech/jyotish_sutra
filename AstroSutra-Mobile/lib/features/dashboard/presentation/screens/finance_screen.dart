import 'package:flutter/material.dart';
import '../../../../shared/widgets/premium_card.dart';

class FinanceScreen extends StatelessWidget {
  const FinanceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('D2 Hora Wealth'),
      ),
      body: const Padding(
        padding: EdgeInsets.all(20.0),
        child: Column(
          children: [
            PremiumCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.account_balance_wallet, color: Colors.amber),
                      SizedBox(width: 8),
                      Text('2nd & 11th House Analysis', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ],
                  ),
                  SizedBox(height: 12),
                  Text('Mercury ruling the 2nd house ensures logical analytical skills in assets accumulation. D2 Hora chart indicates Saturn influence, meaning slow but extremely solid financial development.'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../../../../shared/widgets/premium_card.dart';

class HealthScreen extends StatelessWidget {
  const HealthScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Health & Vitality'),
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
                      Icon(Icons.healing, color: Colors.red),
                      SizedBox(width: 8),
                      Text('6th House & Lagna Lord', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ],
                  ),
                  SizedBox(height: 12),
                  Text('Lagna lord Mars in a strong position ensures rapid recovery and robust immunity. Aspect of Saturn on the 6th house advises monitoring joint and bone wellness.'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

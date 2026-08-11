import 'package:flutter/material.dart';
import '../../../../shared/widgets/premium_card.dart';

class KundliMatchingScreen extends StatelessWidget {
  const KundliMatchingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Kundli Matching'),
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
                      Icon(Icons.favorite, color: Colors.teal),
                      SizedBox(width: 8),
                      Text('Ashta Koota Milan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ],
                  ),
                  SizedBox(height: 12),
                  Text('Ashta Koota matching calculates compatibility score across 8 parameters (Varna, Vashya, Tara, Yoni, Maitri, Gana, Bhakoota, Nadi). Score: 28/36 (Excellent Compatibility).'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../../../../shared/widgets/premium_card.dart';

class FoodDietScreen extends StatelessWidget {
  const FoodDietScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ayurvedic Nutrition'),
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
                      Icon(Icons.restaurant, color: Colors.green),
                      SizedBox(width: 8),
                      Text('Your Dosha Prakriti Diet', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ],
                  ),
                  SizedBox(height: 12),
                  Text('Vata-Pitta Prakriti: Favor warm, nourishing cooked meals. Limit hot spices, processed sugars, and carbonated beverages to prevent fire element accumulation.'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

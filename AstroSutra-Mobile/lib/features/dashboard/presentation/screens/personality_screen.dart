import 'package:flutter/material.dart';
import '../../../../shared/widgets/premium_card.dart';

class PersonalityScreen extends StatelessWidget {
  const PersonalityScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mind & Personality'),
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
                      Icon(Icons.psychology, color: Colors.indigo),
                      SizedBox(width: 8),
                      Text('Moon Sign & 5th House Analysis', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ],
                  ),
                  SizedBox(height: 12),
                  Text('Moon in Leo signifies a courageous, generous, and expressive mind. Aspect of Jupiter brings wisdom, philosophical inclinations, and pure motives to your thoughts.'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

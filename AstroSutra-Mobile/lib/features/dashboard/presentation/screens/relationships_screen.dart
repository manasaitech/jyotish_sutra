import 'package:flutter/material.dart';
import '../../../../shared/widgets/premium_card.dart';

class RelationshipsScreen extends StatelessWidget {
  const RelationshipsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Relationships'),
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
                      Icon(Icons.favorite, color: Colors.pink),
                      SizedBox(width: 8),
                      Text('7th House (Kalatra Bhava)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ],
                  ),
                  SizedBox(height: 12),
                  Text('Jupiter occupies your 7th house, promising a loyal, educated, and supportive partner. Aspect of Mars suggests occasional passionate disputes but robust dynamic support.'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

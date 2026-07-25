import 'package:flutter/material.dart';
import '../../../../shared/widgets/premium_card.dart';

class DashaTimelineScreen extends StatelessWidget {
  const DashaTimelineScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Vimshottari Dasha'),
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
                      Icon(Icons.timeline, color: Colors.purple),
                      SizedBox(width: 8),
                      Text('Current Mahadasha Period', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ],
                  ),
                  SizedBox(height: 12),
                  Text('Jupiter Mahadasha (Guru) from 2018-05-10 to 2034-05-10.\nActive Antardasha: Mercury (Budha) from 2023-11-20 to 2026-02-28.'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

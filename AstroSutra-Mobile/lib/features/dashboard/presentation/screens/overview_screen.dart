import 'package:flutter/material.dart';
import '../../../../theme/colors.dart';
import '../../../../shared/widgets/premium_card.dart';

class OverviewScreen extends StatelessWidget {
  const OverviewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Kundli Overview'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const PremiumCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Your Natal Ascendant',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  SizedBox(height: 8),
                  Text('Lagna: Aries (Mesha) · Moon Sign: Leo (Simha) · Nakshatra: Magha · Pada: 2'),
                  SizedBox(height: 12),
                  Divider(),
                  SizedBox(height: 12),
                  Text(
                    'Basic Panchanga Attributes',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  SizedBox(height: 6),
                  Text('Tithi: Shukla Paksha Dashami\nYoga: Sukarma\nKarana: Garaja\nWeekday: Thursday'),
                ],
              ),
            ),
            const SizedBox(height: 16),
            PremiumCard(
              child: Container(
                height: 300,
                alignment: Alignment.center,
                child: const Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.grid_3x3, size: 60, color: AstroColors.primary),
                    SizedBox(height: 12),
                    Text('Vedic Janma Kundli Chart Visualization', style: TextStyle(fontWeight: FontWeight.bold)),
                    SizedBox(height: 6),
                    Text('Planets mapped to corresponding houses', style: TextStyle(color: AstroColors.lightTextSecondary)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../../../../theme/colors.dart';
import '../../../../shared/widgets/premium_card.dart';

class PdfViewerScreen extends StatelessWidget {
  const PdfViewerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Report Preview'),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            onPressed: () {},
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            Expanded(
              child: PremiumCard(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.description, size: 80, color: AstroColors.primary.withValues(alpha: 0.4)),
                      const SizedBox(height: 16),
                      const Text(
                        'JyotishaSutra Janma Kundli Report',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      const SizedBox(height: 8),
                      const Text('Page 1 of 42', style: TextStyle(color: AstroColors.lightTextSecondary)),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                ElevatedButton(
                  onPressed: () {},
                  child: const Text('Previous'),
                ),
                ElevatedButton(
                  onPressed: () {},
                  child: const Text('Next Page'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

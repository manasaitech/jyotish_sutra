import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../theme/colors.dart';
import '../../../../shared/widgets/premium_card.dart';

class ReportsScreen extends StatelessWidget {
  const ReportsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Spiritual Reports'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20.0),
        children: [
          PremiumCard(
            onTap: () => context.push('/reports/pdf-viewer'),
            child: const Row(
              children: [
                Icon(Icons.picture_as_pdf, color: AstroColors.error, size: 36),
                SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Full 64 Kalas Horoscope Report',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      SizedBox(height: 4),
                      Text('PDF generated on: 2026-07-24 · Size: 2.4 MB', style: TextStyle(fontSize: 12)),
                    ],
                  ),
                ),
                Icon(Icons.download_outlined, color: AstroColors.primary),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

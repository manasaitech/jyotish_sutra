import 'package:flutter/material.dart';
import '../../../../theme/colors.dart';
import '../../../../shared/widgets/premium_card.dart';

class ChatScreen extends StatelessWidget {
  const ChatScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Vedic AI Guide'),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20.0),
              children: [
                const PremiumCard(
                  child: Text(
                    'Namaste. Ask me anything about your kundli, career, relationships, remedies, or seek guidance from the Bhagavad Gita.',
                    style: TextStyle(height: 1.4),
                  ),
                ),
                const SizedBox(height: 16),
                Align(
                  alignment: Alignment.centerRight,
                  child: PremiumCard(
                    color: AstroColors.primaryContainer,
                    child: Text(
                      'When will my career transition happen?',
                      style: TextStyle(
                        color: isDark ? Colors.black87 : AstroColors.lightTextPrimary,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark ? AstroColors.darkSurface : AstroColors.lightSurface,
              border: Border(
                top: BorderSide(color: isDark ? Colors.white10 : AstroColors.outline),
              ),
            ),
            child: Row(
              children: [
                const Expanded(
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: 'Type cosmic query...',
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(horizontal: 16),
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.send, color: AstroColors.primary),
                  onPressed: () {},
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

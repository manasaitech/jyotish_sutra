import 'package:flutter/material.dart';
import '../../../../theme/colors.dart';
import '../../../../shared/widgets/premium_card.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profiles'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20.0),
        children: [
          const PremiumCard(
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: AstroColors.primaryContainer,
                  child: Icon(Icons.person, color: AstroColors.primary, size: 30),
                ),
                SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Anmol Dixit',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                    ),
                    SizedBox(height: 4),
                    Text('anmoldixit091@gmail.com', style: TextStyle(color: AstroColors.lightTextSecondary)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Sub-Profiles',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          PremiumCard(
            padding: EdgeInsets.zero,
            child: ListTile(
              leading: const Icon(Icons.favorite_border, color: Colors.pink),
              title: const Text('Spouse (Riya)'),
              subtitle: const Text('Born: 1996-08-12 · 09:15 AM · Delhi'),
              trailing: const Icon(Icons.edit_outlined),
              onTap: () {},
            ),
          ),
        ],
      ),
    );
  }
}

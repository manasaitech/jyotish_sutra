import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../theme/colors.dart';
import '../../../../shared/widgets/premium_card.dart';
import '../../../profile/presentation/providers/profile_provider.dart';

class TemperamentDefinition {
  final String id;
  final String name;
  final String devanagari;
  final String element;
  final IconData icon;
  final Color color;
  final Color bg;
  final String coreTraits;
  final String strengths;
  final String challenges;
  final String astrologicalBasis;
  final String recommendations;

  const TemperamentDefinition({
    required this.id,
    required this.name,
    required this.devanagari,
    required this.element,
    required this.icon,
    required this.color,
    required this.bg,
    required this.coreTraits,
    required this.strengths,
    required this.challenges,
    required this.astrologicalBasis,
    required this.recommendations,
  });
}

const List<TemperamentDefinition> temperaments = [
  TemperamentDefinition(
    id: 'choleric',
    name: 'Choleric',
    devanagari: 'तेजस्वी (Agni)',
    element: 'Fire (Agni)',
    icon: Icons.local_fire_department,
    color: Colors.red,
    bg: Colors.red,
    coreTraits: 'Ambitious, decisive, confident',
    strengths: 'Leadership, determination, visionary drive',
    challenges: 'Impatient, controlling, prone to burnout',
    astrologicalBasis: 'Driven by Sun, Mars & Fire signs (Aries, Leo, Sagittarius). High energy and competitive instinct.',
    recommendations: 'Practice patience, delegate responsibilities, and use evening breathwork to cool fiery intensity.',
  ),
  TemperamentDefinition(
    id: 'sanguine',
    name: 'Sanguine',
    devanagari: 'उत्सही (Vayu)',
    element: 'Air (Vayu)',
    icon: Icons.wb_sunny,
    color: Colors.orange,
    bg: Colors.orange,
    coreTraits: 'Energetic, social, optimistic',
    strengths: 'Friendly, enthusiastic, quick communicator',
    challenges: 'Easily distracted, impulsive, superficial focus',
    astrologicalBasis: 'Driven by Mercury, Venus & Air signs (Gemini, Libra, Aquarius). Rapid intellectual curiosity.',
    recommendations: 'Structure daily priorities into single-task deep work blocks to channel creative enthusiasm.',
  ),
  TemperamentDefinition(
    id: 'melancholic',
    name: 'Melancholic',
    devanagari: 'विचारशील (Prithvi)',
    element: 'Earth (Prithvi)',
    icon: Icons.thunderstorm,
    color: Colors.teal,
    bg: Colors.teal,
    coreTraits: 'Thoughtful, analytical, perfectionistic',
    strengths: 'Organized, creative, deep attention to detail',
    challenges: 'Overthinking, pessimism, self-criticism',
    astrologicalBasis: 'Driven by Saturn, Mercury & Earth signs (Taurus, Virgo, Capricorn). Methodical and grounded.',
    recommendations: 'Set time limits on planning, practice self-compassion, and avoid perfectionism traps.',
  ),
  TemperamentDefinition(
    id: 'phlegmatic',
    name: 'Phlegmatic',
    devanagari: 'शान्त (Jala)',
    element: 'Water (Jala)',
    icon: Icons.water_drop,
    color: Colors.blue,
    bg: Colors.blue,
    coreTraits: 'Calm, patient, dependable',
    strengths: 'Peaceful, loyal, empathetic listening',
    challenges: 'Avoids conflict, resistant to change, passive',
    astrologicalBasis: 'Driven by Moon, Venus & Water signs (Cancer, Scorpio, Pisces). Emotional depth and stability.',
    recommendations: 'Embrace healthy confrontation, take proactive initiative, and engage in daily physical exercise.',
  ),
];

class PersonalityScreen extends ConsumerStatefulWidget {
  const PersonalityScreen({super.key});

  @override
  ConsumerState<PersonalityScreen> createState() => _PersonalityScreenState();
}

class _PersonalityScreenState extends ConsumerState<PersonalityScreen> {
  String? _selectedTempId;

  @override
  Widget build(BuildContext context) {
    final profileState = ref.watch(profileProvider);
    final profile = profileState.activeProfile;
    final chart = profile?.chartSummary;

    if (profileState.isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: AstroColors.primary),
        ),
      );
    }

    // Dynamic Astrological Four Temperaments Calculation Engine
    final fireSigns = ['aries', 'leo', 'sagittarius'];
    final airSigns = ['gemini', 'libra', 'aquarius'];
    final earthSigns = ['taurus', 'virgo', 'capricorn'];
    final waterSigns = ['cancer', 'scorpio', 'pisces'];

    double firePts = 0;
    double airPts = 0;
    double earthPts = 0;
    double waterPts = 0;

    if (chart != null) {
      // 1. Ascendant / Lagna weighting (+3 points)
      final ascSign = chart.ascendantSign.toLowerCase().trim();
      if (fireSigns.contains(ascSign)) {
        firePts += 3;
      } else if (airSigns.contains(ascSign)) {
        airPts += 3;
      } else if (earthSigns.contains(ascSign)) {
        earthPts += 3;
      } else if (waterSigns.contains(ascSign)) {
        waterPts += 3;
      }

      // 2. Planets weighting
      chart.planets.forEach((pName, pData) {
        final s = pData.sign.toLowerCase().trim();
        final nameLower = pName.toLowerCase();
        final weight = (nameLower == 'sun' || nameLower == 'moon') ? 2 : 1;

        if (fireSigns.contains(s)) {
          firePts += weight;
        } else if (airSigns.contains(s)) {
          airPts += weight;
        } else if (earthSigns.contains(s)) {
          earthPts += weight;
        } else if (waterSigns.contains(s)) {
          waterPts += weight;
        }
      });

      // 3. Fallback check from computed.elements
      final elements = chart.computed['elements'] as Map?;
      if (elements != null) {
        if (elements['Fire'] != null) firePts += (elements['Fire'] as num).toDouble() / 10;
        if (elements['Air'] != null) airPts += (elements['Air'] as num).toDouble() / 10;
        if (elements['Earth'] != null) earthPts += (elements['Earth'] as num).toDouble() / 10;
        if (elements['Water'] != null) waterPts += (elements['Water'] as num).toDouble() / 10;
      }
    }

    // Default fallbacks if calculations results in 0
    if (firePts + airPts + earthPts + waterPts == 0) {
      firePts = 4;
      airPts = 3;
      earthPts = 2;
      waterPts = 2;
    }

    final totalPts = firePts + airPts + earthPts + waterPts;
    final int fireScore = ((firePts / totalPts) * 100).round();
    final int airScore = ((airPts / totalPts) * 100).round();
    final int earthScore = ((earthPts / totalPts) * 100).round();
    final int waterScore = (100 - (fireScore + airScore + earthScore)).clamp(0, 100);

    final Map<String, int> scoresMap = {
      'choleric': fireScore,
      'sanguine': airScore,
      'melancholic': earthScore,
      'phlegmatic': waterScore,
    };

    // Sort temperaments by score to find dominant & secondary
    final List<TemperamentDefinition> sortedTemps = List.from(temperaments);
    sortedTemps.sort((a, b) => (scoresMap[b.id] ?? 0).compareTo(scoresMap[a.id] ?? 0));

    final dominantTemp = sortedTemps[0];
    final secondaryTemp = sortedTemps[1];

    _selectedTempId ??= dominantTemp.id;
    final activeTemp = temperaments.firstWhere((t) => t.id == _selectedTempId, orElse: () => dominantTemp);

    return Scaffold(
      backgroundColor: AstroColors.lightBackground,
      appBar: AppBar(
        title: const Text('Mind & Personality'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Vedic Psychology Header Banner
            PremiumCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Vedic Psychology',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AstroColors.lightTextPrimary),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AstroColors.primary.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text(
                          'DYNAMIC ANALYSIS',
                          style: TextStyle(color: AstroColors.primary, fontSize: 9, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Temperament distribution calculated dynamically from your natal chart\'s elemental distribution and planetary dignities.',
                    style: TextStyle(fontSize: 12, height: 1.4, color: AstroColors.lightTextSecondary),
                  ),
                  const SizedBox(height: 16),
                  const Divider(),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Dominant Element', style: TextStyle(fontSize: 11, color: AstroColors.lightTextSecondary)),
                            const SizedBox(height: 4),
                            Text(
                              '${dominantTemp.name} (${scoresMap[dominantTemp.id]}%)',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AstroColors.primary),
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Secondary Element', style: TextStyle(fontSize: 11, color: AstroColors.lightTextSecondary)),
                            const SizedBox(height: 4),
                            Text(
                              '${secondaryTemp.name} (${scoresMap[secondaryTemp.id]}%)',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AstroColors.lightTextPrimary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 2. Elements Distribution Bars
            const Text(
              'Elemental Balance',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AstroColors.lightTextPrimary),
            ),
            const SizedBox(height: 12),
            PremiumCard(
              child: Column(
                children: temperaments.map((t) {
                  final score = scoresMap[t.id] ?? 0;
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '${t.name} (${t.element})',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            Text(
                              '$score%',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: t.color),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: score / 100,
                            backgroundColor: AstroColors.primary.withOpacity(0.08),
                            valueColor: AlwaysStoppedAnimation<Color>(t.color),
                            minHeight: 8,
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 24),

            // 3. Interactive Tab Panels for each Temperament
            const Text(
              'Temperament Details',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AstroColors.lightTextPrimary),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: temperaments.map((t) {
                final isSelected = _selectedTempId == t.id;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4.0),
                    child: ElevatedButton(
                      onPressed: () => setState(() => _selectedTempId = t.id),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isSelected ? t.color : Colors.white,
                        foregroundColor: isSelected ? Colors.white : AstroColors.lightTextPrimary,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        elevation: isSelected ? 3 : 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                          side: BorderSide(color: isSelected ? Colors.transparent : AstroColors.primary.withOpacity(0.15)),
                        ),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(t.icon, size: 18),
                          const SizedBox(height: 4),
                          Text(t.name.substring(0, math.min(4, t.name.length)), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),

            // Detailed Card
            PremiumCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(activeTemp.icon, color: activeTemp.color),
                      const SizedBox(width: 10),
                      Text(
                        '${activeTemp.name} · ${activeTemp.devanagari}',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AstroColors.lightTextPrimary),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildDetailRow('Core Traits', activeTemp.coreTraits),
                  _buildDetailRow('Key Strengths', activeTemp.strengths),
                  _buildDetailRow('Challenges', activeTemp.challenges),
                  _buildDetailRow('Astrological Basis', activeTemp.astrologicalBasis),
                  _buildDetailRow('Guidance & Remediy', activeTemp.recommendations),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String title, String desc) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AstroColors.primary),
          ),
          const SizedBox(height: 4),
          Text(
            desc,
            style: const TextStyle(fontSize: 13, height: 1.4, color: AstroColors.lightTextSecondary),
          ),
        ],
      ),
    );
  }
}

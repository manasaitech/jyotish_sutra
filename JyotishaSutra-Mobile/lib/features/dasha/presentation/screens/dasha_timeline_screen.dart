import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/dasha_provider.dart';
import '../../../../theme/colors.dart';
import '../../../../shared/widgets/premium_card.dart';
import '../../../../shared/widgets/computing_card.dart';

class DashaTimelineScreen extends ConsumerStatefulWidget {
  const DashaTimelineScreen({super.key});

  @override
  ConsumerState<DashaTimelineScreen> createState() => _DashaTimelineScreenState();
}

class _DashaTimelineScreenState extends ConsumerState<DashaTimelineScreen> {
  final TextEditingController _yearSearchController = TextEditingController();
  String? _selectedMahadashaPlanet;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(dashaProvider.notifier).getDashaTimeline();
    });
    _yearSearchController.text = DateTime.now().year.toString();
  }

  @override
  void dispose() {
    _yearSearchController.dispose();
    super.dispose();
  }

  Color _getPlanetColor(String planet) {
    planet = planet.toLowerCase();
    if (planet.contains('sun')) return Colors.orange;
    if (planet.contains('moon')) return Colors.blue.shade300;
    if (planet.contains('mars')) return Colors.red;
    if (planet.contains('mercury')) return Colors.green;
    if (planet.contains('jupiter')) return Colors.amber;
    if (planet.contains('venus')) return Colors.purple;
    if (planet.contains('saturn')) return Colors.blueGrey;
    if (planet.contains('rahu')) return Colors.indigo;
    if (planet.contains('ketu')) return Colors.brown;
    return AstroColors.primary;
  }

  @override
  Widget build(BuildContext context) {
    final dashaState = ref.watch(dashaProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (dashaState.isLoading) {
      return const Scaffold(
        body: Center(
          child: Padding(
            padding: EdgeInsets.all(24.0),
            child: CelestialComputingCard(),
          ),
        ),
      );
    }

    final data = dashaState.timelineData;
    final current = data?['current_mahadasha'] as Map?;
    final currentAntardasha = data?['current_antardasha'] as Map?;
    final aiInterpretation = data?['ai_interpretation'] as Map?;
    final timeline = data?['timeline'] as List?;
    final yearLookupResult = data?['year_lookup'] as Map?;

    return Scaffold(
      backgroundColor: AstroColors.lightBackground,
      appBar: AppBar(
        title: const Text('Vimshottari Dasha'),
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(dashaProvider.notifier).getDashaTimeline(
              year: int.tryParse(_yearSearchController.text),
            ),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (dashaState.errorMessage != null) ...[
                PremiumCard(
                  color: AstroColors.error.withOpacity(0.1),
                  borderWidth: 1,
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: AstroColors.error),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Error loading dasha: ${dashaState.errorMessage}',
                          style: const TextStyle(color: AstroColors.error, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],
              // 1. Search Active Dasha by Year
              PremiumCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.manage_search, color: AstroColors.primary),
                        SizedBox(width: 8),
                        Text('Search Active Dasha by Year', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Find which Mahadasha & Antardasha will be active in any year of your life.',
                      style: TextStyle(fontSize: 12, color: AstroColors.lightTextSecondary),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _yearSearchController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              hintText: 'e.g. 2035',
                              border: OutlineInputBorder(),
                              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        ElevatedButton.icon(
                          onPressed: () {
                            final y = int.tryParse(_yearSearchController.text.trim());
                            if (y != null) {
                              ref.read(dashaProvider.notifier).getDashaTimeline(year: y);
                            }
                          },
                          icon: const Icon(Icons.search),
                          label: const Text('Inspect'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AstroColors.primary,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                        ),
                      ],
                    ),
                    if (yearLookupResult != null) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.amber.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.amber.withOpacity(0.3)),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 16,
                              backgroundColor: _getPlanetColor(yearLookupResult['mahadasha']['planet_name']),
                              child: Text(
                                yearLookupResult['mahadasha']['planet_name'].toString().substring(0, 2).toUpperCase(),
                                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'Active in ${yearLookupResult['target_year']}: ${yearLookupResult['mahadasha']['planet_name']} Mahadasha (${yearLookupResult['mahadasha']['start_date'].toString().substring(0, 4)} - ${yearLookupResult['mahadasha']['end_date'].toString().substring(0, 4)})',
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // 2. Current Active Mahadasha & Antardasha
              if (current != null) ...[
                const Text(
                  'Current Active Period',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AstroColors.lightTextPrimary),
                ),
                const SizedBox(height: 12),
                PremiumCard(
                  color: AstroColors.primary,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 22,
                            backgroundColor: Colors.white.withOpacity(0.2),
                            child: const Icon(Icons.timeline, color: Colors.white, size: 26),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${current['planet_name']} Mahadasha',
                                  style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Duration: ${current['start_date']} to ${current['end_date']}',
                                  style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              'ACTIVE',
                              style: TextStyle(color: AstroColors.primary, fontSize: 10, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                      if (currentAntardasha != null) ...[
                        const SizedBox(height: 14),
                        const Divider(color: Colors.white24),
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Current Antardasha (Sub-period):',
                              style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 12),
                            ),
                            Text(
                              currentAntardasha['combination'] ?? '',
                              style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: (currentAntardasha['progress'] as num?)?.toDouble() ?? 0.0,
                            backgroundColor: Colors.white24,
                            valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                            minHeight: 6,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '${currentAntardasha['remaining_formatted'] ?? ''} remaining in this sub-period.',
                          style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 11),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],

              // 3. AI Interpretations Card
              if (aiInterpretation != null) ...[
                const Text(
                  'Dasha AI Interpretations',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AstroColors.lightTextPrimary),
                ),
                const SizedBox(height: 12),
                PremiumCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.psychology, color: AstroColors.primary),
                          SizedBox(width: 8),
                          Text('Cosmic Period Guidance', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        aiInterpretation['summary'] ?? '',
                        style: const TextStyle(fontSize: 13, height: 1.45, color: AstroColors.lightTextSecondary),
                      ),
                      const SizedBox(height: 14),
                      const Divider(),
                      const SizedBox(height: 10),
                      const Text('Life Focus Areas:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(height: 8),
                      _buildFocusRow('Career & Finance', aiInterpretation['focus_areas']?['career'] ?? ''),
                      _buildFocusRow('Relationships', aiInterpretation['focus_areas']?['relationships'] ?? ''),
                      _buildFocusRow('Health & Vitality', aiInterpretation['focus_areas']?['health'] ?? ''),
                      _buildFocusRow('Spiritual Path', aiInterpretation['focus_areas']?['spiritual'] ?? ''),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],

              // 4. Sequential Timeline
              const Text(
                'Complete Vimshottari Sequence',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AstroColors.lightTextPrimary),
              ),
              const SizedBox(height: 12),
              if (timeline != null)
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: timeline.length,
                  itemBuilder: (context, index) {
                    final mahadasha = Map<String, dynamic>.from(timeline[index]);
                    final planetName = mahadasha['planet_name'].toString();
                    final start = mahadasha['start_date'] ?? '';
                    final end = mahadasha['end_date'] ?? '';
                    final duration = mahadasha['duration_years'] ?? 0;
                    final isCurrent = mahadasha['status'] == 'current';
                    final isExpanded = _selectedMahadashaPlanet == mahadasha['planet'];

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12.0),
                      child: PremiumCard(
                        borderWidth: isCurrent ? 2 : 1,
                        color: isCurrent 
                            ? (isDark ? AstroColors.primary.withOpacity(0.12) : AstroColors.primaryContainer.withOpacity(0.3))
                            : null,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ListTile(
                              contentPadding: EdgeInsets.zero,
                              leading: CircleAvatar(
                                backgroundColor: _getPlanetColor(planetName),
                                child: Text(
                                  planetName.substring(0, math.min(2, planetName.length)).toUpperCase(),
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white),
                                ),
                              ),
                              title: Text(
                                '$planetName Mahadasha',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                  color: isCurrent ? AstroColors.primary : null,
                                ),
                              ),
                              subtitle: Text(
                                '$start to $end ($duration yrs)',
                                style: const TextStyle(fontSize: 12, color: AstroColors.lightTextSecondary),
                              ),
                              trailing: Icon(
                                isExpanded ? Icons.expand_less : Icons.expand_more,
                                color: AstroColors.lightTextSecondary,
                              ),
                              onTap: () {
                                setState(() {
                                  if (isExpanded) {
                                    _selectedMahadashaPlanet = null;
                                  } else {
                                    _selectedMahadashaPlanet = mahadasha['planet'];
                                  }
                                });
                              },
                            ),
                            if (isExpanded && mahadasha['antardashas'] is List) ...[
                              const Divider(),
                              const SizedBox(height: 8),
                              const Text(
                                'Antardashas (Sub-Periods)',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                              const SizedBox(height: 8),
                              ListView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: (mahadasha['antardashas'] as List).length,
                                itemBuilder: (context, subIndex) {
                                  final antardasha = Map<String, dynamic>.from(mahadasha['antardashas'][subIndex]);
                                  final comb = antardasha['combination'] ?? '';
                                  final startD = antardasha['start_date'] ?? '';
                                  final endD = antardasha['end_date'] ?? '';
                                  final subStatus = antardasha['status'];
                                  final subIsCurrent = subStatus == 'current';

                                  return Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 6.0),
                                    child: Row(
                                      children: [
                                        Icon(
                                          subStatus == 'completed'
                                              ? Icons.check_circle
                                              : subIsCurrent
                                                  ? Icons.play_circle_fill
                                                  : Icons.radio_button_unchecked,
                                          color: subIsCurrent
                                              ? AstroColors.primary
                                              : subStatus == 'completed'
                                                  ? AstroColors.success
                                                  : AstroColors.lightTextSecondary.withOpacity(0.5),
                                          size: 18,
                                        ),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                comb,
                                                style: TextStyle(
                                                  fontWeight: subIsCurrent ? FontWeight.bold : FontWeight.normal,
                                                  fontSize: 13,
                                                ),
                                              ),
                                              const SizedBox(height: 2),
                                              Text(
                                                '$startD to $endD',
                                                style: const TextStyle(fontSize: 11, color: AstroColors.lightTextSecondary),
                                              ),
                                            ],
                                          ),
                                        ),
                                        if (subIsCurrent)
                                          const Text(
                                            'ACTIVE',
                                            style: TextStyle(
                                              color: AstroColors.primary,
                                              fontSize: 9,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                      ],
                                    ),
                                  );
                                },
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFocusRow(String title, String desc) {
    if (desc.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.circle, size: 6, color: AstroColors.primary),
          const SizedBox(width: 8),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: const TextStyle(fontSize: 12, color: AstroColors.lightTextSecondary, height: 1.3),
                children: [
                  TextSpan(text: '$title: ', style: const TextStyle(fontWeight: FontWeight.bold, color: AstroColors.lightTextPrimary)),
                  TextSpan(text: desc),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

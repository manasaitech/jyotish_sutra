import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/dasha_provider.dart';
import '../../../../theme/colors.dart';
import '../../../../shared/widgets/premium_card.dart';
import '../../../../shared/widgets/loading_indicator.dart';

class DashaTimelineScreen extends ConsumerStatefulWidget {
  const DashaTimelineScreen({super.key});

  @override
  ConsumerState<DashaTimelineScreen> createState() => _DashaTimelineScreenState();
}

class _DashaTimelineScreenState extends ConsumerState<DashaTimelineScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(dashaProvider.notifier).getDashaTimeline());
  }

  @override
  Widget build(BuildContext context) {
    final dashaState = ref.watch(dashaProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (dashaState.isLoading) {
      return const Scaffold(
        body: CelestialLoader(message: 'Calculating Vimshottari Mahadasha timeline...'),
      );
    }

    final data = dashaState.timelineData;
    final current = data?['current_mahadasha'] as Map?;
    final timeline = data?['timeline'] as List?;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Vimshottari Dasha'),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(dashaProvider.notifier).getDashaTimeline(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Current Mahadasha Card
              if (current != null) ...[
                PremiumCard(
                  color: AstroColors.primary,
                  child: Row(
                    children: [
                      const Icon(Icons.timeline, color: Colors.white, size: 50),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Current Mahadasha Period',
                              style: TextStyle(color: Colors.white, fontSize: 13),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${current['planet'].toString().toUpperCase()} Period',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'From: ${current['start_date']} to ${current['end_date']}',
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.9),
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],

              if (dashaState.errorMessage != null) ...[
                Text(
                  'Error: ${dashaState.errorMessage}',
                  style: const TextStyle(color: AstroColors.error),
                ),
                const SizedBox(height: 16),
              ],

              const Text(
                'Complete Mahadasha Sequence',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),

              if (timeline != null)
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: timeline.length,
                  itemBuilder: (context, index) {
                    final item = Map<String, dynamic>.from(timeline[index]);
                    final planet = item['planet'].toString().toUpperCase();
                    final start = item['start_date'] ?? '';
                    final end = item['end_date'] ?? '';
                    final isCurrent = item['is_current'] == true;

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12.0),
                      child: PremiumCard(
                        borderWidth: isCurrent ? 2 : 1,
                        color: isCurrent 
                          ? (isDark ? AstroColors.primary.withOpacity(0.15) : AstroColors.primaryContainer.withOpacity(0.4))
                          : null,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  planet,
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15,
                                    color: isCurrent ? AstroColors.primary : null,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '$start to $end',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: AstroColors.lightTextSecondary,
                                  ),
                                ),
                              ],
                            ),
                            if (isCurrent)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AstroColors.primary,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Text(
                                  'ACTIVE',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
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
}

import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../theme/colors.dart';
import '../../../../shared/widgets/premium_card.dart';
import '../../../profile/presentation/providers/profile_provider.dart';

class OverviewScreen extends ConsumerWidget {
  const OverviewScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileState = ref.watch(profileProvider);
    final profile = profileState.activeProfile;

    if (profileState.isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: AstroColors.primary),
        ),
      );
    }

    if (profile == null || profile.chartSummary == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Kundli Overview'),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 60, color: AstroColors.lightTextSecondary),
                const SizedBox(height: 16),
                const Text(
                  'No Astrological Details Found',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Please fill out your birth details in onboarding first.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AstroColors.lightTextSecondary),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Go Back'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final chart = profile.chartSummary!;
    final details = profile.birthDetails;
    
    // Group planets by house for Kundli display
    final Map<int, List<String>> housePlanets = {};
    for (int i = 1; i <= 12; i++) {
      housePlanets[i] = [];
    }
    
    // Add Ascendant (Lagna) as 'As' to House 1
    housePlanets[1]!.add('As');
    
    chart.planets.forEach((key, planet) {
      final name = planet.name.toLowerCase();
      String abbr = '';
      if (name.contains('sun')) {
        abbr = 'Su';
      } else if (name.contains('moon')) {
        abbr = 'Mo';
      } else if (name.contains('mars')) {
        abbr = 'Ma';
      } else if (name.contains('mercury')) {
        abbr = 'Me';
      } else if (name.contains('jupiter')) {
        abbr = 'Ju';
      } else if (name.contains('venus')) {
        abbr = 'Ve';
      } else if (name.contains('saturn')) {
        abbr = 'Sa';
      } else if (name.contains('rahu')) {
        abbr = 'Ra';
      } else if (name.contains('ketu')) {
        abbr = 'Ke';
      } else {
        abbr = planet.name.length >= 2 ? planet.name.substring(0, 2) : planet.name;
        abbr = abbr[0].toUpperCase() + (abbr.length > 1 ? abbr[1].toLowerCase() : '');
      }
      
      final h = planet.house;
      if (h >= 1 && h <= 12) {
        housePlanets[h]!.add(abbr);
      }
    });

    return Scaffold(
      backgroundColor: AstroColors.lightBackground,
      appBar: AppBar(
        title: const Text('Kundli Overview'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Lagna & Basic Panchanga Card
            PremiumCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${details?.name ?? 'Seeker'}\'s Natal Ascendant',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AstroColors.lightTextPrimary),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Lagna: ${chart.ascendantSign} · Moon Sign: ${chart.moonSign} · Nakshatra: ${chart.nakshatra} (Pada ${chart.pada})',
                    style: const TextStyle(fontSize: 13, height: 1.4, color: AstroColors.lightTextSecondary),
                  ),
                  const SizedBox(height: 12),
                  const Divider(),
                  const SizedBox(height: 12),
                  const Text(
                    'Computed Coordinates',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AstroColors.lightTextPrimary),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Date: ${details?.dateOfBirth} · Time: ${details?.timeOfBirth}\nLatitude: ${details?.latitude}° N · Longitude: ${details?.longitude}° E · Timezone: GMT +${details?.timezoneOffset}',
                    style: const TextStyle(fontSize: 12, height: 1.4, color: AstroColors.lightTextSecondary),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 2. Beautiful Interactive Janma Kundli Chart
            const Text(
              'Vedic Janma Kundli (D1 Chart)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AstroColors.lightTextPrimary),
            ),
            const SizedBox(height: 12),
            PremiumCard(
              child: Container(
                height: 320,
                width: double.infinity,
                alignment: Alignment.center,
                child: CustomPaint(
                  size: const Size(300, 300),
                  painter: KundliChartPainter(housePlanets),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // 3. Planetary Degrees Table List
            const Text(
              'Planetary Degrees & Placements',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AstroColors.lightTextPrimary),
            ),
            const SizedBox(height: 12),
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: chart.planets.length,
              separatorBuilder: (context, index) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final planetKey = chart.planets.keys.elementAt(index);
                final planet = chart.planets[planetKey]!;
                
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12.0),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 18,
                        backgroundColor: AstroColors.primaryContainer,
                        child: Text(
                          planet.name.substring(0, math.min(2, planet.name.length)).toUpperCase(),
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AstroColors.primary),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              planet.name,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Sign: ${planet.sign} · House: ${planet.house} · Nakshatra: ${planet.nakshatra} (${planet.pada})',
                              style: const TextStyle(fontSize: 12, color: AstroColors.lightTextSecondary),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '${planet.degree.toStringAsFixed(2)}°',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

// 4. Custom Painter for North Indian Style Kundli Chart Layout
class KundliChartPainter extends CustomPainter {
  final Map<int, List<String>> housePlanets;

  KundliChartPainter(this.housePlanets);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AstroColors.primary
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke;

    final width = size.width;
    final height = size.height;

    // 1. Draw outer boundary box
    canvas.drawRect(Rect.fromLTWH(0, 0, width, height), paint);

    // 2. Draw diagonals
    canvas.drawLine(const Offset(0, 0), Offset(width, height), paint);
    canvas.drawLine(Offset(width, 0), Offset(0, height), paint);

    // 3. Draw diamond (midpoint lines)
    canvas.drawLine(Offset(width / 2, 0), Offset(width, height / 2), paint);
    canvas.drawLine(Offset(width, height / 2), Offset(width / 2, height), paint);
    canvas.drawLine(Offset(width / 2, height), Offset(0, height / 2), paint);
    canvas.drawLine(Offset(0, height / 2), Offset(width / 2, 0), paint);

    // Define center offsets for house labels & planets (normalized coords 0..1 multiplied by size)
    final List<Offset> houseCenters = [
      Offset(width * 0.50, height * 0.30),  // House 1
      Offset(width * 0.30, height * 0.17),  // House 2
      Offset(width * 0.17, height * 0.30),  // House 3
      Offset(width * 0.30, height * 0.50),  // House 4
      Offset(width * 0.17, height * 0.70),  // House 5
      Offset(width * 0.30, height * 0.83),  // House 6
      Offset(width * 0.50, height * 0.70),  // House 7
      Offset(width * 0.70, height * 0.83),  // House 8
      Offset(width * 0.83, height * 0.70),  // House 9
      Offset(width * 0.70, height * 0.50),  // House 10
      Offset(width * 0.83, height * 0.30),  // House 11
      Offset(width * 0.70, height * 0.17),  // House 12
    ];

    // Paint house indices and planet lists
    for (int h = 1; h <= 12; h++) {
      final center = houseCenters[h - 1];

      // Draw House Index (small text top-right/center)
      final indexSpan = TextSpan(
        style: TextStyle(
          color: AstroColors.primary.withOpacity(0.55),
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
        text: '$h',
      );
      final indexPainter = TextPainter(
        text: indexSpan,
        textDirection: TextDirection.ltr,
      );
      indexPainter.layout();
      indexPainter.paint(canvas, Offset(center.dx - 4, center.dy - 22));

      // Draw Planets listed in this house
      final planets = housePlanets[h] ?? [];
      if (planets.isNotEmpty) {
        final planetsText = planets.join(' ');
        final planetsSpan = TextSpan(
          style: const TextStyle(
            color: AstroColors.lightTextPrimary,
            fontSize: 11,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.5,
          ),
          text: planetsText,
        );
        final planetsPainter = TextPainter(
          text: planetsSpan,
          textDirection: TextDirection.ltr,
        );
        planetsPainter.layout();
        planetsPainter.paint(
          canvas,
          Offset(center.dx - (planetsPainter.width / 2), center.dy - 6),
        );
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

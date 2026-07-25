import 'dart:async';
import 'package:flutter/material.dart';
import '../../theme/colors.dart';
import 'premium_card.dart';

class LoadingStepData {
  final String label;
  final double progress; // 0.0 to 1.0
  final String status; // 'done', 'active', 'waiting'

  LoadingStepData({
    required this.label,
    required this.progress,
    required this.status,
  });
}

class CelestialComputingCard extends StatefulWidget {
  final VoidCallback? onComplete;

  const CelestialComputingCard({super.key, this.onComplete});

  @override
  State<CelestialComputingCard> createState() => _CelestialComputingCardState();
}

class _CelestialComputingCardState extends State<CelestialComputingCard> {
  int _activeStepIndex = 0;
  double _currentProgress = 0.0;
  Timer? _timer;

  final List<String> _stepLabels = [
    'Finding Planetary Positions',
    'Calculating Houses',
    'Computing Nakshatras & Yogas',
  ];

  @override
  void initState() {
    super.initState();
    _startSimulation();
  }

  void _startSimulation() {
    const interval = Duration(milliseconds: 50);
    _timer = Timer.periodic(interval, (timer) {
      if (!mounted) return;

      setState(() {
        _currentProgress += 0.04; // Increment progress
        if (_currentProgress >= 1.0) {
          _currentProgress = 0.0;
          _activeStepIndex++;

          if (_activeStepIndex >= _stepLabels.length) {
            _timer?.cancel();
            if (widget.onComplete != null) {
              widget.onComplete!();
            }
          }
        }
      });
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  List<LoadingStepData> _getSteps() {
    return List.generate(_stepLabels.length, (index) {
      final label = _stepLabels[index];
      if (index < _activeStepIndex) {
        return LoadingStepData(label: label, progress: 1.0, status: 'done');
      } else if (index == _activeStepIndex) {
        return LoadingStepData(label: label, progress: _currentProgress, status: 'active');
      } else {
        return LoadingStepData(label: label, progress: 0.0, status: 'waiting');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final steps = _getSteps();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return PremiumCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header loading spinner and title
          Row(
            children: [
              const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AstroColors.primary,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                '✨ Computing Celestial Alignment...',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: isDark ? AstroColors.darkTextPrimary : AstroColors.lightTextPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Steps list
          Column(
            children: steps.map((step) {
              final isDone = step.status == 'done';
              final isActive = step.status == 'active';
              
              Color textColor;
              if (isDone) {
                textColor = isDark ? Colors.white60 : Colors.black54;
              } else if (isActive) {
                textColor = AstroColors.primary;
              } else {
                textColor = isDark ? Colors.white30 : Colors.black38;
              }

              return Padding(
                padding: const EdgeInsets.only(bottom: 14.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Icon(
                              isDone
                                  ? Icons.check_circle
                                  : isActive
                                      ? Icons.sync
                                      : Icons.pending_actions_outlined,
                              size: 16,
                              color: isDone
                                  ? AstroColors.success
                                  : isActive
                                      ? AstroColors.primary
                                      : Colors.grey,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              step.label,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: textColor,
                              ),
                            ),
                          ],
                        ),
                        Text(
                          isDone
                              ? 'Done'
                              : isActive
                                  ? '${(step.progress * 100).toInt()}%'
                                  : 'Waiting',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: textColor,
                          ),
                        ),
                      ],
                    ),
                    if (isActive) ...[
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: step.progress,
                          backgroundColor: isDark ? Colors.white12 : Colors.black12,
                          color: AstroColors.primary,
                          minHeight: 4,
                        ),
                      ),
                    ],
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../theme/colors.dart';

class GocharaOrbits extends StatefulWidget {
  final double size;

  const GocharaOrbits({super.key, this.size = 280});

  @override
  State<GocharaOrbits> createState() => _GocharaOrbitsState();
}

class _GocharaOrbitsState extends State<GocharaOrbits> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 20),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Widget _buildPlanetLabel(String name, Color bg, Color textBorder) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: textBorder, width: 1.5),
        boxShadow: const [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        name,
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final center = widget.size / 2;
    
    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          final double angle = _controller.value * 2 * math.pi;

          // Planet angles & configurations
          // Inner Ring Orbit (radius: size * 0.25)
          final innerRadius = widget.size * 0.26;
          // Outer Ring Orbit (radius: size * 0.38)
          final outerRadius = widget.size * 0.40;

          return Stack(
            alignment: Alignment.center,
            children: [
              // 1. Outer Ring Circle
              Container(
                width: outerRadius * 2,
                height: outerRadius * 2,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AstroColors.primary.withOpacity(0.2),
                    width: 1,
                    style: BorderStyle.solid,
                  ),
                ),
              ),

              // 2. Inner Ring Circle
              Container(
                width: innerRadius * 2,
                height: innerRadius * 2,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AstroColors.primary.withOpacity(0.35),
                    width: 1,
                    style: BorderStyle.solid,
                  ),
                ),
              ),

              // --- Inner Ring Planets (Surya, Chandra, Shukra) ---
              // Surya (Angle: angle)
              Positioned(
                left: center + innerRadius * math.cos(angle) - 24,
                top: center + innerRadius * math.sin(angle) - 12,
                child: _buildPlanetLabel('सूर्य', Colors.orange.shade700, Colors.orange.shade900),
              ),
              // Chandra (Angle: angle + 2*pi/3)
              Positioned(
                left: center + innerRadius * math.cos(angle + 2 * math.pi / 3) - 24,
                top: center + innerRadius * math.sin(angle + 2 * math.pi / 3) - 12,
                child: _buildPlanetLabel('चन्द्र', AstroColors.primary, AstroColors.accent),
              ),
              // Shukra (Angle: angle + 4*pi/3)
              Positioned(
                left: center + innerRadius * math.cos(angle + 4 * math.pi / 3) - 24,
                top: center + innerRadius * math.sin(angle + 4 * math.pi / 3) - 12,
                child: _buildPlanetLabel('शुक्र', Colors.purple.shade700, Colors.purple.shade900),
              ),

              // --- Outer Ring Planets (Mangal, Budha, Guru, Shani) ---
              // Mangal (Angle: -angle)
              Positioned(
                left: center + outerRadius * math.cos(-angle) - 24,
                top: center + outerRadius * math.sin(-angle) - 12,
                child: _buildPlanetLabel('मंगल', Colors.red.shade700, Colors.red.shade900),
              ),
              // Budha (Angle: -angle + pi/2)
              Positioned(
                left: center + outerRadius * math.cos(-angle + math.pi / 2) - 24,
                top: center + outerRadius * math.sin(-angle + math.pi / 2) - 12,
                child: _buildPlanetLabel('बुध', Colors.green.shade700, Colors.green.shade900),
              ),
              // Guru (Angle: -angle + pi)
              Positioned(
                left: center + outerRadius * math.cos(-angle + math.pi) - 24,
                top: center + outerRadius * math.sin(-angle + math.pi) - 12,
                child: _buildPlanetLabel('गुरु', Colors.amber.shade700, Colors.amber.shade900),
              ),
              // Shani (Angle: -angle + 3*pi/2)
              Positioned(
                left: center + outerRadius * math.cos(-angle + 3 * math.pi / 2) - 24,
                top: center + outerRadius * math.sin(-angle + 3 * math.pi / 2) - 12,
                child: _buildPlanetLabel('शनि', Colors.blueGrey.shade800, Colors.black87),
              ),

              // 3. Central Hub
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white,
                  border: Border.all(color: AstroColors.primary.withOpacity(0.6), width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: AstroColors.primary.withOpacity(0.15),
                      blurRadius: 12,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: const Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'गोचर',
                      style: TextStyle(
                        color: AstroColors.primary,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Gochara',
                      style: TextStyle(
                        color: AstroColors.lightTextSecondary,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'नवग्रह',
                      style: TextStyle(
                        color: Colors.amber,
                        fontSize: 8,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

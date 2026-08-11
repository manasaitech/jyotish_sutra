import 'package:flutter/material.dart';
import '../../theme/colors.dart';

class PremiumCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final Color? color;
  final double? borderRadius;
  final double? borderWidth;
  final VoidCallback? onTap;

  const PremiumCard({
    super.key,
    required this.child,
    this.padding,
    this.color,
    this.borderRadius,
    this.borderWidth,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: padding ?? const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: color ?? (isDark ? AstroColors.darkSurface : AstroColors.lightSurface),
          borderRadius: BorderRadius.circular(borderRadius ?? 24),
          border: Border.all(
            color: isDark ? Colors.white10 : AstroColors.outline,
            width: borderWidth ?? 1,
          ),
          boxShadow: [
            BoxShadow(
              color: isDark ? Colors.transparent : const Color(0x0A6E6558),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: child,
      ),
    );
  }
}

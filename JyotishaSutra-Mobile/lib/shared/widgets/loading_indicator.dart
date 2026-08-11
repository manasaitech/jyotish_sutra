import 'package:flutter/material.dart';
import '../../theme/colors.dart';

class CelestialLoader extends StatelessWidget {
  final String? message;

  const CelestialLoader({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: 60,
                height: 60,
                child: CircularProgressIndicator(
                  color: AstroColors.primary,
                  strokeWidth: 2,
                ),
              ),
              Icon(
                Icons.star,
                color: AstroColors.secondary,
                size: 24,
              ),
            ],
          ),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message!,
              style: TextStyle(
                color: Theme.of(context).brightness == Brightness.dark
                    ? AstroColors.darkTextSecondary
                    : AstroColors.lightTextSecondary,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'colors.dart';

class AstroTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: AstroColors.primary,
      colorScheme: const ColorScheme.light(
        primary: AstroColors.primary,
        primaryContainer: AstroColors.primaryContainer,
        secondary: AstroColors.secondary,
        secondaryContainer: AstroColors.secondaryContainer,
        background: AstroColors.lightBackground,
        surface: AstroColors.lightSurface,
        error: AstroColors.error,
      ),
      scaffoldBackgroundColor: AstroColors.lightBackground,
      textTheme: GoogleFonts.outfitTextTheme(ThemeData.light().textTheme).copyWith(
        bodyLarge: GoogleFonts.outfit(color: AstroColors.lightTextPrimary, fontSize: 16),
        bodyMedium: GoogleFonts.outfit(color: AstroColors.lightTextSecondary, fontSize: 14),
        titleLarge: GoogleFonts.outfit(color: AstroColors.lightTextPrimary, fontWeight: FontWeight.bold, fontSize: 20),
      ),
      cardTheme: CardThemeData(
        color: AstroColors.lightSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: AstroColors.outline, width: 1),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: AstroColors.lightTextPrimary),
        centerTitle: true,
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      primaryColor: AstroColors.primary,
      colorScheme: const ColorScheme.dark(
        primary: AstroColors.primary,
        primaryContainer: Color(0xFF3E2723),
        secondary: AstroColors.secondary,
        secondaryContainer: Color(0xFF2D2A26),
        background: AstroColors.darkBackground,
        surface: AstroColors.darkSurface,
        error: AstroColors.error,
      ),
      scaffoldBackgroundColor: AstroColors.darkBackground,
      textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme).copyWith(
        bodyLarge: GoogleFonts.outfit(color: AstroColors.darkTextPrimary, fontSize: 16),
        bodyMedium: GoogleFonts.outfit(color: AstroColors.darkTextSecondary, fontSize: 14),
        titleLarge: GoogleFonts.outfit(color: AstroColors.darkTextPrimary, fontWeight: FontWeight.bold, fontSize: 20),
      ),
      cardTheme: CardThemeData(
        color: AstroColors.darkSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: Colors.white10, width: 1),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: AstroColors.darkTextPrimary),
        centerTitle: true,
      ),
    );
  }
}

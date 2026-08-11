import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'routes/app_router.dart';
import 'theme/theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp();
  } catch (e) {
    print('[Firebase Warning] Initialization failed: $e. Using offline simulator fallback.');
  }
  runApp(
    const ProviderScope(
      child: JyotishaSutraApp(),
    ),
  );
}

class JyotishaSutraApp extends StatelessWidget {
  const JyotishaSutraApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'JyotishaSutra AI',
      debugShowCheckedModeBanner: false,
      
      // Theme settings
      themeMode: ThemeMode.system, // Support light & dark modes dynamically
      theme: AstroTheme.lightTheme,
      darkTheme: AstroTheme.darkTheme,
      
      // Navigation routing
      routerConfig: appRouter,
    );
  }
}

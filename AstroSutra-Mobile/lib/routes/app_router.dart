import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

// Splash & Auth Screens
import '../features/auth/presentation/screens/splash_screen.dart';
import '../features/auth/presentation/screens/onboarding_screen.dart';
import '../features/auth/presentation/screens/google_login_screen.dart';

// Shell Navigation Tab Screens
import '../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../features/chat/presentation/screens/chat_screen.dart';
import '../features/reports/presentation/screens/reports_screen.dart';
import '../features/profile/presentation/screens/profile_screen.dart';

// Sub-Dashboard Detail Screens
import '../features/dashboard/presentation/screens/overview_screen.dart';
import '../features/dashboard/presentation/screens/career_screen.dart';
import '../features/dashboard/presentation/screens/relationships_screen.dart';
import '../features/dashboard/presentation/screens/health_screen.dart';
import '../features/dashboard/presentation/screens/food_diet_screen.dart';
import '../features/dashboard/presentation/screens/finance_screen.dart';
import '../features/dashboard/presentation/screens/personality_screen.dart';
import '../features/dashboard/presentation/screens/settings_screen.dart';
import '../features/dashboard/presentation/screens/notification_screen.dart';
import '../features/matching/presentation/screens/kundli_matching_screen.dart';
import '../features/dasha/presentation/screens/dasha_timeline_screen.dart';
import '../features/subscription/presentation/screens/subscription_screen.dart';
import '../features/reports/presentation/screens/pdf_viewer_screen.dart';

// Shared shell navigation scaffold
import '../shared/widgets/main_scaffold.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');
final GlobalKey<NavigatorState> _shellNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'shell');

final GoRouter appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/splash',
  routes: [
    GoRoute(
      path: '/splash',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/onboarding',
      builder: (context, state) => const OnboardingScreen(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const GoogleLoginScreen(),
    ),
    
    // Bottom Navigation Shell Route
    ShellRoute(
      navigatorKey: _shellNavigatorKey,
      builder: (context, state, child) {
        return MainScaffold(child: child);
      },
      routes: [
        GoRoute(
          path: '/dashboard',
          builder: (context, state) => const DashboardScreen(),
          routes: [
            GoRoute(
              path: 'overview',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (context, state) => const OverviewScreen(),
            ),
            GoRoute(
              path: 'career',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (context, state) => const CareerScreen(),
            ),
            GoRoute(
              path: 'relationships',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (context, state) => const RelationshipsScreen(),
            ),
            GoRoute(
              path: 'matching',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (context, state) => const KundliMatchingScreen(),
            ),
            GoRoute(
              path: 'dasha',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (context, state) => const DashaTimelineScreen(),
            ),
            GoRoute(
              path: 'health',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (context, state) => const HealthScreen(),
            ),
            GoRoute(
              path: 'diet',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (context, state) => const FoodDietScreen(),
            ),
            GoRoute(
              path: 'finance',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (context, state) => const FinanceScreen(),
            ),
            GoRoute(
              path: 'personality',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (context, state) => const PersonalityScreen(),
            ),
            GoRoute(
              path: 'settings',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (context, state) => const SettingsScreen(),
            ),
            GoRoute(
              path: 'notifications',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (context, state) => const NotificationScreen(),
            ),
            GoRoute(
              path: 'subscription',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (context, state) => const SubscriptionScreen(),
            ),
          ],
        ),
        GoRoute(
          path: '/chat',
          builder: (context, state) => const ChatScreen(),
        ),
        GoRoute(
          path: '/reports',
          builder: (context, state) => const ReportsScreen(),
          routes: [
            GoRoute(
              path: 'pdf-viewer',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (context, state) => const PdfViewerScreen(),
            ),
          ],
        ),
        GoRoute(
          path: '/profile',
          builder: (context, state) => const ProfileScreen(),
        ),
      ],
    ),
  ],
);

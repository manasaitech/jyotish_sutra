import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../theme/colors.dart';
import '../../../../shared/widgets/premium_card.dart';
import '../../../../shared/widgets/computing_card.dart';
import '../../../profile/presentation/providers/profile_provider.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    // Fetch active user profile from backend on screen load
    Future.microtask(() => ref.read(profileProvider.notifier).fetchProfile());
  }

  Widget _buildGridItem({
    required BuildContext context,
    required String title,
    required IconData icon,
    required String route,
    required Color color,
  }) {
    return PremiumCard(
      onTap: () => context.push(route),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final profileState = ref.watch(profileProvider);

    if (profileState.isLoading) {
      return const Scaffold(
        body: Center(
          child: Padding(
            padding: EdgeInsets.all(24.0),
            child: CelestialComputingCard(),
          ),
        ),
      );
    }

    final profile = profileState.activeProfile;
    final name = profile?.birthDetails?.name ?? 'Seeker';
    final chart = profile?.chartSummary;
    
    final lagna = chart?.ascendantSign ?? 'Aries';
    final moonSign = chart?.moonSign ?? 'Cancer';
    final nakshatra = chart?.nakshatra ?? 'Pushya';

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'ASTROSUTRA AI',
          style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none),
            onPressed: () => context.push('/dashboard/notifications'),
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.push('/dashboard/settings'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(profileProvider.notifier).fetchProfile(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Premium Welcome Card
              PremiumCard(
                color: AstroColors.primary,
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Welcome, $name',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            chart != null 
                              ? 'Lagna: $lagna · Rashi: $moonSign · Nakshatra: $nakshatra'
                              : 'Planets are aligned in your favor today. View standard Vedic details or subscribe to access Pro details.',
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.9),
                              fontSize: 13,
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () => context.push('/dashboard/subscription'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: AstroColors.primary,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: const Text('Upgrade Tier', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    const Icon(Icons.stars, size: 70, color: Colors.white),
                  ],
                ),
              ),
              if (profileState.errorMessage != null) ...[
                const SizedBox(height: 16),
                Text(
                  'Error loading profile: ${profileState.errorMessage}',
                  style: const TextStyle(color: AstroColors.error, fontSize: 13),
                ),
              ],
              const SizedBox(height: 24),
              
              const Text(
                'Astro Guidance Modules',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              
              GridView.count(
                crossAxisCount: 2,
                crossAxisSpacing: 14,
                mainAxisSpacing: 14,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  _buildGridItem(
                    context: context,
                    title: 'Overview',
                    icon: Icons.grid_view_outlined,
                    route: '/dashboard/overview',
                    color: Colors.blue,
                  ),
                  _buildGridItem(
                    context: context,
                    title: 'Career',
                    icon: Icons.work_outline,
                    route: '/dashboard/career',
                    color: Colors.orange,
                  ),
                  _buildGridItem(
                    context: context,
                    title: 'Relationships',
                    icon: Icons.favorite_border,
                    route: '/dashboard/relationships',
                    color: Colors.pink,
                  ),
                  _buildGridItem(
                    context: context,
                    title: 'Dasha Timeline',
                    icon: Icons.timeline,
                    route: '/dashboard/dasha',
                    color: Colors.purple,
                  ),
                  _buildGridItem(
                    context: context,
                    title: 'Kundli Matching',
                    icon: Icons.people_outline,
                    route: '/dashboard/matching',
                    color: Colors.teal,
                  ),
                  _buildGridItem(
                    context: context,
                    title: 'Health Guidance',
                    icon: Icons.healing,
                    route: '/dashboard/health',
                    color: Colors.red,
                  ),
                  _buildGridItem(
                    context: context,
                    title: 'Ayurvedic Diet',
                    icon: Icons.restaurant_menu,
                    route: '/dashboard/diet',
                    color: Colors.green,
                  ),
                  _buildGridItem(
                    context: context,
                    title: 'Finance Analysis',
                    icon: Icons.account_balance_wallet_outlined,
                    route: '/dashboard/finance',
                    color: Colors.amber,
                  ),
                  _buildGridItem(
                    context: context,
                    title: 'Mind & Personality',
                    icon: Icons.psychology_outlined,
                    route: '/dashboard/personality',
                    color: Colors.indigo,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

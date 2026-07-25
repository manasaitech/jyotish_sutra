import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../domain/repositories/dasha_repository.dart';
import '../../data/repositories/dasha_repository_impl.dart';
import '../../../../core/network/network_providers.dart';

class DashaState {
  final bool isLoading;
  final Map<String, dynamic>? timelineData;
  final String? errorMessage;

  DashaState({
    required this.isLoading,
    this.timelineData,
    this.errorMessage,
  });

  DashaState copyWith({
    bool? isLoading,
    Map<String, dynamic>? timelineData,
    String? errorMessage,
  }) {
    return DashaState(
      isLoading: isLoading ?? this.isLoading,
      timelineData: timelineData ?? this.timelineData,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

class DashaNotifier extends StateNotifier<DashaState> {
  final DashaRepository _repository;

  DashaNotifier(this._repository) : super(DashaState(isLoading: false));

  Future<void> getDashaTimeline({int? year}) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final lookupYear = year ?? DateTime.now().year;
      final prefs = await SharedPreferences.getInstance();
      final activeProfileId = prefs.getString('active_profile_id') ?? prefs.getString('user_id') ?? 'guest_user';
      final sessionId = prefs.getString('session_id') ?? 'session_${DateTime.now().millisecondsSinceEpoch}';

      final data = await _repository.fetchDashaTimeline(
        lookupYear: lookupYear,
        userId: activeProfileId,
        sessionId: sessionId,
      );

      state = state.copyWith(isLoading: false, timelineData: data);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }
}

final dashaRepositoryProvider = Provider<DashaRepository>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return DashaRepositoryImpl(apiService);
});

final dashaProvider = StateNotifierProvider<DashaNotifier, DashaState>((ref) {
  final repo = ref.watch(dashaRepositoryProvider);
  return DashaNotifier(repo);
});

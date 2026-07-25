import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../domain/repositories/profile_repository.dart';
import '../../data/repositories/profile_repository_impl.dart';
import '../../../../core/models/astrology_models.dart';
import '../../../../core/network/network_providers.dart';

class ProfileState {
  final bool isLoading;
  final UserProfile? activeProfile;
  final String? errorMessage;

  ProfileState({
    required this.isLoading,
    this.activeProfile,
    this.errorMessage,
  });

  ProfileState copyWith({
    bool? isLoading,
    UserProfile? activeProfile,
    String? errorMessage,
  }) {
    return ProfileState(
      isLoading: isLoading ?? this.isLoading,
      activeProfile: activeProfile ?? this.activeProfile,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

class ProfileNotifier extends StateNotifier<ProfileState> {
  final ProfileRepository _repository;

  ProfileNotifier(this._repository) : super(ProfileState(isLoading: false));

  Future<void> fetchProfile() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final prefs = await SharedPreferences.getInstance();
      final activeProfileId = prefs.getString('active_profile_id') ?? prefs.getString('user_id');
      if (activeProfileId == null || activeProfileId.isEmpty) {
        throw Exception('User is not authenticated. Active profile ID missing.');
      }
      
      final profile = await _repository.loadProfile(activeProfileId);
      state = state.copyWith(isLoading: false, activeProfile: profile);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  Future<void> updateDetails(BirthDetails details) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final prefs = await SharedPreferences.getInstance();
      final activeProfileId = prefs.getString('active_profile_id') ?? prefs.getString('user_id');
      if (activeProfileId == null || activeProfileId.isEmpty) {
        throw Exception('User is not authenticated. Active profile ID missing.');
      }
      
      await _repository.updateProfile(activeProfileId, details);
      // Reload profile to refresh the natal chart with updated birth details
      await fetchProfile();
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }
}

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return ProfileRepositoryImpl(apiService);
});

final profileProvider = StateNotifierProvider<ProfileNotifier, ProfileState>((ref) {
  final repo = ref.watch(profileRepositoryProvider);
  return ProfileNotifier(repo);
});

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../domain/repositories/chat_repository.dart';
import '../../data/repositories/chat_repository_impl.dart';
import '../../../../core/network/network_providers.dart';

class ChatMessage {
  final String sender; // 'user' or 'bot'
  final String text;

  ChatMessage({required this.sender, required this.text});
}

class ChatState {
  final bool isLoading;
  final List<ChatMessage> messages;
  final String? errorMessage;

  ChatState({
    required this.isLoading,
    required this.messages,
    this.errorMessage,
  });

  ChatState copyWith({
    bool? isLoading,
    List<ChatMessage>? messages,
    String? errorMessage,
  }) {
    return ChatState(
      isLoading: isLoading ?? this.isLoading,
      messages: messages ?? this.messages,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

class ChatNotifier extends StateNotifier<ChatState> {
  final ChatRepository _repository;
  final String _sessionId = 'session_${DateTime.now().millisecondsSinceEpoch}';

  ChatNotifier(this._repository)
      : super(ChatState(
          isLoading: false,
          messages: [
            ChatMessage(
              sender: 'bot',
              text: 'Namaste. Ask me anything about your kundli, career, relationships, remedies, or seek guidance from the Bhagavad Gita.',
            )
          ],
        ));

  Future<void> sendMessage(String text, {String tab = 'overview'}) async {
    if (text.trim().isEmpty) return;

    final userMessage = ChatMessage(sender: 'user', text: text);
    state = state.copyWith(
      isLoading: true,
      messages: [...state.messages, userMessage],
      errorMessage: null,
    );

    try {
      final prefs = await SharedPreferences.getInstance();
      final activeProfileId = prefs.getString('active_profile_id') ?? prefs.getString('user_id') ?? 'guest_user';
      final sessionId = _sessionId;

      final response = await _repository.sendChatMessage(
        tab: tab,
        message: text,
        userId: activeProfileId,
        sessionId: sessionId,
      );

      final botMessage = ChatMessage(sender: 'bot', text: response);
      state = state.copyWith(
        isLoading: false,
        messages: [...state.messages, botMessage],
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString(),
      );
    }
  }
}

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return ChatRepositoryImpl(apiService);
});

final chatProvider = StateNotifierProvider<ChatNotifier, ChatState>((ref) {
  final repo = ref.watch(chatRepositoryProvider);
  return ChatNotifier(repo);
});

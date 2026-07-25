abstract class ChatRepository {
  Future<String> sendChatMessage({
    required String tab,
    required String message,
    required String userId,
    required String sessionId,
  });
}

import '../../domain/repositories/chat_repository.dart';
import '../../../../core/network/api_service.dart';

class ChatRepositoryImpl implements ChatRepository {
  final ApiService _apiService;

  ChatRepositoryImpl(this._apiService);

  @override
  Future<String> sendChatMessage({
    required String tab,
    required String message,
    required String userId,
    required String sessionId,
  }) async {
    final response = await _apiService.post('/api/tab-chat', data: {
      'tab': tab,
      'message': message,
      'user_id': userId,
      'session_id': sessionId,
    });
    
    final data = response.data;
    if (data == null || data['response'] == null) {
      throw Exception('Failed to get chat response from server');
    }
    return data['response'].toString();
  }
}

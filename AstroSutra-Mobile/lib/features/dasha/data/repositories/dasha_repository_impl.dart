import '../../domain/repositories/dasha_repository.dart';
import '../../../../core/network/api_service.dart';

class DashaRepositoryImpl implements DashaRepository {
  final ApiService _apiService;

  DashaRepositoryImpl(this._apiService);

  @override
  Future<Map<String, dynamic>> fetchDashaTimeline({
    required int lookupYear,
    required String userId,
    required String sessionId,
  }) async {
    final response = await _apiService.post('/api/dasha-timeline', data: {
      'lookup_year': lookupYear,
      'user_id': userId,
      'session_id': sessionId,
    });
    
    return Map<String, dynamic>.from(response.data ?? {});
  }
}

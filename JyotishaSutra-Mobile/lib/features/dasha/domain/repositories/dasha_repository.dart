abstract class DashaRepository {
  Future<Map<String, dynamic>> fetchDashaTimeline({
    required int lookupYear,
    required String userId,
    required String sessionId,
  });
}

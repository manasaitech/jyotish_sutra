import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_client.dart';
import 'api_service.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});

final apiServiceProvider = Provider<ApiService>((ref) {
  final client = ref.watch(apiClientProvider);
  return ApiService(client);
});

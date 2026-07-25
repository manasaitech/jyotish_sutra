import 'package:dio/dio.dart';
import 'api_client.dart';
import 'error_handler.dart';

class ApiService {
  final ApiClient _client;

  ApiService(this._client);

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    try {
      return await _client.dio.get(path, queryParameters: queryParameters);
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<Response> post(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    try {
      return await _client.dio.post(path, data: data, queryParameters: queryParameters);
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<Response> put(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    try {
      return await _client.dio.put(path, data: data, queryParameters: queryParameters);
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<Response> delete(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    try {
      return await _client.dio.delete(path, data: data, queryParameters: queryParameters);
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }
}

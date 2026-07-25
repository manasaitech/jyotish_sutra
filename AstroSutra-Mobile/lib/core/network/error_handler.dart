import 'package:dio/dio.dart';

class ApiError implements Exception {
  final String message;
  final int? statusCode;

  ApiError({required this.message, this.statusCode});

  @override
  String toString() => 'ApiError(message: $message, statusCode: $statusCode)';
}

class ErrorHandler {
  static ApiError handle(dynamic error) {
    if (error is DioException) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return ApiError(message: 'Connection timed out. Please try again.');
        case DioExceptionType.badResponse:
          final response = error.response;
          final code = response?.statusCode;
          final detail = response?.data?['detail'] ?? 'An unexpected server error occurred.';
          return ApiError(message: detail.toString(), statusCode: code);
        case DioExceptionType.cancel:
          return ApiError(message: 'Request was cancelled.');
        case DioExceptionType.connectionError:
          return ApiError(message: 'No internet connection detected.');
        default:
          return ApiError(message: 'Something went wrong. Please check your network.');
      }
    }
    return ApiError(message: error.toString());
  }
}

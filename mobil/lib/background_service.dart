import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:geolocator/geolocator.dart';
import 'package:sensors_plus/sensors_plus.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

const String serverUrlKey = 'server_url';
const String defaultServerUrl = 'http://192.168.1.2:3000/api/v1/sensor-data'; // Varsayılan yerel IP adresi

Future<void> initializeService() async {
  final service = FlutterBackgroundService();

  const AndroidNotificationChannel channel = AndroidNotificationChannel(
    'sensor_service_channel', 
    'Sensör Veri Toplama',
    description: 'Arka planda sensör verisi toplamak için kullanılır',
    importance: Importance.low,
  );

  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

  if (Platform.isIOS || Platform.isAndroid) {
    await flutterLocalNotificationsPlugin.initialize(
      const InitializationSettings(
        iOS: DarwinInitializationSettings(),
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      ),
    );
  }

  await flutterLocalNotificationsPlugin
      .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
      ?.createNotificationChannel(channel);

  await service.configure(
    androidConfiguration: AndroidConfiguration(
      onStart: onStart,
      autoStart: false,
      isForegroundMode: true,
      notificationChannelId: 'sensor_service_channel',
      initialNotificationTitle: 'Sensör Verisi Toplanıyor',
      initialNotificationContent: 'Veriler arka planda gönderiliyor',
      foregroundServiceNotificationId: 888,
    ),
    iosConfiguration: IosConfiguration(
      autoStart: false,
      onForeground: onStart,
      onBackground: onIosBackground,
    ),
  );
}

@pragma('vm:entry-point')
Future<bool> onIosBackground(ServiceInstance service) async {
  WidgetsFlutterBinding.ensureInitialized();
  return true;
}

@pragma('vm:entry-point')
void onStart(ServiceInstance service) async {
  WidgetsFlutterBinding.ensureInitialized();

  if (service is AndroidServiceInstance) {
    service.on('setAsForeground').listen((event) {
      service.setAsForegroundService();
    });
    service.on('setAsBackground').listen((event) {
      service.setAsBackgroundService();
    });
  }

  service.on('stopService').listen((event) {
    service.stopSelf();
  });

  Timer.periodic(const Duration(seconds: 5), (timer) async {
    if (service is AndroidServiceInstance) {
      if (!(await service.isForegroundService())) {
        return;
      }
    }

    try {
      Position? position;
      try {
        bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
        if (serviceEnabled) {
          position = await Geolocator.getCurrentPosition(
            desiredAccuracy: LocationAccuracy.high,
            timeLimit: const Duration(seconds: 2),
          );
        }
      } catch (e) {
        // Location might be unavailable or timeout
      }

      double accX = 0, accY = 0, accZ = 0;
      try {
        final accEvent = await accelerometerEventStream(
          samplingPeriod: const Duration(milliseconds: 100),
        ).first;
        accX = accEvent.x;
        accY = accEvent.y;
        accZ = accEvent.z;
      } catch (e) {}

      double gyroX = 0, gyroY = 0, gyroZ = 0;
      try {
        final gyroEvent = await gyroscopeEventStream(
          samplingPeriod: const Duration(milliseconds: 100),
        ).first;
        gyroX = gyroEvent.x;
        gyroY = gyroEvent.y;
        gyroZ = gyroEvent.z;
      } catch (e) {}

      final prefs = await SharedPreferences.getInstance();

      final Map<String, dynamic> reading = {
        'ts': DateTime.now().toIso8601String(),
        'accel': {'x': accX, 'y': accY, 'z': accZ},
        'gyro': {'x': gyroX, 'y': gyroY, 'z': gyroZ},
      };

      if (position != null) {
        reading['gps'] = {
          'lat': position.latitude,
          'lng': position.longitude,
          'speed': position.speed,
          'accuracy': position.accuracy,
        };
      }

      final deviceId = prefs.getString('device_id') ?? 'mobile-device-01';
      final data = {
        'deviceId': deviceId,
        'readings': [reading],
      };
      
      service.invoke('update', {'data': data});

      final targetUrl = prefs.getString(serverUrlKey) ?? defaultServerUrl;
      final authToken = prefs.getString('auth_token') ?? 'dummy_token';

      try {
        final response = await http.post(
          Uri.parse(targetUrl),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $authToken',
          },
          body: jsonEncode(data),
        ).timeout(const Duration(seconds: 3));
        
        service.invoke('update', {'status': 'Gönderildi (HTTP ${response.statusCode})'});
      } on TimeoutException {
        service.invoke('update', {'status': 'Bağlantı zaman aşımı (Sunucuya ulaşılamıyor)'});
      } on SocketException {
        service.invoke('update', {'status': 'Bağlantı reddedildi (IP veya Port hatalı)'});
      } catch (e) {
        service.invoke('update', {'status': 'Hata: $e'});
      }
      
    } catch (e) {
      service.invoke('update', {'status': 'Fatal Error: $e'});
    }
  });
}

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
const String defaultServerUrl = 'http://192.168.1.2:5000/api/v1/sensor-data'; // Varsayılan yerel IP adresi

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

  Position? latestPosition;
  
  // GPS'i sürekli dinle ki döngüde bekleme yapmasın
  Geolocator.getPositionStream(
    locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
  ).listen((Position position) {
    latestPosition = position;
  }).onError((e) {
    print("GPS Hatası: $e");
  });

  List<Map<String, dynamic>> batchReadings = [];
  
  final prefs = await SharedPreferences.getInstance();
  final double intervalSeconds = prefs.getDouble('polling_interval') ?? 0.5;
  final int intervalMs = (intervalSeconds * 1000).toInt();
  int batchSize = (5.0 / intervalSeconds).ceil();
  if (batchSize < 1) batchSize = 1;

  Timer.periodic(Duration(milliseconds: intervalMs), (timer) async {
    if (service is AndroidServiceInstance) {
      if (!(await service.isForegroundService())) {
        return;
      }
    }

    try {
      double accX = 0, accY = 0, accZ = 0;
      try {
        final accEvent = await accelerometerEventStream(
          samplingPeriod: const Duration(milliseconds: 100),
        ).first.timeout(const Duration(milliseconds: 200));
        accX = accEvent.x;
        accY = accEvent.y;
        accZ = accEvent.z;
      } catch (e) {}

      double gyroX = 0, gyroY = 0, gyroZ = 0;
      try {
        final gyroEvent = await gyroscopeEventStream(
          samplingPeriod: const Duration(milliseconds: 100),
        ).first.timeout(const Duration(milliseconds: 200));
        gyroX = gyroEvent.x;
        gyroY = gyroEvent.y;
        gyroZ = gyroEvent.z;
      } catch (e) {}

      final Map<String, dynamic> reading = {
        'ts': DateTime.now().toIso8601String(),
        'accel': {'x': accX, 'y': accY, 'z': accZ},
        'gyro': {'x': gyroX, 'y': gyroY, 'z': gyroZ},
      };

      if (latestPosition != null) {
        double realSpeed = latestPosition!.speed;
        // GPS kaymalarını (drift) önlemek için 0.5 m/s altındaki hızları 0 kabul ediyoruz
        if (realSpeed < 0.5) {
          realSpeed = 0.0;
        }
        reading['gps'] = {
          'lat': latestPosition!.latitude,
          'lng': latestPosition!.longitude,
          'speed': realSpeed,
          'accuracy': latestPosition!.accuracy,
        };
      }

      batchReadings.add(reading);

      // Her X tick'te bir (yaklaşık 5 saniyede bir) toplu gönderim yap
      if (batchReadings.length >= batchSize) {
        final List<Map<String, dynamic>> payloadReadings = List.from(batchReadings);
        batchReadings.clear(); // Listeyi hemen boşalt ki yeni veriler birikmeye başlasın

        final prefs = await SharedPreferences.getInstance();
        final deviceId = prefs.getString('device_id') ?? 'mobile-device-01';
        final data = {
          'deviceId': deviceId,
          'readings': payloadReadings,
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
          ).timeout(const Duration(seconds: 4));
          
          service.invoke('update', {'status': 'Toplu Gönderildi (${payloadReadings.length} kayıt, HTTP ${response.statusCode})'});
        } on TimeoutException {
          service.invoke('update', {'status': 'Bağlantı zaman aşımı (Sunucuya ulaşılamıyor)'});
        } on SocketException {
          service.invoke('update', {'status': 'Bağlantı reddedildi (IP veya Port hatalı)'});
        } catch (e) {
          service.invoke('update', {'status': 'Hata: $e'});
        }
      }
      
    } catch (e) {
      service.invoke('update', {'status': 'Fatal Error: $e'});
    }
  });
}

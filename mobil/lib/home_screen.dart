import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'background_service.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool isRunning = false;
  IO.Socket? socket;

  double currentSpeed = 0.0;
  double currentAccelX = 0.0;
  double currentAccelY = 0.0;
  double currentAccelZ = 0.0;
  
  String currentStatus = "Bekleniyor...";

  @override
  void initState() {
    super.initState();
    _checkServiceStatus();
  }

  Future<void> _checkServiceStatus() async {
    final service = FlutterBackgroundService();
    bool running = await service.isRunning();
    setState(() {
      isRunning = running;
    });

    if (running && socket == null) {
      _connectSocket();
    } else if (!running && socket != null) {
      socket?.disconnect();
      socket = null;
    }
  }

  Future<void> _connectSocket() async {
    final prefs = await SharedPreferences.getInstance();
    String baseUrl = prefs.getString(serverUrlKey) ?? defaultServerUrl;
    
    final uri = Uri.tryParse(baseUrl);
    if (uri != null) {
      baseUrl = '${uri.scheme}://${uri.host}:${uri.port}';
    }

    socket = IO.io('$baseUrl/realtime', <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': true,
    });

    socket?.onConnect((_) {
      print('Socket bağlandı');
    });

    socket?.on('alarm:new', (data) {
      final deviceId = prefs.getString('device_id') ?? 'mobile-device-01';
      if (data['deviceId'] == deviceId) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: Colors.white),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'ALARM: ${data['type'] == 'HARD_BRAKING' ? 'Ani Fren' : (data['type'] == 'SPEEDING' ? 'Hız İhlali' : data['type'])}',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        if (data['description'] != null)
                          Text(data['description'], style: const TextStyle(fontSize: 13)),
                      ],
                    ),
                  ),
                ],
              ),
              backgroundColor: Colors.redAccent.shade700,
              duration: const Duration(seconds: 4),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          );
        }
      }
    });
  }

  Future<void> _simulateEvent(String type) async {
    final prefs = await SharedPreferences.getInstance();
    final targetUrl = prefs.getString(serverUrlKey) ?? defaultServerUrl;
    final deviceId = prefs.getString('device_id') ?? 'mobile-device-01';
    final authToken = prefs.getString('auth_token') ?? 'dummy_token';

    // Simulate high values to trigger backend alarms
    double simY = type == 'BRAKE' ? -15.0 : 0.0;
    double simX = type == 'TURN' ? 12.0 : 0.0;
    double simSpeed = type == 'SPEEDING' ? 45.0 : 10.0; // 45 m/s -> 162 km/h

    final data = {
      'deviceId': deviceId,
      'readings': [
        {
          'ts': DateTime.now().toIso8601String(),
          'accel': {'x': simX, 'y': simY, 'z': 9.8},
          'gyro': {'x': 0.0, 'y': 0.0, 'z': 0.0},
          'gps': {
            'lat': 41.0151, // İstanbul Merkez
            'lng': 28.9795,
            'speed': simSpeed,
            'accuracy': 5.0,
          }
        }
      ]
    };

    try {
      await http.post(
        Uri.parse(targetUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode(data),
      );
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('$type simülasyonu gönderildi.'), backgroundColor: Colors.orange),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Simülasyon hatası: $e'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings, color: Colors.white70),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen()));
            },
          )
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF1e1e2f), Color(0xFF2a2a40)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: StreamBuilder<Map<String, dynamic>?>(
            stream: FlutterBackgroundService().on('update'),
            builder: (context, snapshot) {
              if (snapshot.hasData) {
                final data = snapshot.data!;
                if (data.containsKey('status')) {
                  // status string handled implicitly or safely ignored
                }
                if (data.containsKey('data')) {
                  final d = data['data'];
                  if (d['readings'] != null && d['readings'].isNotEmpty) {
                    final List readings = d['readings'];
                    final reading = readings.last;
                    currentAccelX = reading['accel']['x']?.toDouble() ?? 0.0;
                    currentAccelY = reading['accel']['y']?.toDouble() ?? 0.0;
                    currentAccelZ = reading['accel']['z']?.toDouble() ?? 0.0;
                    
                    if (reading.containsKey('gps') && reading['gps'] != null) {
                      currentSpeed = (reading['gps']['speed']?.toDouble() ?? 0.0) * 3.6; // m/s to km/h
                    }
                  }
                }
              }

              return Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20.0),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 400),
                    child: _buildGlassPanel(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text(
                            "📱 Sürüş Modu",
                            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            "Telefonunuzu sabitleyin ve sürüşe başlayın.",
                            style: TextStyle(color: Colors.white54, fontSize: 14),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 30),
                          
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: isRunning ? const Color(0xFFF44336) : const Color(0xFF4CAF50),
                              padding: const EdgeInsets.symmetric(vertical: 20),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(50)),
                              minimumSize: const Size(double.infinity, 60),
                            ),
                            onPressed: () async {
                              final service = FlutterBackgroundService();
                              if (isRunning) {
                                service.invoke("stopService");
                              } else {
                                service.startService();
                              }
                              await Future.delayed(const Duration(seconds: 1));
                              _checkServiceStatus();
                            },
                            child: Text(
                              isRunning ? "⏹ Sürüşü Bitir" : "▶ Sürüşü Başlat",
                              style: const TextStyle(fontSize: 20, color: Colors.white, fontWeight: FontWeight.bold),
                            ),
                          ),

                          const SizedBox(height: 30),
                          const Divider(color: Colors.white24),
                          const SizedBox(height: 10),
                          
                          const Text("Sunum / Demo Modu:", style: TextStyle(color: Colors.cyanAccent, fontSize: 14)),
                          const SizedBox(height: 10),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFe91e63),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(50)),
                              minimumSize: const Size(double.infinity, 45),
                            ),
                            onPressed: () => _simulateEvent('BRAKE'),
                            child: const Text("🚨 Ani Fren Simüle Et", style: TextStyle(color: Colors.white, fontSize: 16)),
                          ),
                          const SizedBox(height: 10),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFff9800),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(50)),
                              minimumSize: const Size(double.infinity, 45),
                            ),
                            onPressed: () => _simulateEvent('TURN'),
                            child: const Text("🚨 Sert Dönüş Simüle Et", style: TextStyle(color: Colors.white, fontSize: 16)),
                          ),
                          const SizedBox(height: 10),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF9c27b0),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(50)),
                              minimumSize: const Size(double.infinity, 45),
                            ),
                            onPressed: () => _simulateEvent('SPEEDING'),
                            child: const Text("🚨 Hız İhlali Simüle Et", style: TextStyle(color: Colors.white, fontSize: 16)),
                          ),

                          if (isRunning) ...[
                            const SizedBox(height: 30),
                            GridView.count(
                              crossAxisCount: 2,
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              mainAxisSpacing: 15,
                              crossAxisSpacing: 15,
                              childAspectRatio: 2,
                              children: [
                                _buildDataItem("İvme (X)", currentAccelX.toStringAsFixed(2)),
                                _buildDataItem("İvme (Y)", currentAccelY.toStringAsFixed(2)),
                                _buildDataItem("İvme (Z)", currentAccelZ.toStringAsFixed(2)),
                                _buildDataItem("Hız (km/h)", currentSpeed.toStringAsFixed(1)),
                              ],
                            ),
                          ]
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildGlassPanel({required Widget child}) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: const EdgeInsets.all(30),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withOpacity(0.1)),
          ),
          child: child,
        ),
      ),
    );
  }

  Widget _buildDataItem(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.white70)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.cyan)),
        ],
      ),
    );
  }
}

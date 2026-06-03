import 'package:flutter/material.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'background_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String text = "Durdu";
  bool isRunning = false;
  final TextEditingController _urlController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadUrl();
    _checkServiceStatus();
  }

  Future<void> _loadUrl() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _urlController.text = prefs.getString(serverUrlKey) ?? defaultServerUrl;
    });
  }

  Future<void> _saveUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(serverUrlKey, url);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Sunucu adresi kaydedildi')),
    );
  }

  Future<void> _checkServiceStatus() async {
    final service = FlutterBackgroundService();
    bool running = await service.isRunning();
    setState(() {
      isRunning = running;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sensör Verisi Toplama'),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _urlController,
              decoration: const InputDecoration(
                labelText: 'Sunucu URL',
                border: OutlineInputBorder(),
                helperText: 'Eklenecek verilerin gönderileceği adres',
              ),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: () {
                _saveUrl(_urlController.text);
              },
              child: const Text('URL Kaydet'),
            ),
            const SizedBox(height: 30),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white10,
                borderRadius: BorderRadius.circular(15),
              ),
              child: Column(
                children: [
                  const Text(
                    'Arka Plan Servis Durumu:',
                    style: TextStyle(fontSize: 18),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    isRunning ? 'ÇALIŞIYOR' : 'DURDURULDU',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: isRunning ? Colors.green : Colors.redAccent,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              icon: Icon(isRunning ? Icons.stop : Icons.play_arrow),
              label: Text(isRunning ? 'Servisi Durdur' : 'Servisi Başlat'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: isRunning ? Colors.red.shade800 : Colors.green.shade700,
                foregroundColor: Colors.white,
              ),
              onPressed: () async {
                final service = FlutterBackgroundService();
                if (isRunning) {
                  service.invoke("stopService");
                } else {
                  service.startService();
                }
                
                // Bekle ve durumu guncelle
                await Future.delayed(const Duration(seconds: 1));
                _checkServiceStatus();
              },
            ),
            const SizedBox(height: 30),
            Expanded(
              child: StreamBuilder<Map<String, dynamic>?>(
                stream: FlutterBackgroundService().on('update'),
                builder: (context, snapshot) {
                  if (!snapshot.hasData) {
                    return const Center(
                      child: Text('Veri bekleniyor...'),
                    );
                  }

                  final data = snapshot.data!;
                  String displayString = '';
                  if (data.containsKey('data')) {
                    final d = data['data'];
                    displayString += 'İvmeölçer: ${d['accelerometer']['x'].toStringAsFixed(2)}, ${d['accelerometer']['y'].toStringAsFixed(2)}, ${d['accelerometer']['z'].toStringAsFixed(2)}\n\n';
                    displayString += 'Jiroskop: ${d['gyroscope']['x'].toStringAsFixed(2)}, ${d['gyroscope']['y'].toStringAsFixed(2)}, ${d['gyroscope']['z'].toStringAsFixed(2)}\n\n';
                    if (d['location'] != null) {
                      displayString += 'Konum: ${d['location']['latitude'].toStringAsFixed(4)}, ${d['location']['longitude'].toStringAsFixed(4)}\n\n';
                    } else {
                      displayString += 'Konum: Bekleniyor/Kapalı\n\n';
                    }
                  }
                  if (data.containsKey('status')) {
                    displayString += 'Durum: ${data['status']}';
                  }

                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.black26,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.grey.shade800),
                    ),
                    child: SingleChildScrollView(
                      child: Text(
                        displayString,
                        style: const TextStyle(fontSize: 14, fontFamily: 'monospace'),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

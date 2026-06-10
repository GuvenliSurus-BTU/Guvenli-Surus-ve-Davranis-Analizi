import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'background_service.dart'; // Ensure correct path for background service keys

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final TextEditingController _urlController = TextEditingController();
  final TextEditingController _deviceIdController = TextEditingController();
  final TextEditingController _pollingIntervalController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadPrefs();
  }

  Future<void> _loadPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _urlController.text = prefs.getString(serverUrlKey) ?? defaultServerUrl;
      _deviceIdController.text = prefs.getString('device_id') ?? 'mobile-device-01';
      _pollingIntervalController.text = (prefs.getDouble('polling_interval') ?? 0.5).toString();
    });
  }

  Future<void> _savePrefs() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(serverUrlKey, _urlController.text);
    await prefs.setString('device_id', _deviceIdController.text);
    
    double interval = double.tryParse(_pollingIntervalController.text) ?? 0.5;
    if (interval < 0.1) interval = 0.1;
    await prefs.setDouble('polling_interval', interval);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Ayarlar kaydedildi'),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ayarlar'),
        backgroundColor: const Color(0xFF1e1e2f),
        elevation: 0,
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF1e1e2f), Color(0xFF2a2a40)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            _buildGlassPanel(
              child: Column(
                children: [
                  TextField(
                    controller: _deviceIdController,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      labelText: 'Cihaz ID',
                      labelStyle: TextStyle(color: Colors.white54),
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.devices, color: Colors.cyan),
                    ),
                  ),
                  const SizedBox(height: 15),
                  TextField(
                    controller: _urlController,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      labelText: 'Sunucu URL',
                      labelStyle: TextStyle(color: Colors.white54),
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.cloud, color: Colors.blueAccent),
                    ),
                  ),
                  const SizedBox(height: 15),
                  TextField(
                    controller: _pollingIntervalController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      labelText: 'Sensör Okuma Sıklığı (Saniye)',
                      labelStyle: TextStyle(color: Colors.white54),
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.timer, color: Colors.greenAccent),
                    ),
                  ),
                  const SizedBox(height: 25),
                  ElevatedButton(
                    onPressed: _savePrefs,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blueAccent,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      minimumSize: const Size(double.infinity, 50),
                    ),
                    child: const Text('Kaydet ve Geri Dön', style: TextStyle(fontSize: 16)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGlassPanel({required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: child,
    );
  }
}

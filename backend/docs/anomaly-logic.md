# Anomali Tespiti — Mantık ve Gerekçe

## 1. Pipeline

```
POST /sensor-data
        │
        ▼
sensorService.ingestSensorBatch
        │
        ├── SensorReading.insertMany           (kalıcılaştırma)
        ├── thresholdService.getDeviceThresholds (cihaz başına override)
        ▼
analyzeBatch (orkestratör)
        │
        ├── SlidingWindowStore.push(deviceId, readings, windowMs)
        │     → cihaz başına bellekte deque; slidingWindowSec'ten eski örnekleri düşürür
        │
        ├── detectSuddenBrake(window, thresholds)
        ├── detectSuddenAcceleration(window, thresholds)
        ├── detectSharpTurn(window, thresholds)
        ├── detectExcessiveJolt(window, thresholds)
        │
        └── cooldownMap filtresi: aynı (deviceId,type) için eventCooldownMs içinde → düşür
        ▼
alarmService.createMany → Socket.IO 'alarm:new'
```

## 2. Eşik Gerekçesi (Literatür)

Akıllı telefon tabanlı sürücü davranışı analizine ait endüstri veri setleri ve akademik çalışmalar aşağıdaki bantlarda buluşur. Dedektörün ne çok ne de az tetiklenmesi için her bandın **orta değeri** varsayılan olarak seçilmiştir.

| Olay | Endüstri bandı | Kaynak(lar) | Bizim varsayılan |
|-------|---------------|-----------|-------------|
| Sert fren | **0.265 – 0.6 g** (≈ 2.6 – 5.9 m/s²) | Geotab "Driving habits / harsh events", Verizon Connect Reveal dokümanları | **−3.5 m/s²** |
| Sert hızlanma | **0.22 – 0.35 g** (≈ 2.1 – 3.4 m/s²) | Geotab, Digital Matter | **+3.0 m/s²** |
| Sert dönüş (yanal) | **0.4 – 0.55 g** (≈ 3.9 – 5.4 m/s²) | Verizon Connect, filo telematik teknik raporları | **4.0 m/s²** (yedek) |
| Sert dönüş (yaw) | 60 – 90 °/s | Akıllı telefon jiro çalışmaları; ECE R79 | **1.4 rad/s ≈ 80 °/s** |
| Aşırı sarsıntı (tek örnek) | _\|‖a‖ − g\|_ > 5 – 7 m/s² | Çukur tespit literatürü | **6.0 m/s²** |
| Örnekleme oranı | 50 Hz | iOS / Android `CMMotionManager` / `SensorManager` tipik değer | **50 Hz** |

Yanlış pozitiflere karşı önlemler:

- **Sert dönüşler için hız kapısı:** Minimum **4 m/s (~14 km/h)** — park manevralarını bastırır.
- **Örnek-sayısı debounce:** Bir olayın sayılabilmesi için en az **10 örnek** boyunca (50 Hz'de ≈ 200 ms) sürmesi gerekir; böylece tek noktalı gürültü ataklarına alarm üretilmez.
- **Cooldown:** Bir cihazda belirli türde alarm üretildikten sonra aynı türden alarmlar **2 sn** boyunca bastırılır (`eventCooldownMs`).

## 3. Kayan Pencere Mekaniği

`src/services/anomalyDetection/utils.js` dosyası `SlidingWindowStore`'u dışa aktarır:

- `deviceId` başına bir deque (bellekte).
- Her `push(deviceId, readings, windowMs)` çağrısında:
  1. Yeni okumalar mevcut tampon ile birleştirilir.
  2. `ts` alanına göre sıralanır (hafifçe sıra dışı gelen batch'leri tolere eder).
  3. En yeni zaman damgası bulunur; ondan `windowMs` kadar geride olan örnekler atılır.
- Kırpılmış pencere döndürülür — dedektörler bu anlık görüntü üzerinden çalışır.

`slidingWindowSec = 3` → 50 Hz'de 150 örnek. Fren/hızlanma olayının gelişmesi için yeterince uzun, tek bir manevraya odaklanmak için yeterince kısa.

## 4. Dedektör Mantığı

### 4.1 `suddenBrake.js`

- `accel.y <= suddenBrakeAccelMs2` koşulunu sağlayan örnekler süzülür.
- Sayı `requiredSamplesAboveThreshold` değerini geçerse `value = min(accel.y)` ile alarm üretilir.

### 4.2 `suddenAcceleration.js`

- Fren dedektörünün pozitif eksendeki aynası (`accel.y >= suddenAccelerationMs2`).

### 4.3 `sharpTurn.js`

- Örnek başına test: `(|gyro.z| ≥ sharpTurnYawRadS OR |accel.x| ≥ sharpTurnLateralMs2)` ve hız bilgisi varsa `speed ≥ minTurnSpeedMs`.
- Debounce sayısı sağlanırsa yaw eşiği aşıldıysa `value = max(|gyro.z|)`, yalnızca yanal ivme eşiği aşıldıysa `value = max(|accel.x|)` ile alarm üretilir.
- Hız kaynağı tercihi: `gps.speed` → `reading.speed`. Hız bilgisi varsa minimum hız kapısı uygulanır; hiçbiri yoksa yalnızca yanal ivme/yaw eşiği üzerinden tetiklenebilir.

### 4.4 `excessiveJolt.js`

- Her örnek için `|‖accel‖ − 9.81|` hesaplanır.
- Tek bir örnek bile `joltMagnitudeDeltaMs2` değerini aşarsa **veya** pencere Welford standart sapması `joltWindowStdMs2` değerini aşarsa tetiklenir.

## 5. Welford Çevrim-İçi (Online) İstatistik

`utils.welford(values)` içinde uygulanır — tek geçişli, O(1) bellek:

```
mean   ← mean + (x − mean) / count
M2     ← M2 + (x − mean_prev)*(x − mean_new)
variance ← M2 / (count − 1)
```

`excessiveJolt` tarafından, tek bir örneğin tek başına işaretlemeyeceği "titreşim yoğun" pencereleri yakalamak için kullanılır.

## 6. Şiddet (Severity) Formülü

```
overshoot = |measured_value| / |threshold|
overshoot < 1.5            → 'low'
1.5 ≤ overshoot < 2.0      → 'medium'
overshoot ≥ 2.0            → 'high'
```

Sınır durumu testleri `tests/unit/utils.test.js` dosyasındadır.

## 7. Cooldown ve Debounce

Orkestratör (`src/services/anomalyDetection/index.js`), modül seviyesinde bir
`Map<string,number>` tutar; anahtar `${deviceId}:${type}`'dir. Değer; o ikili için kabul edilen son alarmın milisaniye damgasıdır. `eventCooldownMs` içindeki her yeni aday sessizce düşürülür.

Böylece sürekli devam eden tek bir fren olayından düzinelerce üst üste alarm üretilmesi önlenmiş olur — tam olarak tek bir alarm yayılır, ardından 2 saniye sonra cooldown yeniden devreye girer.

## 8. Cihaz Başına Eşik Override'ları

`ThresholdConfig.overrides`, `analyzeBatch` içinde yüklenir ve `config/thresholds.js` üzerine bindirilir. Yazım anında alarm kaydına geçen `alarm.threshold` alanı **tam değer** (varsa override edilmiş) ile **snapshot** alınır; böylece eşik düzenlemeleri geçmiş alarmların yorumunu geriye dönük olarak değiştirmez.

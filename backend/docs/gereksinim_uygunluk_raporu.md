# Güvenli Sürüş Senaryosu – Veritabanı ve Anomali Tespiti Modülü Uygunluk Raporu

> Bu rapor, Bursa Teknik Üniversitesi Bilgisayar Mühendisliği Bölümü "Node.js ile Web Programlama" dersi dönem projesinin **Güvenli Sürüş ve Sürücü Davranışı Analizi (Senaryo 1)** çıktıları için hazırlanmıştır. Raporun odağı, geliştirdiğim **Veritabanı ve Anomali Tespiti** modülüdür (`backend/`). Belge `backend/docs/gereksinim_uygunluk_raporu.md` yoluna kaydedilmiştir.

---

## 1. Giriş ve Kapsam

- **Senaryo:** Senaryo 1 – Güvenli Sürüş ve Sürücü Davranışı Analizi. Telefon araç içinde IoT düğümü olarak kullanılır; ivmeölçer, jiroskop ve GPS verileri üzerinden riskli sürüş olayları tespit edilir.
- **Sorumluluk alanı (bu rapor):** Veritabanı tasarımı, sensör verisi saklanması, alarm/anomali kayıtlarının tutulması ve eşik tabanlı anomali tespit algoritmalarının geliştirilmesi.
- **Birincil kapsanan zorunlu modüller:** Föy §5.4 (Veritabanı), §5.6 (Analiz / Anomali tespit), §5.7 (Alarm / Bildirim), §5.8 (Dokümantasyon).
- **Destekleyici olarak ele alınan modüller:** §5.2 (Backend iskeleti), §5.3 (Yetkilendirme yer tutucusu), §5.5 (Gerçek zamanlı yayın).
- **Kapsam dışı:** Mobil uygulama, tam kimlik/login servisi üretimi ve izleme paneli arayüzü bu modülün kapsamı dışındadır. Entegrasyon sözleşmelerini `docs/integration.md` içinde belgeledim; bu alanların kodunu bu modülde teslim etmedim.

---

## 2. Proje Föyünden Çıkarılan Gereksinim Listesi

Aşağıdaki maddeler, `nodejsProjeGereksinimler.md` dosyasından ve `takım_görevleri.md` ekip sözleşmesinden Senaryo 1'e ve veritabanı + anomali tespiti rolüne dair açık ve örtük tüm gereksinimler süzülerek hazırlandı.

### 2.1 Senaryoya Bağlı Davranış Gereksinimleri (Senaryo 1)

1. **G-S1-1:** Akıllı telefon araç içinde IoT düğümü gibi kullanılmalı; ivmeölçer, jiroskop ve GPS verisi alınmalıdır.
2. **G-S1-2:** Aşağıdaki riskli sürüş olayları tespit edilmelidir:
   - **G-S1-2a:** Ani fren tespiti
   - **G-S1-2b:** Sert dönüş tespiti
   - **G-S1-2c:** Beklenmeyen / ani hızlanma tespiti
   - **G-S1-2d:** Sarsıntı eşiğinin aşılması (aşırı sarsıntı / şok)
   - **G-S1-2e:** (Bonus) Güzergâh dışına çıkma
3. **G-S1-3:** Tespit edilen olaylar alarm olarak kullanıcıya/panele sunulmalı, geçmiş kayıtlar listelenebilmelidir.

### 2.2 Zorunlu Modül Gereksinimleri (Föy §5)

4. **G-F5.1:** Mobilden en az iki sensörden zaman damgalı veri toplanması ve sunucuya iletilmesi (mobil tarafın görevi; bu modül en az iki sensörü kabul etmeli ve doğrulamalıdır).
5. **G-F5.2:** Node.js + REST tabanlı backend; gelen verinin kabul edilmesi, doğrulanması ve saklanması.
6. **G-F5.3:** Kullanıcı doğrulama ve en az iki rol; yetkisiz erişimin engellenmesi.
7. **G-F5.4:** Kullanıcı, cihaz, sensör verisi ve alarm/anomali kayıtlarının veritabanında saklanması; veri modelinin açık ve anlamlı olması.
8. **G-F5.5:** Gerçek zamanlı izleme paneli için backend tarafında geçmiş ve canlı veri besleme uçları.
9. **G-F5.6:** En az bir zaman serisi analizi veya anomali tespiti yaklaşımı (istatistik, eşik veya temel makine öğrenmesi).
10. **G-F5.7:** Riskli/anomali durumlarının panelde gösterilebilecek şekilde kayıt altına alınması; alarm listeleme.
11. **G-F5.8:** Dokümantasyon: kurulum, sistem mimarisi, API açıklaması, veri modeli, görev dağılımı, test senaryoları.

### 2.3 Geliştirme İlkeleri ve Veri Gizliliği (Föy §8)

12. **G-İlke-1:** Modüler tasarım, temiz kod, anlamlı klasör yapısı.
13. **G-İlke-2:** Hata yakalama ve uygun HTTP yanıtları, veri doğrulama.
14. **G-İlke-3:** Veri minimizasyonu, kullanıcı rızası, gerekmeyen ham veriyi saklamama.
15. **G-İlke-4:** Düzenli commit geçmişi.

### 2.4 Bonus / Önerilen Özellikler (Föy §6)

16. **G-Bonus-1:** WebSocket ile canlı veri akışı.
17. **G-Bonus-2:** Docker ile container tabanlı dağıtım.
18. **G-Bonus-3:** Swagger / OpenAPI entegrasyonu.
19. **G-Bonus-4:** Loglama ve hata izleme.
20. **G-Bonus-5:** Otomatik test senaryoları.
21. **G-Bonus-6:** Rol tabanlı gelişmiş yetkilendirme.
22. **G-Bonus-7:** Raporlama (CSV/PDF dışa aktarma; özet uç noktaları).

### 2.5 Ekip İçi Sorumluluk Gereksinimleri (`takım_görevleri.md`)

23. **G-Ekip-1:** Veritabanı tasarımının yapılması.
24. **G-Ekip-2:** Sensör verilerinin saklanması.
25. **G-Ekip-3:** Alarm kayıtlarının tutulması.
26. **G-Ekip-4:** Riskli sürüş davranışlarının tespit edilmesi (ani fren, sert dönüş, ani hızlanma, aşırı sarsıntı).
27. **G-Ekip-5:** MongoDB veya PostgreSQL kullanımı, eşik tabanlı analiz algoritmaları.
28. **G-Ekip-6:** Teslim çıktıları: veritabanı şeması, anomali tespit modülü, alarm oluşturma sistemi.

---

## 3. Mevcut Durum Özeti

### 3.1 Teknoloji Yığını

- **Runtime:** Node.js, Express 5.x.
- **Veritabanı:** MongoDB 6.0+ (Mongoose 9.x ODM). `sensor_readings` koleksiyonu MongoDB time-series koleksiyonu olarak oluşturuluyor ve `expireAfterSeconds = 2.592.000` ile 30 günlük TTL ile yaşlandırılıyor.
- **Doğrulama:** Joi 18.x, `validate` middleware'i.
- **Gerçek zaman:** Socket.IO 4.x, `/realtime` namespace ve `alarm:new` olayı.
- **Dokümantasyon:** Swagger UI (`/docs`), Postman koleksiyonu, dört Markdown rehberi (`docs/`).
- **Test:** Jest + supertest + `mongodb-memory-server`.
- **Araçlar:** ESLint, Prettier, Husky (pre-commit), commitlint, pino logger, helmet, cors, express-rate-limit.

### 3.2 Klasör Yapısı (Ana Hatlar)

```
backend/
├─ src/
│  ├─ app.js, server.js
│  ├─ config/           env.js, db.js, swagger.js, thresholds.js
│  ├─ models/           User, Device, Trip, SensorReading, Alarm, ThresholdConfig, AnalysisRun
│  ├─ services/         sensor, alarm, trip, threshold, device, report,
│  │                    anomalyDetection/ (suddenBrake, suddenAcceleration,
│  │                                       sharpTurn, excessiveJolt, utils, index)
│  ├─ controllers/      her ana kaynak için ayrı kontrolcü
│  ├─ routes/           her kaynak için ayrı router (Swagger JSDoc)
│  ├─ middleware/       errorHandler, requireAuth, validate, requestLogger
│  ├─ validators/       Joi şemaları
│  ├─ realtime/socket.js
│  └─ utils/            logger, asyncHandler
├─ scripts/             seed.js, simulateDrive.js
├─ tests/               unit/ + api/
└─ docs/                data-model.md, anomaly-logic.md, api.md,
                        integration.md, postman_collection.json, postman_environment.json
```

### 3.3 Ana Modüller

- **Anomali tespit pipeline'ı:** `ingestSensorBatch` → `analyzeBatch` → dört dedektör + cooldown filtresi → `Alarm.insertMany` → Socket.IO `alarm:new` yayını.
- **Eşik yönetimi:** Varsayılanlar `src/config/thresholds.js` dosyasındadır; cihaz bazında `ThresholdConfig` koleksiyonu ile geçersiz kılınabilir.
- **Rapor uçları:** Trip bazlı özet (`reportService.tripReport`) ve cihaz günlük yoğunluk raporu (`reportService.deviceDailyReport`).

---

## 4. Gereksinim – Karşılanma Matrisi

| Gereksinim | Durum | Kanıt (dosya/satır) | Açıklama |
|---|---|---|---|
| G-S1-1 Telefon sensörlerinin (ivme, jiro, GPS) backend tarafında kabulü | Tamam | `src/validators/sensorSchema.js` 1-30; `src/models/SensorReading.js` 1-42 | İvmeölçer ve jiroskopun üç ekseni zorunlu, GPS opsiyonel. |
| G-S1-2a Ani fren tespiti | Tamam | `src/services/anomalyDetection/suddenBrake.js` 1-20 | `accel.y <= -3.5 m/s²` örnek sayısı 10'u aşarsa alarm. |
| G-S1-2b Sert dönüş tespiti | Tamam | `src/services/anomalyDetection/sharpTurn.js` 1-27 | Yaw veya yanal ivme eşiği + minimum hız kapısı. |
| G-S1-2c Ani hızlanma tespiti | Tamam | `src/services/anomalyDetection/suddenAcceleration.js` 1-20 | `accel.y >= +3.0 m/s²` örnek sayısı 10'u aşarsa alarm. |
| G-S1-2d Aşırı sarsıntı (jolt) tespiti | Tamam | `src/services/anomalyDetection/excessiveJolt.js` 1-25 | Tekil örnek `|‖a‖−g|` veya pencere Welford std sapması eşiği. |
| G-S1-2e Güzergâh dışına çıkma | Eksik | – | Bonus madde; bu modülün kapsamına alınmadı. |
| G-S1-3 Alarm listelenebilir | Tamam | `src/services/alarmService.js` 8-29; `src/routes/alarmRoutes.js` 1-11 | `GET /api/v1/alarms` filtre ve sayfalama destekler. |
| G-F5.1 En az iki sensör + zaman damgası | Tamam | `src/validators/sensorSchema.js` 3-22; `src/models/SensorReading.js` 5-29 | `ts`, `accel`, `gyro` zorunlu; `gps`, `speed` opsiyonel. |
| G-F5.2 Node.js + REST + doğrulama + saklama | Tamam | `src/app.js` 21-53; `src/services/sensorService.js` 7-37 | Express 5, Joi doğrulama, `SensorReading.insertMany` ile saklama. |
| G-F5.3 Kullanıcı doğrulama + en az iki rol | Kısmen | `src/middleware/requireAuth.js` 1-36; `src/models/User.js` 1-12; `tests/unit/auth.test.js` | İki rol (`admin`, `driver`) tanımlı, `authorize` mevcut ve `AUTH_MODE=jwt` modunda imzalı JWT doğrulanıyor; kullanıcı kayıt/login akışı bu modülün kapsamı dışında. Demo modunda `AUTH_MODE=bypass`. |
| G-F5.4 Veri modeli (kullanıcı, cihaz, sensör, alarm) | Tamam | `src/models/*`; `docs/data-model.md` 1-130 | Yedi koleksiyon, 3NF ilkeleri, indeksler ve ilişkiler belgelenmiş. |
| G-F5.5 Gerçek zamanlı için backend besleme | Tamam | `src/realtime/socket.js` 1-9; `src/controllers/sensorController.js` 15-17 | Socket.IO `/realtime` namespace ve `device:{id}` room üzerinden alarm yayını. |
| G-F5.6 Zaman serisi/anomali tespit yaklaşımı | Tamam | `src/services/anomalyDetection/` tamamı; `docs/anomaly-logic.md` 1-118 | Eşik + 3 saniyelik kayan pencere + Welford istatistikleri + cooldown. |
| G-F5.7 Alarm kaydı ve listeleme | Tamam | `src/models/Alarm.js` 1-31; `src/services/alarmService.js` 1-35 | Eşik anlık görüntüsü, severity, pencere sınırları, GPS, kanıt alanı kalıcı tutuluyor. |
| G-F5.8 Dokümantasyon | Tamam | `README.md`; `docs/data-model.md`; `docs/anomaly-logic.md`; `docs/api.md`; `docs/integration.md`; Swagger `/docs` | Kurulum, mimari, veri modeli, API ve entegrasyon ayrı ayrı belgelenmiş. |
| G-İlke-1 Modüler tasarım | Tamam | `src/` ağacının tamamı | Katman ayrımı (model/service/controller/route/validator/middleware/utils). |
| G-İlke-2 Hata yakalama + HTTP doğrulama | Tamam | `src/middleware/errorHandler.js`; `src/middleware/validate.js`; `src/utils/asyncHandler.js` | 400/401/403/404/409/422/429/500 zarfları tutarlı. |
| G-İlke-3 Veri minimizasyonu / gizlilik | Tamam | `README.md` "Privacy & Data Retention" bölümü; `src/models/SensorReading.js` 3-39 | Mikrofon/manyetometre/ışık verisi toplanmıyor; 30 gün TTL. |
| G-İlke-4 Düzenli commit geçmişi | Kısmen | `COMMIT_PLAN.md` 1-163 | Atomik commit yol haritası mevcut; commit'ler sırayla atılıyor. |
| G-Bonus-1 WebSocket | Tamam | `src/realtime/socket.js`; `src/server.js` 8-19 | Socket.IO ile gerçek zaman. |
| G-Bonus-2 Docker | Kısmen | `docker-compose.yml` | Compose dosyası var; Dockerfile yazılmamış. |
| G-Bonus-3 Swagger / OpenAPI | Kısmen | `src/config/swagger.js`; `src/app.js` 49; `src/routes/sensorRoutes.js`; `src/routes/reportRoutes.js` | `/docs` arayüzü mevcut; ayrıntılı JSDoc blokları sensor ve report rotalarında var. Diğer rotalar için ana kaynak `docs/api.md`. |
| G-Bonus-4 Loglama / hata izleme | Tamam | `src/utils/logger.js`; `src/middleware/requestLogger.js`; `src/middleware/errorHandler.js` | pino + pino-http + hata middleware'i. |
| G-Bonus-5 Otomatik test | Kısmen | `tests/unit/anomaly.test.js`; `tests/unit/utils.test.js`; `tests/unit/auth.test.js`; `tests/api/sensor.api.test.js` | Dedektörler, auth JWT modu, sensor ingest ve otomatik trip açma test ediliyor; alarm filtreleme, trip kapatma/listeme ve rapor uçları test dışı. |
| G-Bonus-6 Rol tabanlı yetkilendirme | Tamam | `src/middleware/requireAuth.js` 24-31 | `authorize('admin')` eşik düzenleme uçlarında kullanılıyor. |
| G-Bonus-7 Raporlama uçları | Tamam | `src/services/reportService.js`; `src/routes/reportRoutes.js` | Trip raporu ve günlük cihaz yoğunluğu; CSV/PDF dışa aktarma yok (kapsam dışı). |
| G-Ekip-1 Veritabanı şeması | Tamam | `src/models/*`; `docs/data-model.md` | 3NF prensipleri, indeksler ve ilişki diyagramı mevcut. |
| G-Ekip-2 Sensör verisi saklama | Tamam | `src/models/SensorReading.js`; `src/services/sensorService.js` | Time-series koleksiyon, 30 gün TTL. |
| G-Ekip-3 Alarm kayıtları | Tamam | `src/models/Alarm.js`; `src/services/alarmService.js` | Persist + filtreleme + sayfalama. |
| G-Ekip-4 Riskli olay tespiti | Tamam | `src/services/anomalyDetection/` | Dört dedektör + cooldown + override. |
| G-Ekip-5 MongoDB + eşik analizi | Tamam | `src/config/thresholds.js`; `src/services/anomalyDetection/index.js` | MongoDB, eşik + kayan pencere + Welford. |
| G-Ekip-6 Teslim çıktıları | Tamam | `src/models/`, `src/services/anomalyDetection/`, `src/services/alarmService.js` | Şema, anomali modülü ve alarm sistemi tamamlanmış. |

---

## 5. Veri Modeli Değerlendirmesi

`docs/data-model.md` dosyasında ER diyagramı ve normalizasyon gerekçeleri ayrıntılı olarak yer almaktadır. Aşağıda her şemanın senaryoya uygunluğu özetlenmiştir.

### 5.1 `User` (`src/models/User.js`)

- Alanlar: `username` (tekil), `passwordHash` (`placeholder_hash` ile başlatılıyor; gerçek hash tam kimlik akışı üretilirken doldurulacak), `role` (`admin` / `driver`).
- **Senaryoya uygunluk:** İki rol gereksinimi karşılanıyor (G-F5.3). Şifre üretimi bu modülün sorumluluğunda olmadığı için yer tutucu kullanılmış.

### 5.2 `Device` (`src/models/Device.js`)

- Alanlar: `userId` (kullanıcıya FK ve indeks), `label`, `platform` (`android`/`ios`), `model`, `appVersion`, `registeredAt`, `lastSeenAt` (indeksli).
- **Senaryoya uygunluk:** Birden fazla cihazın aynı kullanıcıya atanması destekleniyor; "telefon araç içinde IoT düğümü" varsayımı için yeterli.

### 5.3 `Trip` (`src/models/Trip.js`)

- Alanlar: `deviceId`, `userId`, `startedAt`, `endedAt`, `status` (`active`/`ended`), `summary` (`totalAlarms`, `alarmByType`, `averageSpeedMs`). `{deviceId, startedAt}` bileşik indeksi.
- **Senaryoya uygunluk:** Sürüş oturumlarını ayrı analiz edebilmek ve özet rapor üretmek için kullanılıyor. Trip kapanışında `summary` materyalize ediliyor → rapor uçlarının hızlı çalışmasını sağlar.

### 5.4 `SensorReading` (`src/models/SensorReading.js`)

- MongoDB **time-series** koleksiyonu: `timeField = ts`, `metaField = meta`, `granularity = seconds`, `expireAfterSeconds = 2.592.000` (30 gün).
- `accel.{x,y,z}`, `gyro.{x,y,z}` zorunlu; `gps`, `speed` opsiyonel.
- **Senaryoya uygunluk:** Yüksek frekanslı (50 Hz) verinin saklanması için en uygun yapı. Gizlilik prensibi (G-İlke-3) doğrudan koleksiyon seçeneğine gömülmüş.

### 5.5 `Alarm` (`src/models/Alarm.js`)

- `deviceId`, `tripId`, `type` (dört sürüş anomalisi), `severity` (`low`/`medium`/`high`), `value`, `threshold` (anlık görüntü), `unit`, `windowStart`, `windowEnd`, `gps`, `evidence`. `{deviceId, createdAt}` bileşik indeksi.
- **Senaryoya uygunluk:** Föy §5.7 ve G-S1-3 maddesini doğrudan karşılar. `threshold` alanının kayıt anındaki değeri saklanması, eşik değiştiğinde geçmiş alarmların yorumlanabilirliğini koruduğu için bilinçli bir tasarım kararıdır.

### 5.6 `ThresholdConfig` (`src/models/ThresholdConfig.js`)

- Tekil `deviceId` indeksi; `overrides` alanı kısmî sub-document (yalnızca varsayılandan sapan değerler).
- **Senaryoya uygunluk:** Farklı araç/sürücü için kişiselleştirilebilir eşikler sağlar; tüm cihaz için varsayılana dönmek mümkündür.

### 5.7 `AnalysisRun` (`src/models/AnalysisRun.js`)

- `deviceId`, `tripId`, `readingsCount`, `alarmsCount`; debug ve denetim amaçlı.
- **Senaryoya uygunluk:** Föy doğrudan istemese de denetim ve regresyon analizi için faydalı bir ek.

### 5.8 Veri Modeli Genel Değerlendirme

- 3NF prensipleri: `Trip.summary` ve `Alarm.threshold` dışında türetilmiş alan yoktur; bu iki istisna belgelenmiştir (`docs/data-model.md`).
- İndeks stratejisi: izleme paneli sorgularına (cihaz bazlı son alarmlar, trip listesi) uygundur.
- Eksik: Coğrafi sorgular için 2dsphere indeksi yok; gelecekte "kötü davranış sıcak noktaları" haritası için eklenebilir.

---

## 6. Anomali Tespit Modülü Değerlendirmesi

### 6.1 Genel Pipeline

`src/services/anomalyDetection/index.js` orkestratör görevini görür:

1. Gelen batch `SlidingWindowStore` üzerinden cihaz başına bir deque'ye eklenir; `slidingWindowSec = 3 s` (≈150 örnek @50 Hz).
2. Cihaza özel eşikler `mergeThresholds` ile varsayılan + override şeklinde birleşir.
3. Dört dedektör pencere üzerinde çalıştırılır.
4. `(deviceId, type)` ikilisi için `eventCooldownMs = 2000 ms` cooldown filtresi uygulanır.
5. Tespit edilenler kalıcılaştırılır ve Socket.IO ile yayınlanır.

### 6.2 Dedektör Formülleri

- **Ani fren (`suddenBrake.js`):** `accel.y ≤ suddenBrakeAccelMs2 (= −3.5 m/s²)` koşulunu en az `requiredSamplesAboveThreshold = 10` örnek için sağlamalıdır. `value = min(accel.y)`.
- **Ani hızlanma (`suddenAcceleration.js`):** `accel.y ≥ +3.0 m/s²` koşulu, aynı debounce ile. `value = max(accel.y)`.
- **Sert dönüş (`sharpTurn.js`):** `( |gyro.z| ≥ 1.4 rad/s OR |accel.x| ≥ 4.0 m/s² ) AND speed ≥ 4 m/s`. Hız kapısı park manevralarını eler. `value = max(|gyro.z|)`.
- **Aşırı sarsıntı (`excessiveJolt.js`):**
  - Tekil örnek: `|‖a‖ − 9.81| ≥ joltMagnitudeDeltaMs2 (= 6.0 m/s²)`.
  - Veya pencere: Welford std sapması `≥ joltWindowStdMs2 (= 2.5 m/s²)`.

### 6.3 Şiddet (Severity) Formülü

`utils.computeSeverity(value, threshold)`:

```
overshoot = |value| / |threshold|
overshoot ≥ 2.0   → high
1.5 ≤ overshoot < 2.0 → medium
overshoot < 1.5   → low
```

### 6.4 Welford Online İstatistik

`utils.welford(values)` tek geçişte O(1) bellek ile ortalama ve örnek varyansı verir. Aşırı sarsıntı dedektöründe pencere genelinin titreşim seviyesini ölçmek için kullanılır.

### 6.5 Eşik Gerekçesi

`docs/anomaly-logic.md` literatür kaynaklarına (Geotab, Verizon Connect, ECE R79, pothole detection makaleleri) atıfla şu bantlardan ortalama değerleri seçer:

| Olay | Endüstri bandı | Varsayılan |
|------|----------------|-----------|
| Ani fren | 0.265 – 0.6 g | −3.5 m/s² |
| Ani hızlanma | 0.22 – 0.35 g | +3.0 m/s² |
| Sert dönüş yaw | 60 – 90 °/s | 1.4 rad/s |
| Sert dönüş yanal | 0.4 – 0.55 g | 4.0 m/s² |
| Sarsıntı tekil örnek | 5 – 7 m/s² | 6.0 m/s² |

### 6.6 Anti-False-Positive Önlemleri

- **Örnek-sayısı debouncing:** 10 örnek (≈200 ms) altı olaylar bastırılır.
- **Cooldown:** Aynı cihaz–olay türü çifti için 2 sn içinde tekrar alarm üretilmez.
- **Hız kapısı:** Hız bilgisi mevcutsa park / yavaş manevralar dönüş alarmı üretmez. Hız bilgisi yoksa dedektör yanal ivme/yaw eşiği ile çalışmaya devam eder.
- **Yerçekimi ayrıştırma beklentisi:** Mevcut pipeline yerçekimi çıkarılmış ivme bekler. `utils.lowPassGravity` yardımcı fonksiyonu test ve ilerideki adaptasyonlar için hazırdır; ingest sırasında otomatik uygulanmaz.

### 6.7 Senaryoya Uygunluk Değerlendirmesi

Senaryo 1'in dört kritik olayı doğrudan karşılanmaktadır. Algoritmalar mobil sensör verisinin tipik gürültü profiline göre debounce ve cooldown ile sağlamlaştırılmıştır. Bonus madde "güzergâh dışına çıkma" bu sürümde uygulanmamıştır.

---

## 7. Alarm/Bildirim Mekanizması Değerlendirmesi

- **Kalıcılaştırma:** `alarmService.createMany` ile `Alarm.insertMany`. Eşik snapshot'ı, severity, GPS ve isteğe bağlı kanıt nesnesi (`evidence.std` vb.) tek bir kayda yazılır.
- **Listeleme:** `GET /api/v1/alarms?deviceId&tripId&type&severity&from&to&page&limit` — filtre kombinasyonları, sayfalama ve toplam sayım döner.
- **Detay:** `GET /api/v1/alarms/:id` 404 zarfı ile birlikte tek alarm döner.
- **Gerçek zaman:** Sensor controller, oluşan her alarmı `req.io.to('device:{deviceId}').emit('alarm:new', alarm)` ile yayınlar. İzleme paneli istemcisi `socket.emit('join-device', deviceId)` ile ilgili odaya katılır.
- **Cooldown:** Aynı olayın sürekli akışı (örn. uzun fren), `(deviceId,type)` cooldown haritası ile tek alarma indirgenir.
- **Senaryoya uygunluk:** Föy §5.7 ve Senaryo 1'in "alarm durumları" başlığı bütünüyle karşılanmaktadır.

Geliştirme önerisi: Push bildirim/SMS/e-posta katmanı henüz yok. Föy bunu zorunlu kılmıyor; ek değer için bonus olarak eklenebilir.

---

## 8. Eksikler ve Yapılması Önerilenler

Aşağıdaki maddeler, raporun yazıldığı anda **eksik** veya **kısmen** olarak işaretlenen kalemlere karşılık gelir. Öncelik sıralaması belirtilmiştir.

1. **(Yüksek) Kullanıcı kayıt / giriş akışı.** Hash, login ve refresh token üretimi bu modülün kapsamı dışındadır. `User` modeli ve imzalı JWT doğrulamasını hazır tuttum; entegrasyon testleri planlanmalıdır.
2. **(Orta) JWT entegrasyon sözleşmesi.** `AUTH_MODE=jwt` modunda `{ userId, role }` payload'lı imzalı token doğrulanır. Entegre eden uygulama aynı `JWT_SECRET` değerini kullanabilir veya `requireAuth.js` dosyasını kendi doğrulayıcısıyla değiştirebilir.
3. **(Orta) Trip yaşam döngüsü uç noktası testi.** Otomatik trip açma test edildi; ancak trip kapatma/listeleme/detay uçları için ayrıca unit/integration testi eklenmeli.
4. **(Orta) Rapor uçları için test.** `reportService.deviceDailyReport` aggregation pipeline'ı için sahte veriyle bir Jest testi eklenmesi önerilir.
5. **(Orta) Dockerfile.** `docker-compose.yml` var ancak `Dockerfile` eksik. Cihaz/ürün sunumunda tek komutla demo için faydalı.
6. **(Orta) CSV/PDF dışa aktarma.** Föy §6 bonus özelliği. `/api/v1/reports/...` çıktıları için `Content-Type: text/csv` desteği eklenebilir.
7. **(Düşük) Güzergâh dışına çıkma tespiti.** Senaryo 1'in bonus maddesi. Geofence koleksiyonu + `2dsphere` indeksi ile entegre edilebilir.
8. **(Düşük) `AnalysisRun` raporlama uçları.** Şu an yalnızca yazılıyor; bir admin paneli ucu (örn. `GET /api/v1/analysis-runs?deviceId=&from=&to=`) faydalı olabilir.
9. **(Düşük) GeoIndex.** Cihaz başına ısı haritası (sıcak nokta) için `alarms.gps` üzerinde `2dsphere` indeksi.
10. **(Düşük) Rate limit incelemesi.** Saniyede 50 örneklik batch'ler için varsayılan `RATE_LIMIT_MAX=300` makul; canlı saha sürümünde IP başına token-bucket ile değerlendirilmeli.

---

## 9. Entegrasyon Notları

Bu modülün dış dünyaya sunduğu sözleşme `docs/integration.md` dosyasında özetlenmiştir. Kendi tarafımda öne çıkan noktalar:

- **Sensör ingest:** `POST /api/v1/sensor-data` — Joi doğrulama, 422 hata zarfı, otomatik trip açma. Batch biçimi ve birim beklentileri entegrasyon dokümanında.
- **Tek temas noktası:** Modülü ana uygulamaya mount ederken değiştirilmesi gereken yer `requireAuth` middleware'idir (`(req, res, next)`, `req.user = { _id, role }`). `AUTH_MODE=jwt` modunda `{ userId, role }` payload'lı imzalı token doğrulanır.
- **İzleme ve raporlama:** REST (`GET /alarms`, `/sensor-data`, `/trips`, `/reports/*`) ve Socket.IO `/realtime` + `alarm:new`. Yanıt zarfları: 2xx `{ data }`, liste `{ data, meta }`, hata `{ error }`.
- **Kapsam dışı:** Tam kimlik/login akışı, dağıtım/TLS/altyapı ve izleme paneli arayüzü bu modülde yok. Canlı sensör akışı için ayrı bir Socket.IO event'i (`reading:new`) henüz tanımlı değil; geçmiş veri `GET /sensor-data` ile alınabilir.

---

## 10. Test ve Kalite Durumu

### 10.1 Mevcut Testler

- `tests/unit/anomaly.test.js`: Dört dedektörün pozitif/negatif senaryoları (12 örnek + sınır durumları), yanal ivme fallback'i, cooldown ve threshold override testleri.
- `tests/unit/utils.test.js`: `magnitude`, `lowPassGravity`, `welford`, `computeSeverity`, `SlidingWindowStore` için referans değerli testler.
- `tests/unit/auth.test.js`: `AUTH_MODE=jwt` modunda imzalı token kabulü ve sahte token reddi.
- `tests/api/sensor.api.test.js`: `mongodb-memory-server` ile `POST /api/v1/sensor-data` happy-path, 422 doğrulama ve `tripId` yokken otomatik trip açma testleri.

### 10.2 Kalite Araçları

- ESLint + Prettier + lint-staged + Husky pre-commit hook.
- commitlint conventional commits enforcement.
- pino logger + pino-http istek loglama.
- Joi tabanlı runtime validation.

### 10.3 Eksikler

- Trip kapatma/listeleme/detay uç noktaları için integration test yok.
- Rapor uçları için aggregation pipeline testleri yok.
- Alarm filtre kombinasyonları test edilmedi.
- Socket.IO `alarm:new` yayını için bir integration test eklenebilir (örn. `socket.io-client`).

---

## 11. Sonuç

### Tamamlananlar

- **Veritabanı:** 7 koleksiyon, 3NF prensipleri, indeksler, time-series + 30 gün TTL.
- **Anomali tespiti:** 4 dedektör + kayan pencere + Welford + cooldown + cihaz bazlı eşik override.
- **Alarm ve bildirim:** Kalıcı kayıt, REST listeleme, Socket.IO `alarm:new` yayını.
- **Dokümantasyon:** README, dört Markdown rehberi, Postman koleksiyonu, Swagger arayüzü (`/docs`). Ayrıntılı JSDoc sensor/report rotalarıyla sınırlı; tam API listesi `docs/api.md`.
- **Kalite:** ESLint, Prettier, Husky, commitlint, pino loglama, Joi doğrulama, birim ve API testleri (dedektörler, auth JWT, sensor ingest).

### Eksik veya kısmi kalanlar

- Tam kullanıcı kayıt/giriş akışı (modül kapsamı dışında; `User` + JWT doğrulama hazır).
- Trip kapatma/listeleme/detay ve rapor uçları için ek integration testleri.
- Dockerfile, CSV/PDF dışa aktarma, güzergâh dışına çıkma (bonus).
- Canlı sensör akışı için `reading:new` Socket.IO event'i (isteğe bağlı genişletme).

Genel değerlendirme: Bu modülde zorunlu gereksinimlerin tamamı karşılanmıştır; önemli bonus maddeleri (Swagger, WebSocket, loglama, rol tabanlı yetkilendirme, raporlama uçları) de mevcuttur. İyileştirme için **§8 Eksikler ve Yapılması Önerilenler** listesine bakılabilir.

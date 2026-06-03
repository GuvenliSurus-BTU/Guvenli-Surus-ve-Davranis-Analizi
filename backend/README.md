# backend — Veritabanı ve Anomali Tespiti Servisi

Bu modülde MongoDB tabanlı, 3NF normalizasyon ilkeleriyle tasarlanmış, eşik + kayan pencere (sliding-window) istatistiksel anomali tespiti yapan bağımsız bir Node.js servisi sunuyorum. Ani fren, sert dönüş, ani hızlanma ve aşırı sarsıntı olaylarını tespit edip alarm üretiyorum; modül ana backend uygulamasına modüler biçimde drop-in entegre olabilir.

## Projenin Amacı

Ham sensör (ivmeölçer + jiroskop + GPS) batch'lerini ingest ediyorum, sürüş davranışını gerçek zamanlıya yakın analiz ediyorum, tespit edilen anomalileri kalıcı alarm kayıtlarına dönüştürüyorum ve hem REST hem Socket.IO üzerinden izleme paneline yayınlıyorum. Katmanları (models / services / controllers / routes / validators / middleware / realtime / utils) ayrı dosyalarda tuttum; böylece modül ana backend uygulamasına birebir mount edilebilir.

## Zorunlu Modül Eşleştirmesi (`nodejsProjeGereksinimler.md` Bölüm 5)

| Modül | Rol | Kapsam |
|-------|-----|--------|
| 5.4 Veritabanı | **Birincil** | 3NF, time-series koleksiyon, indeksler |
| 5.6 Analiz / Anomali | **Birincil** | 4 dedektör + kayan pencere + Welford |
| 5.7 Alarm / Bildirim | **Birincil** | Alarm persist + Socket.IO yayın |
| 5.8 Dokümantasyon | **Birincil (bu modül kapsamı)** | README + 4 doküman + Swagger + Postman |
| 5.2 Backend | Destekleyici | Modül kendi Express uygulamasını içerir; ana backend uygulamasına modüler entegre olur |
| 5.3 Yetkilendirme | Destekleyici | `requireAuth` yer tutucusu + `authorize` rol yardımcısı |
| 5.5 Gerçek zamanlı | Destekleyici | `GET /sensor-data` + Socket.IO `alarm:new` |

## Klasör Yapısı

```
backend/
├─ src/
│  ├─ app.js              # Express başlatma + middleware
│  ├─ server.js           # http + socket.io bootstrap
│  ├─ config/             # env (Joi), db, thresholds, swagger
│  ├─ models/             # User, Device, Trip, SensorReading, Alarm, ThresholdConfig, AnalysisRun
│  ├─ services/           # sensor, alarm, trip, threshold, device, report, anomalyDetection/*
│  ├─ controllers/        # sensor, alarm, trip, threshold, device, report, health
│  ├─ routes/             # her kontrolcü için ayrı router
│  ├─ middleware/         # errorHandler, requireAuth, validate, requestLogger
│  ├─ validators/         # Joi şemaları
│  ├─ realtime/socket.js  # /realtime namespace, alarm:new yayıcı
│  └─ utils/              # logger.js, asyncHandler.js
├─ scripts/               # seed.js, simulateDrive.js
├─ tests/                 # unit/ + api/ + fixtures/
├─ docs/                  # data-model.md, anomaly-logic.md, api.md, integration.md, postman_*
├─ .env.example
└─ package.json
```

## Ortam Değişkenleri

| Değişken | Varsayılan | Açıklama |
|-----|---------|-------------|
| `NODE_ENV` | `development` | `development` / `test` / `production` |
| `PORT` | `3000` | HTTP portu |
| `MONGODB_URI` | _(zorunlu)_ | MongoDB 6.0+ bağlantı dizesi |
| `JWT_SECRET` | _(zorunlu, en az 8 karakter)_ | `AUTH_MODE=jwt` iken imza doğrulamada kullanılır; ortam doğrulaması için her modda tanımlı olmalıdır |
| `AUTH_MODE` | `bypass` | `bypass` (demo) veya `jwt` (gerçek; imzalı JWT, `{ userId, role }` payload) |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Express rate-limit penceresi |
| `RATE_LIMIT_MAX` | `300` | Pencere başına IP başına azami istek |
| `BASE_URL` | `http://localhost:3000` | `scripts/simulateDrive.js` tarafından kullanılır |
| `DEVICE_ID` | _(opsiyonel)_ | `/devices` boşsa simülatör yedeği |

## Komutlar

| Komut | Amaç |
|---------|---------|
| `npm run dev` | `src/server.js` üzerinde nodemon |
| `npm start` | Üretim tarzı başlatma |
| `npm test` | Jest (birim + supertest API) |
| `npm run lint` | Tüm depo üzerinde ESLint |
| `npm run format` | Prettier ile yazma |
| `npm run seed` | Yönetici + sürücü + cihaz + eşik tohumlama |
| `npm run simulate` | 60 saniyelik yapay sürüşün `/api/v1/sensor-data` ucuna POST'lanması |

## Kurulum

1. MongoDB 6.0+ yerel olarak kurun **veya** ücretsiz bir Atlas kümesi kullanın.
2. `cp .env.example .env` yapın ve `MONGODB_URI` değerini düzenleyin.
3. `npm install`
4. `npm run seed` (tek seferlik)
5. `npm run dev`
6. (İsteğe bağlı) Alarm üretmek için `npm run simulate`.

## Demo Akışı

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run seed
npm run simulate     # 3000 okuma, 6 gömülü anomali

# Ardından:
curl http://localhost:3000/api/v1/alarms
curl http://localhost:3000/api/v1/reports/device/<deviceId>/daily
# Swagger UI'yı açın:
# http://localhost:3000/docs
```

## Varsayılan Eşik Değerleri

Varsayılanlar `src/config/thresholds.js` dosyasındadır; `PUT /api/v1/devices/:id/thresholds` (yalnızca admin) ile cihaz bazında geçersiz kılınabilir.

| Anahtar | Varsayılan | Birim | Gerekçe |
|-----|---------|------|-----------|
| `suddenBrakeAccelMs2` | `-3.5` | m/s² | ≈ 0.36 g, Geotab/Verizon 0.265–0.6 g sert fren bandının ortası |
| `suddenAccelerationMs2` | `3.0` | m/s² | ≈ 0.31 g, 0.22–0.35 g sert hızlanma bandı içinde |
| `sharpTurnYawRadS` | `1.4` | rad/s | ≈ 80°/s yaw oranı, akıllı telefon jiroskobu |
| `sharpTurnLateralMs2` | `4.0` | m/s² | Yaw güvenilir değilse yedek olarak ≈ 0.4 g yanal ivme |
| `minTurnSpeedMs` | `4` | m/s | Park yeri yanlış pozitiflerini bastırır |
| `joltMagnitudeDeltaMs2` | `6.0` | m/s² | `|‖a‖ − g|` tek örnek sıçraması (çukur / sert tümsek) |
| `joltWindowStdMs2` | `2.5` | m/s² | 1 saniyelik kayan pencere standart sapma yedeği |
| `eventCooldownMs` | `2000` | ms | `(deviceId,type)` başına debounce |
| `slidingWindowSec` | `3` | s | Dedektör geriye bakış penceresi |
| `requiredSamplesAboveThreshold` | `10` | örnek | 50 Hz'de 200 ms, gürültüye karşı debounce |
| `sampleRateHz` | `50` | Hz | Standart akıllı telefon örnekleme tabanı |

## Gizlilik ve Veri Saklama

Proje gereksinimlerine (`nodejsProjeGereksinimler.md` §8) uygun olarak servis **veri minimizasyonu** ilkesi üzerine kurgulanmıştır.

**Hiçbir zaman toplanmayan veya kalıcılaştırılmayan alanlar:**
- Mikrofon / ham ses
- Manyetometre
- Işık / yakınlık sensörü
- Pil seviyesi (okuma başına)
- Ön plandaki uygulama listesi
- GPS yön (heading), irtifa, uydu sayısı

**Toplanan alanlar (amaca bağlı):**
- Doğrusal ivme `accel{x,y,z}` (sürüş dinamiği)
- Jiroskop `gyro{x,y,z}` (rotasyon / yaw)
- GPS `lat / lng / speed / accuracy` — ivme/jirodan çok daha düşük olarak ~1 Hz'de örneklenir

**Saklama süresi:**
- **Ham sensör okumaları** (`sensor_readings`): MongoDB time-series üzerinden `expireAfterSeconds = 2.592.000` ile **30 gün**. Süre sonunda bucket sunucu tarafından otomatik silinir.
- **Alarmlar** (`alarms`): Süresiz saklanır (operasyonel + denetim değeri, düşük hacimli).
- **Eşik geçmişi:** Yalnızca güncel override saklanır; önceki değerler tek tek alarm anlık görüntülerinde (`alarms.threshold`) yaşar.

**Dağıtım ve altyapı** (TLS, yedekleme/geri yükleme, erişim logları, DSAR süreçleri) bu modülün kapsamı dışındadır. Gizlilik kontrollerini kod ve veritabanı seçenekleriyle (veri minimizasyonu, 30 gün TTL) sağlıyorum.

**Kullanıcı onayı:** İstemci tarafında ilk açılışta açık ve bilgilendirilmiş kullanıcı onayı alınmalı; saklama süresi görünür kılınmalı ve yukarıdaki kategorileri listeleyen gizlilik politikasına bağlantı verilmelidir.

## Entegrasyon

Tam sözleşme için bkz. [`docs/integration.md`](docs/integration.md).

- **Sensör ingest:** `POST /api/v1/sensor-data` — okuma batch'leri (saniyede bir pencere, ~50 örnek).
- **Modülü mount etme:** `models/`, `services/`, `routes/` drop-in modüllerdir. Entegrasyon sırasında değiştirilmesi gereken tek nokta `requireAuth` middleware'idir; kendi JWT doğrulayıcınızla aynı `(req, res, next)` imzasını koruyun.
- **İzleme ve raporlama:** `GET /alarms`, `GET /sensor-data`, `GET /reports/*` ve `/realtime` namespace'inde `device:{deviceId}` odasında yayınlanan Socket.IO `alarm:new` olayları.

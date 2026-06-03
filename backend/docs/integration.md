# Entegrasyon Sözleşmesi — Veritabanı ve Anomali Tespiti Modülü

Bu doküman, bu modülü kendi uygulamanıza entegre ederken servise nasıl bağlanacağınızı ve modülün sunduğu uçları açıklar.

## Genel Bakış

```
İstemci       ──HTTP POST batch──▶  bu modül   ──Socket.IO──▶  izleme paneli
                                    ▲
                                    │ models / services / routes
Ana backend   ──drop-in modül───────┘
```

## Kimlik Doğrulama (Auth)

Tüm `/api/v1/*` rotaları `requireAuth` ile korunur:

- `AUTH_MODE=bypass` — demo ve yerel geliştirme için. `req.user = { _id: '000000000000000000000001', role: 'admin' }`.
- `AUTH_MODE=jwt` — `Authorization: Bearer <jwt>` bekler ve `JWT_SECRET` ile imzayı doğrular. Payload sözleşmesi `{ userId, role }` biçimindedir. Aynı `JWT_SECRET` değerini kullanabilir veya `src/middleware/requireAuth.js` dosyasını kendi doğrulayıcınızla (`jsonwebtoken`, JWKS vb.) değiştirebilirsiniz; rota tablosu birebir aynı kalır.

`authorize(...roles)` rol kontrolü gereken rotalara zincirlenir (örn. `PUT /devices/:id/thresholds` → `admin`).

## Sensör Ingest Ucu

`POST /api/v1/sensor-data`

```json
{
  "deviceId": "65f3e7c2…",
  "tripId": "65f3e7c2…",
  "readings": [
    {
      "ts": "2026-05-28T10:00:00.000Z",
      "accel": { "x": 0.05, "y": -1.2, "z": 9.78 },
      "gyro":  { "x": 0.01, "y": 0.02, "z": 0.05 },
      "gps":   { "lat": 40.2306, "lng": 29.0094, "speed": 12.4, "accuracy": 5 },
      "speed": 12.4
    }
  ]
}
```

Kısıtlar / beklentiler:

- `accel` **m/s²** birimindedir — yer çekimi çıkarılmış payload beklenir. `lowPassGravity` yardımcı fonksiyonu test ve ilerideki adaptasyonlar için hazırdır; mevcut ingest pipeline'ı otomatik yer çekimi ayrıştırması yapmaz.
- `gyro` **rad/s** birimindedir.
- `gps` okuma başına **opsiyoneldir** (istemci ivme/jiro 50 Hz iken GPS'i ~1 Hz'de gönderebilir). Eksikse sert dönüş yedeği hız kapısı yerine yanal ivmeyi kullanır.
- `ts` ISO-8601 olmalıdır (UTC önerilir).
- Saniyede 50 okumaya kadar batch boyutu beklenen normal akıştır.
- `tripId` opsiyoneldir. Eksikse bu servis cihaz için aktif bir trip otomatik açar (veya mevcut olanı yeniden kullanır).

Başarılı yanıt:

```json
{
  "data": {
    "inserted": 50,
    "alarms": [
      {
        "_id": "65f3e7d1…",
        "type": "sudden_brake",
        "severity": "medium",
        "value": -4.5,
        "threshold": -3.5,
        "unit": "m/s2",
        "windowStart": "2026-05-28T10:00:00.000Z",
        "windowEnd":   "2026-05-28T10:00:00.580Z",
        "gps": { "lat": 40.23, "lng": 29.01 },
        "tripId": "65f3e7c2…",
        "deviceId": "65f3e7c2…",
        "createdAt": "2026-05-28T10:00:00.612Z"
      }
    ]
  }
}
```

## Modülü Entegre Etme (Drop-in)

Ana Express uygulamanıza bu modülü entegre etmek için iki yöntem vardır:

**Yöntem 1 — Tüm uygulamayı mount etmek:**

```js
const createBackendApp = require('backend/src/app');
app.use('/db', createBackendApp(io));
```

**Yöntem 2 — Seçilen rotaları mount etmek:**

```js
app.use('/api/v1/sensor-data', require('backend/src/routes/sensorRoutes'));
app.use('/api/v1/alarms',      require('backend/src/routes/alarmRoutes'));
// ...
```

İki yöntem de aynı modelleri paylaşır. Yalnızca `requireAuth` kendi JWT doğrulayıcınızla değiştirilmelidir (aynı imza: `(req, res, next)`, `req.user = { _id, role }`).

## İzleme Paneli Beslemeleri

### REST

| Uç nokta | Kullanım |
|----------|----------|
| `GET /api/v1/alarms?deviceId=…&type=…&from=…&to=…` | Alarm listesi tablosu |
| `GET /api/v1/alarms/:id` | Detay görünümü |
| `GET /api/v1/sensor-data?deviceId=…&from=…&to=…&limit=…` | Güzergâh / zaman serisi grafikleri |
| `GET /api/v1/trips?deviceId=…&status=ended` | Trip geçmişi |
| `GET /api/v1/trips/:id` | Trip detay sayfası |
| `GET /api/v1/reports/trip/:id` | Trip skor / özet kartı |
| `GET /api/v1/reports/device/:id/daily?from=…&to=…` | Isı haritası takvimi |

### Socket.IO

Namespace: `/realtime` (varsayılan URI `ws://<host>/realtime`).

İstemci akışı:

```js
const socket = io('/realtime');
socket.emit('join-device', deviceId);     // ilgili cihaz odasına katıl

socket.on('alarm:new', (alarm) => {
  // alarm, REST yanıtındaki Alarm varlığı ile aynı biçimdedir
});
```

`alarm:new` olay yükü:

```json
{
  "_id": "65f3e7d1…",
  "deviceId": "65f3e7c2…",
  "tripId": "65f3e7c2…",
  "type": "sudden_brake",
  "severity": "medium",
  "value": -4.5,
  "threshold": -3.5,
  "unit": "m/s2",
  "windowStart": "2026-05-28T10:00:00.000Z",
  "windowEnd":   "2026-05-28T10:00:00.580Z",
  "gps": { "lat": 40.23, "lng": 29.01 },
  "createdAt": "2026-05-28T10:00:00.612Z"
}
```

## Hata Zarfı

2xx olmayan her yanıt şu yapıya sahiptir:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": ["readings is required"]
  }
}
```

| Durum | `code` örnekleri |
|--------|-----------------|
| 400 | `BAD_ID` |
| 401 | `UNAUTHORIZED` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT` (tekrarlı anahtar) |
| 422 | `VALIDATION_ERROR` |
| 429 | `TOO_MANY_REQUESTS` (rate-limit) |
| 500 | `INTERNAL_ERROR` |

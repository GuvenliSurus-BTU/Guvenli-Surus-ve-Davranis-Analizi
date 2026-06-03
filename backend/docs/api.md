# API Referansı

`/healthz`, `/readyz`, `/docs` haricinde tüm uç noktalar `/api/v1` ön ekiyle başlar.

- **İçerik tipi:** `application/json`
- **Başarı zarfı:** `{ "data": ... }` (liste yanıtları `"meta"` de içerir).
- **Hata zarfı:** `{ "error": { "code", "message", "details?" } }`.
- **Auth:** `AUTH_MODE=jwt` iken `Authorization: Bearer <jwt>` ve `JWT_SECRET` ile imza doğrulaması. Geliştirme modunda `AUTH_MODE=bypass` ile atlanır.

## Sistem

### `GET /healthz`

| | |
|--|--|
| Auth | yok |
| Yanıt 200 | `{ "data": { "status": "ok", "ts": "2026-05-28T10:00:00.000Z" } }` |

### `GET /readyz`

`/healthz` ile aynı davranıştadır.

## Cihazlar (Devices)

### `POST /api/v1/devices`

| | |
|--|--|
| Auth | gerekli |
| Gövde | `{ "label": "Pixel 6", "platform": "android", "model": "Pixel", "appVersion": "1.0.0" }` |
| 201 | `{ "data": { "_id", "userId", "label", "platform", ... } }` |
| 422 | doğrulama hatası |

### `GET /api/v1/devices`

Çağıran kullanıcının cihazlarını döner. Yöneticiler (admin) tümünü görür.

```json
{ "data": [ { "_id": "…", "label": "Pixel 6", ... } ] }
```

## Tripler

### `POST /api/v1/trips/start`

Gövde: `{ "deviceId": "…" }`. Idempotenttir: Aktif bir trip varsa o döner.

```json
{ "data": { "_id": "…", "status": "active", "startedAt": "…" } }
```

### `POST /api/v1/trips/:id/end`

Gövde yok. Trip'i kapatır ve `summary` alanını materyalize eder.

```json
{ "data": { "_id": "…", "status": "ended", "endedAt": "…", "summary": { "totalAlarms": 3, "alarmByType": { "sudden_brake": 2, "sharp_turn": 1 } } } }
```

### `GET /api/v1/trips?deviceId=&status=&limit=`

```json
{ "data": [ { "_id": "…", "deviceId": "…", "status": "ended" } ] }
```

### `GET /api/v1/trips/:id`

Tek trip; bulunamazsa 404 → `NOT_FOUND`.

## Sensör

### `POST /api/v1/sensor-data`

Gövde:

```json
{
  "deviceId": "65f3e7c2…",
  "tripId":  "65f3e7c2…",
  "readings": [
    {
      "ts": "2026-05-28T10:00:00.000Z",
      "accel": { "x": 0.05, "y": -4.2, "z": 9.78 },
      "gyro":  { "x": 0.01, "y": 0.02, "z": 0.05 },
      "gps":   { "lat": 40.23, "lng": 29.01, "speed": 12.4, "accuracy": 5 }
    }
  ]
}
```

Durum kodları: Başarılıda `201`, doğrulama hatasında `422`, yetki sorununda `401`/`403`.

Yanıt:

```json
{
  "data": {
    "inserted": 50,
    "alarms": [
      {
        "_id": "…",
        "type": "sudden_brake",
        "severity": "medium",
        "value": -4.5,
        "threshold": -3.5,
        "unit": "m/s2",
        "windowStart": "…",
        "windowEnd": "…",
        "gps": { "lat": 40.23, "lng": 29.01 }
      }
    ]
  }
}
```

### `GET /api/v1/sensor-data?deviceId=&from=&to=&limit=`

Bir cihaz için en yeni okumaları (azalan `ts`) döner; `limit` ile sınırlanır (varsayılan 100).

```json
{ "data": [ { "ts": "…", "accel": { "x":0, "y":0, "z":9.8 }, "gyro": { … }, "gps": { … } } ] }
```

## Alarmlar

### `GET /api/v1/alarms?deviceId=&tripId=&type=&severity=&from=&to=&page=&limit=`

```json
{
  "data": [ { "_id": "…", "type": "sharp_turn", "severity": "low", ... } ],
  "meta": { "total": 12, "page": 1, "limit": 20 }
}
```

### `GET /api/v1/alarms/:id`

`200` → tek alarm; `404` → `NOT_FOUND`.

## Eşikler (Thresholds)

### `GET /api/v1/devices/:id/thresholds`

```json
{ "data": { "deviceId": "…", "overrides": { "suddenBrakeAccelMs2": -3.0 }, "updatedBy": "…", "updatedAt": "…" } }
```

Override yoksa `null` döner.

### `PUT /api/v1/devices/:id/thresholds`

**Yalnızca admin.** Gövde:

```json
{ "overrides": { "suddenBrakeAccelMs2": -3.0, "sharpTurnYawRadS": 1.2 } }
```

Yanıt, upsert edilmiş dokümandır. Admin değilse `403`.

## Raporlar

### `GET /api/v1/reports/trip/:id`

```json
{
  "data": {
    "trip":         { "_id": "…", "status": "ended", ... },
    "totalAlarms":  4,
    "alarmsByType": { "sudden_brake": 2, "sharp_turn": 2 },
    "mostSevere":   { "_id": "…", "type": "sudden_brake", "severity": "high", "value": -7.4 }
  }
}
```

### `GET /api/v1/reports/device/:id/daily?from=&to=`

```json
{
  "data": [
    {
      "date": "2026-05-27",
      "total": 6,
      "byType": [
        { "type": "sudden_brake", "count": 3, "avgValue": -4.8, "maxValue": -6.1 },
        { "type": "sharp_turn",   "count": 3, "avgValue":  1.9, "maxValue":  2.4 }
      ]
    }
  ]
}
```

## Hata Kodları

| Durum | `code` | Ne zaman |
|--------|--------|------|
| 400 | `BAD_ID` | Mongoose `CastError` (geçersiz ObjectId) |
| 401 | `UNAUTHORIZED` | `jwt` modunda eksik / geçersiz bearer |
| 403 | `FORBIDDEN` | `authorize()` rol uyuşmazlığı |
| 404 | `NOT_FOUND` | Eksik varlık |
| 409 | `CONFLICT` | Tekrarlı anahtar (`E11000`) |
| 422 | `VALIDATION_ERROR` | Joi veya Mongoose doğrulama hatası |
| 429 | rate-limit | `express-rate-limit` |
| 500 | `INTERNAL_ERROR` | Yakalanmamış hata (üretimde stack gizlenir) |

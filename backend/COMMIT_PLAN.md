# COMMIT_PLAN — backend

9 aşamalı atomik commit yol haritası. Her commit; depoyu çalışır bir durumda bırakan **tek bir mantıksal değişikliği** taşır. Commit'ler atomiktir, Conventional Commits ile uyumludur ve yalnızca kendi madde başlığında listelenen dosyaları içerir.

## Kurallar

- **Yalnızca kullanıcı açıkça talep ettiğinde commit at** ("commit at" / "sıradaki commit'i at"). Geliştirme sırasında asla otomatik commit atma.
- **Mantıksal değişiklik başına tek commit.** Kapsam karıştırma yok (örn. aynı commit içinde `feat(db)` + `chore(tooling)` olmaz).
- **Subject 72 karakteri aşmaz.** Biçim: `type(scope): subject`. Opsiyonel gövde _neden_ kısmını açıklar.
- **Ara durumlar bozuk olmaz.** Her commit'ten önce lint + testler geçmiş olmalıdır.
- Her commit'ten sonra bu dosyadaki kutuyu `- [x]` olarak işaretle.

## Aşama 1 — Proje Temeli (3 commit)

- [ ] `chore: initialize node.js project (package.json, gitignore, editorconfig)`
  - `package.json`
  - `.gitignore`
  - `.editorconfig`
  - `.prettierrc`
  - `.env.example`
- [ ] `chore(config): add env validation, db connection, default thresholds`
  - `src/config/env.js`
  - `src/config/db.js`
  - `src/config/thresholds.js`
- [ ] `feat(server): bootstrap express app with logger, helmet, cors, error handler`
  - `src/app.js`
  - `src/server.js`
  - `src/utils/logger.js`
  - `src/middleware/errorHandler.js`
  - `src/middleware/requestLogger.js`

## Aşama 2 — Veritabanı Modelleri (4 commit)

- [ ] `feat(db): add user, device, trip models (3NF)`
  - `src/models/User.js`
  - `src/models/Device.js`
  - `src/models/Trip.js`
- [ ] `feat(db): add sensor reading time-series collection`
  - `src/models/SensorReading.js`
- [ ] `feat(db): add alarm, threshold-config, analysis-run models`
  - `src/models/Alarm.js`
  - `src/models/ThresholdConfig.js`
  - `src/models/AnalysisRun.js`
- [ ] `feat(db): add secondary indexes and TTL retention for privacy`
  - `src/models/Alarm.js` (bileşik indeks)
  - `src/models/Trip.js` (bileşik indeks)
  - `src/models/Device.js` (lastSeenAt indeksi)
  - `src/models/SensorReading.js` (expireAfterSeconds time-series seçeneği)

## Aşama 3 — Doğrulama ve Yetkilendirme (2 commit)

- [ ] `feat(validation): add joi schemas and validate middleware`
  - `src/validators/sensorSchema.js`
  - `src/validators/deviceSchema.js`
  - `src/validators/tripSchema.js`
  - `src/validators/thresholdSchema.js`
  - `src/middleware/validate.js`
- [ ] `feat(auth): add requireAuth placeholder and role-based authorize`
  - `src/middleware/requireAuth.js`

## Aşama 4 — Anomali Tespit Çekirdeği (6 commit)

- [ ] `feat(anomaly): add sliding window, welford stats, magnitude, low-pass utils`
  - `src/services/anomalyDetection/utils.js`
- [ ] `feat(anomaly): add sudden brake detector`
  - `src/services/anomalyDetection/suddenBrake.js`
- [ ] `feat(anomaly): add sudden acceleration detector`
  - `src/services/anomalyDetection/suddenAcceleration.js`
- [ ] `feat(anomaly): add sharp turn detector`
  - `src/services/anomalyDetection/sharpTurn.js`
- [ ] `feat(anomaly): add excessive jolt detector`
  - `src/services/anomalyDetection/excessiveJolt.js`
- [ ] `feat(anomaly): add orchestrator with cooldown and threshold override`
  - `src/services/anomalyDetection/index.js`

## Aşama 5 — Servis Katmanı (2 commit)

- [ ] `feat(services): add device, trip, threshold services`
  - `src/services/deviceService.js`
  - `src/services/tripService.js`
  - `src/services/thresholdService.js`
- [ ] `feat(services): add sensor and alarm services`
  - `src/services/sensorService.js`
  - `src/services/alarmService.js`

## Aşama 6 — REST API (5 commit)

- [ ] `feat(api): add sensor-data endpoints`
  - `src/controllers/sensorController.js`
  - `src/routes/sensorRoutes.js`
  - `src/app.js` (mount)
- [ ] `feat(api): add alarm endpoints with stats`
  - `src/controllers/alarmController.js`
  - `src/routes/alarmRoutes.js`
  - `src/app.js` (mount)
- [ ] `feat(api): add trip endpoints`
  - `src/controllers/tripController.js`
  - `src/routes/tripRoutes.js`
  - `src/app.js` (mount)
- [ ] `feat(api): add device and threshold endpoints`
  - `src/controllers/deviceController.js`
  - `src/controllers/thresholdController.js`
  - `src/routes/deviceRoutes.js`
  - `src/routes/thresholdRoutes.js`
  - `src/app.js` (mount)
- [ ] `feat(api): add health and reports endpoints`
  - `src/controllers/healthController.js`
  - `src/controllers/reportController.js`
  - `src/routes/healthRoutes.js`
  - `src/routes/reportRoutes.js`
  - `src/services/reportService.js`
  - `src/app.js` (mount)

## Aşama 7 — Gerçek Zamanlı Akış (1 commit)

- [ ] `feat(realtime): add socket.io alarm broadcast`
  - `src/realtime/socket.js`
  - `src/server.js` (Socket.IO bootstrap)
  - `src/app.js` (req.io middleware)
  - `src/controllers/sensorController.js` (alarm:new yayını)

## Aşama 8 — Testler (2 commit)

- [ ] `test(anomaly): add unit tests for detectors and utils`
  - `tests/unit/anomaly.test.js`
  - `tests/unit/utils.test.js`
- [ ] `test(api): add supertest integration tests`
  - `tests/api/sensor.api.test.js`
  - `jest.config.cjs`

## Aşama 9 — Araçlar ve Dokümantasyon (8 commit)

- [ ] `chore(tooling): add eslint, prettier, husky, commitlint`
  - `eslint.config.cjs`
  - `.prettierrc`
  - `.husky/pre-commit`
  - `.husky/commit-msg`
  - `commitlint.config.cjs`
  - `package.json` (devDeps, lint-staged, scripts)
- [ ] `feat(docs): add swagger ui and openapi spec`
  - `src/config/swagger.js`
  - `src/app.js` (`/docs` mount)
  - Rota dosyalarında satır içi `@openapi` JSDoc blokları
- [ ] `docs: add data-model and anomaly-logic`
  - `docs/data-model.md`
  - `docs/anomaly-logic.md`
- [ ] `docs: add api and integration docs`
  - `docs/api.md`
  - `docs/integration.md`
- [ ] `docs: add postman collection`
  - `docs/postman_collection.json`
  - `docs/postman_environment.json`
- [ ] `chore(scripts): add seed script`
  - `scripts/seed.js`
- [ ] `chore(scripts): add drive simulator`
  - `scripts/simulateDrive.js`
- [ ] `docs: finalize readme with setup, privacy, demo flow`
  - `README.md`

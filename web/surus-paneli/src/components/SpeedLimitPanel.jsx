import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api/v1';
const HEADERS = { Authorization: 'Bearer dummy_token' };

// ── birim yardımcıları ──────────────────────────────────────────
const toMs = (val, unit) => unit === 'kmh' ? val / 3.6 : val;
const fromMs = (val, unit) => unit === 'kmh' ? +(val * 3.6).toFixed(2) : +val.toFixed(4);

const DEFAULT_LIMITS = { kmh: 90, ms: 25 };

const SpeedLimitPanel = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [unit, setUnit] = useState('kmh');          // 'kmh' | 'ms'
  const [inputValue, setInputValue] = useState(DEFAULT_LIMITS.kmh);
  const [currentMs, setCurrentMs] = useState(null); // m/s olarak DB'den gelen
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);       // { type: 'success'|'error', msg }
  const [loading, setLoading] = useState(false);

  // Cihazları çek
  useEffect(() => {
    axios.get(`${API}/devices`, { headers: HEADERS })
      .then(r => {
        const list = r.data.data || [];
        setDevices(list);
        if (list.length > 0) setSelectedDevice(list[0]._id);
      })
      .catch(() => setStatus({ type: 'error', msg: 'Cihazlar yüklenemedi.' }));
  }, []);

  // Cihaz seçilince mevcut eşiği çek
  useEffect(() => {
    if (!selectedDevice) return;
    setLoading(true);
    setStatus(null);
    axios.get(`${API}/devices/${selectedDevice}/thresholds`, { headers: HEADERS })
      .then(r => {
        const ms = r.data?.data?.overrides?.speedLimitMs ?? null;
        setCurrentMs(ms);
        if (ms !== null) {
          setInputValue(fromMs(ms, unit));
        } else {
          setInputValue(DEFAULT_LIMITS[unit]);
        }
      })
      .catch(() => {
        setCurrentMs(null);
        setInputValue(DEFAULT_LIMITS[unit]);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDevice]);

  // Birim değişince girişi dönüştür
  const handleUnitChange = (newUnit) => {
    if (newUnit === unit) return;
    const ms = toMs(inputValue, unit);
    setUnit(newUnit);
    setInputValue(fromMs(ms, newUnit));
  };

  const handleSave = async () => {
    if (!selectedDevice) return;
    setSaving(true);
    setStatus(null);
    const ms = toMs(Number(inputValue), unit);
    try {
      await axios.put(
        `${API}/devices/${selectedDevice}/thresholds`,
        { overrides: { speedLimitMs: ms } },
        { headers: { ...HEADERS, 'Content-Type': 'application/json' } }
      );
      setCurrentMs(ms);
      setStatus({ type: 'success', msg: `Hız sınırı ${inputValue} ${unit === 'kmh' ? 'km/h' : 'm/s'} olarak kaydedildi.` });
    } catch {
      setStatus({ type: 'error', msg: 'Kaydetme başarısız. Backend bağlantısını kontrol edin.' });
    } finally {
      setSaving(false);
    }
  };

  const selectedDeviceLabel = devices.find(d => d._id === selectedDevice)?.label || selectedDevice;
  const displayCurrent = currentMs !== null ? fromMs(currentMs, unit) : null;
  const unitLabel = unit === 'kmh' ? 'km/h' : 'm/s';

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>🚦 Hız Sınırı Yönetimi</h1>
          <p className="subtitle">Cihaz bazlı hız sınırı ayarı ve birim seçimi</p>
        </div>
      </div>

      {/* ── Cihaz + Birim Seçimi ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><h3>Ayarlar</h3></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Cihaz */}
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                📱 Cihaz Seç
              </label>
              <select
                value={selectedDevice}
                onChange={e => setSelectedDevice(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px',
                  background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                  fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none',
                }}
              >
                {devices.length === 0
                  ? <option value="">Cihaz bulunamadı</option>
                  : devices.map(d => (
                    <option key={d._id} value={d._id}>
                      {d.label || d._id} ({d.platform || '?'})
                    </option>
                  ))}
              </select>
            </div>

            {/* Birim */}
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                📐 Hız Birimi
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['kmh', 'ms'].map(u => (
                  <button
                    key={u}
                    onClick={() => handleUnitChange(u)}
                    style={{
                      flex: 1, padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      border: unit === u ? '2px solid var(--steel-blue)' : '1px solid var(--border-glass)',
                      background: unit === u ? 'rgba(122,155,173,0.18)' : 'var(--bg-glass)',
                      color: unit === u ? 'var(--steel-blue)' : 'var(--text-secondary)',
                      fontWeight: unit === u ? 700 : 500,
                      cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.95rem',
                      transition: 'var(--transition)',
                    }}
                  >
                    {u === 'kmh' ? 'km/h' : 'm/s'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hız Sınırı Girişi ── */}
      <div className="card">
        <div className="card-header">
          <h3>⚙️ Hız Sınırı Belirle — <span style={{ color: 'var(--steel-blue)' }}>{selectedDeviceLabel}</span></h3>
          {displayCurrent !== null && (
            <span style={{
              background: 'rgba(122,155,173,0.15)', color: 'var(--steel-blue)',
              padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
            }}>
              Mevcut: {displayCurrent} {unitLabel}
            </span>
          )}
        </div>
        <div className="card-body">
          {loading ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>Yükleniyor...</p>
          ) : (
            <>
              {/* Slider + Giriş */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <label style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Maksimum İzin Verilen Hız
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      value={inputValue}
                      min={unit === 'kmh' ? 10 : 2.8}
                      max={unit === 'kmh' ? 300 : 83.3}
                      step={unit === 'kmh' ? 5 : 0.5}
                      onChange={e => setInputValue(Number(e.target.value))}
                      style={{
                        width: 90, padding: '8px 12px', textAlign: 'center',
                        background: 'var(--bg-glass)', border: '2px solid var(--steel-blue)',
                        borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                        fontFamily: 'inherit', fontSize: '1.1rem', fontWeight: 700, outline: 'none',
                      }}
                    />
                    <span style={{ fontWeight: 600, color: 'var(--steel-blue)' }}>{unitLabel}</span>
                  </div>
                </div>

                <input
                  type="range"
                  value={inputValue}
                  min={unit === 'kmh' ? 10 : 2.8}
                  max={unit === 'kmh' ? 200 : 55.6}
                  step={unit === 'kmh' ? 5 : 0.5}
                  onChange={e => setInputValue(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--steel-blue)', height: 6, cursor: 'pointer' }}
                />

                {/* Referans hız değerleri */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {unit === 'kmh'
                    ? ['10 km/h', '30 km/h', '50 km/h', '90 km/h', '120 km/h', '200 km/h']
                    : ['2.8', '8.3', '13.9', '25', '33.3', '55.6'].map(v => `${v} m/s`)}
                </div>
              </div>

              {/* Hız önayarları */}
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12 }}>
                  Hızlı Önayarlar
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(unit === 'kmh'
                    ? [{ label: '🏘️ Şehir içi', val: 50 }, { label: '🛣️ Anayol', val: 90 }, { label: '🛤️ Otoyol', val: 120 }, { label: '🏎️ Ekspres', val: 160 }]
                    : [{ label: '🏘️ Şehir içi', val: 13.9 }, { label: '🛣️ Anayol', val: 25 }, { label: '🛤️ Otoyol', val: 33.3 }, { label: '🏎️ Ekspres', val: 44.4 }]
                  ).map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => setInputValue(preset.val)}
                      style={{
                        padding: '8px 16px', borderRadius: 20,
                        border: '1px solid var(--border-glass)',
                        background: Math.abs(inputValue - preset.val) < 0.1 ? 'rgba(122,155,173,0.25)' : 'var(--bg-glass)',
                        color: Math.abs(inputValue - preset.val) < 0.1 ? 'var(--steel-blue)' : 'var(--text-secondary)',
                        fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem',
                        transition: 'var(--transition)',
                      }}
                    >
                      {preset.label} — {preset.val} {unitLabel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Durum mesajı */}
              {status && (
                <div style={{
                  padding: '12px 18px', borderRadius: 'var(--radius-sm)', marginBottom: 20,
                  background: status.type === 'success' ? 'rgba(122,158,138,0.15)' : 'rgba(176,96,96,0.15)',
                  border: `1px solid ${status.type === 'success' ? 'rgba(122,158,138,0.4)' : 'rgba(176,96,96,0.4)'}`,
                  color: status.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)',
                  fontWeight: 500, fontSize: '0.9rem',
                }}>
                  {status.type === 'success' ? '✅' : '❌'} {status.msg}
                </div>
              )}

              {/* Kaydet butonu */}
              <button
                onClick={handleSave}
                disabled={saving || !selectedDevice}
                style={{
                  padding: '14px 32px', borderRadius: 'var(--radius-sm)',
                  background: saving ? 'var(--taupe)' : 'linear-gradient(135deg, var(--steel-blue), var(--brown))',
                  color: '#F8F4F0', border: 'none', fontFamily: 'inherit',
                  fontSize: '1rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'var(--transition)', minWidth: 180,
                }}
              >
                {saving ? '⏳ Kaydediliyor...' : '💾 Kaydet'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Bilgi Kartı ── */}
      <div className="card" style={{ marginTop: 24, borderLeft: '4px solid var(--powder-blue)' }}>
        <div className="card-body">
          <h3 style={{ marginBottom: 12, color: 'var(--steel-blue)', fontSize: '0.95rem' }}>ℹ️ Nasıl Çalışır?</h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              'Hız sınırı değeri seçilen cihazın eşik konfigürasyonuna kaydedilir.',
              'Mobil uygulama bu sınırı aşarsa backend otomatik alarm üretir.',
              'Birim seçimi yalnızca görsel amaçlıdır; değer her zaman m/s olarak saklanır.',
              'Varsayılan değer 25 m/s (90 km/h)\'dir.',
            ].map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--steel-blue)', fontWeight: 700 }}>→</span> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SpeedLimitPanel;

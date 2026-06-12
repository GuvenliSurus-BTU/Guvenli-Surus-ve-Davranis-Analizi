import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Line } from 'react-chartjs-2';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default Leaflet marker icon in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

const socket = io('http://localhost:5000/realtime');

// Haritayı otomatik olarak yeni konuma kaydıran yardımcı bileşen
function RecenterAutomatically({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

const Dashboard = () => {
    const [sensorData, setSensorData] = useState([]);
    const [accelData, setAccelData] = useState([]);
    const [labels, setLabels] = useState([]);

    // Anlık değerler için state
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [currentAccel, setCurrentAccel] = useState(0);
    const [currentLocation, setCurrentLocation] = useState([39.92077, 32.85411]); // Default: Ankara
    const [activeDeviceCount, setActiveDeviceCount] = useState(0);

    useEffect(() => {
        // 1. Önce geçmiş verileri çek
        fetch('http://localhost:5000/api/v1/sensor-data?limit=720', {
            headers: { 'Authorization': 'Bearer dummy_token' }
        })
        .then(res => res.json())
        .then(response => {
            if (response.data && response.data.length > 0) {
                const history = response.data.reverse();
                
                const initialLabels = history.map(item => new Date(item.ts).toLocaleTimeString([], { hour12: false }));
                const initialHiz = history.map(item => (item.gps && item.gps.speed) ? item.gps.speed : 0);
                const initialIvme = history.map(item => item.accel ? item.accel.y : 0);
                
                setLabels(initialLabels);
                setSensorData(initialHiz);
                setAccelData(initialIvme);

                // Son değerleri gauge için ayarla
                const lastItem = history[history.length - 1];
                setCurrentSpeed(initialHiz[initialHiz.length - 1]);
                setCurrentAccel(initialIvme[initialIvme.length - 1]);

                if (lastItem.gps && lastItem.gps.lat && lastItem.gps.lng) {
                    setCurrentLocation([lastItem.gps.lat, lastItem.gps.lng]);
                }
            }
        })
        .catch(err => console.error("Geçmiş veri çekilemedi:", err));

        // Cihaz sayısını çek
        fetch('http://localhost:5000/api/v1/devices', {
            headers: { 'Authorization': 'Bearer dummy_token' }
        })
        .then(res => res.json())
        .then(response => setActiveDeviceCount(response.data ? response.data.length : 0))
        .catch(err => console.error("Cihaz verisi çekilemedi:", err));

        // 2. Canlı verileri dinle (Toplu Gönderim)
        socket.on('yeni-sensor-verisi-toplu', (dataArray) => {
            if (!dataArray || dataArray.length === 0) return;

            setLabels((prev) => {
                const newLabels = dataArray.map(d => new Date(d.ts).toLocaleTimeString([], { hour12: false }));
                return [...prev, ...newLabels].slice(-720);
            });
            setSensorData((prev) => {
                const newHiz = dataArray.map(d => d.hiz);
                return [...prev, ...newHiz].slice(-720);
            });
            setAccelData((prev) => {
                const newIvme = dataArray.map(d => d.ivmeY);
                return [...prev, ...newIvme].slice(-720);
            });

            // Göstergeler (Gauges) ve harita için en son veriyi kullan
            const lastData = dataArray[dataArray.length - 1];
            setCurrentSpeed(lastData.hiz);
            setCurrentAccel(lastData.ivmeY);

            // Gelen veriler arasında konum bilgisi olan son öğeyi bul
            const lastLocationData = [...dataArray].reverse().find(d => d.lat != null && d.lng != null);
            if (lastLocationData) {
                setCurrentLocation([lastLocationData.lat, lastLocationData.lng]);
            }
        });

        return () => {
            socket.off('yeni-sensor-verisi-toplu');
        };
    }, []);

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        elements: {
            point: { radius: 0, hitRadius: 10, hoverRadius: 4 },
            line: { tension: 0.3, borderWidth: 2 }
        },
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: {
                grid: { display: false, color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { maxTicksLimit: 8, color: '#6b6b99', font: { size: 10 } }
            },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#6b6b99', font: { size: 10 } }
            }
        }
    };

    const speedChartData = {
        labels,
        datasets: [{
            label: 'Hız (m/s)',
            data: sensorData,
            borderColor: '#00d4ff',
            backgroundColor: 'rgba(0, 212, 255, 0.1)',
            fill: true,
        }]
    };

    const accelChartData = {
        labels,
        datasets: [{
            label: 'İvme Y (m/s²)',
            data: accelData,
            borderColor: '#00e676',
            backgroundColor: 'rgba(0, 230, 118, 0.1)',
            fill: false,
        }]
    };

    return (
        <>
            <div className="page-header">
              <div>
                <h1>📊 Kontrol Paneli</h1>
                <p className="subtitle">Gerçek zamanlı sürüş izleme ve analiz</p>
              </div>
              <div className="live-indicator">
                <span className="live-dot"></span>
                CANLI
              </div>
            </div>

            <div className="stats-grid" id="statsGrid">
              <div className="stat-card blue">
                <div className="stat-icon">📱</div>
                <div className="stat-value">{activeDeviceCount}</div>
                <div className="stat-label">Aktif Cihaz</div>
              </div>
              <div className="stat-card cyan">
                <div className="stat-icon">⚡</div>
                <div className="stat-value">{currentSpeed.toFixed(1)}</div>
                <div className="stat-label">Anlık Hız (m/s)</div>
              </div>
              <div className="stat-card red">
                <div className="stat-icon">📉</div>
                <div className="stat-value">{currentAccel.toFixed(2)}</div>
                <div className="stat-label">Sarsıntı İvmesi (Y)</div>
              </div>
              <div className="stat-card yellow">
                <div className="stat-icon">⚠️</div>
                <div className="stat-value">0</div>
                <div className="stat-label">Açık Alarm</div>
              </div>
            </div>

            <div className="grid-3">
              <div className="card">
                <div className="card-header">
                  <h3>📈 İvmeölçer Verisi (Gerçek Zamanlı)</h3>
                  <div className="live-indicator">
                    <span className="live-dot"></span>
                    CANLI
                  </div>
                </div>
                <div className="card-body">
                  <div className="chart-container">
                    <Line data={accelChartData} options={commonOptions} />
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>🗺️ Araç Konumu</h3>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  <div style={{ height: '350px', width: '100%', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
                    <MapContainer center={currentLocation} zoom={15} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={currentLocation} />
                        <RecenterAutomatically lat={currentLocation[0]} lng={currentLocation[1]} />
                    </MapContainer>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid-2">
              <div className="card" style={{ gridColumn: 'span 2' }}>
                <div className="card-header">
                  <h3>🏎️ Hız Grafiği</h3>
                </div>
                <div className="card-body">
                  <div className="chart-container">
                    <Line data={speedChartData} options={commonOptions} />
                  </div>
                </div>
              </div>
            </div>
        </>
    );
};

export default Dashboard;
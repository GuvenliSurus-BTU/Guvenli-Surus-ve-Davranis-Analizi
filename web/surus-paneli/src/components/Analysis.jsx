import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Analysis = () => {
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch devices first
    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/v1/devices', {
                    headers: { 'Authorization': 'Bearer dummy_token' }
                });
                const devs = response.data.data || response.data || [];
                setDevices(devs);
                if (devs.length > 0) {
                    setSelectedDevice(devs[0].deviceId);
                } else {
                    setLoading(false); // No devices
                }
            } catch (error) {
                console.error("Cihazlar çekilirken hata:", error);
                setLoading(false);
            }
        };
        fetchDevices();
    }, []);

    // Fetch report when device changes
    useEffect(() => {
        if (!selectedDevice) return;
        
        const fetchReport = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`http://localhost:5000/api/v1/reports/device/${selectedDevice}/daily`, {
                    headers: { 'Authorization': 'Bearer dummy_token' }
                });
                setReportData(response.data.data || response.data || []);
            } catch (error) {
                console.error("Rapor çekilirken hata:", error);
                setReportData([]);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [selectedDevice]);

    // Prepare chart data
    const chartData = {
        labels: reportData?.map(r => r._id) || [], // Dates
        datasets: [
            {
                label: 'Günlük Alarm Sayısı',
                data: reportData?.map(r => r.totalCount) || [],
                backgroundColor: 'rgba(255, 82, 82, 0.6)',
                borderColor: 'rgba(255, 82, 82, 1)',
                borderWidth: 1,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top', labels: { color: '#ccc' } },
            title: { display: true, text: 'Son Günlerdeki Sürüş İhlalleri', color: '#fff' },
        },
        scales: {
            y: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.1)' } },
            x: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.1)' } }
        }
    };

    return (
        <div className="fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>📈 Sürüş Analizi</h1>
                    <p className="subtitle">Seçili cihaza ait geçmiş ihlal raporları</p>
                </div>
                {devices.length > 0 && (
                    <div>
                        <select 
                            value={selectedDevice} 
                            onChange={(e) => setSelectedDevice(e.target.value)}
                            style={{
                                padding: '10px 15px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.2)'
                            }}
                        >
                            {devices.map(d => (
                                <option key={d.deviceId} value={d.deviceId} style={{color: 'black'}}>
                                    Cihaz: {d.deviceId}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Rapor Yükleniyor...
                </div>
            ) : !devices.length ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Sistemde analiz edilecek kayıtlı cihaz bulunmuyor.
                </div>
            ) : !reportData || reportData.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Bu cihaza ait henüz bir alarm geçmişi bulunmuyor.
                </div>
            ) : (
                <div className="grid-2">
                    <div className="card">
                        <div className="card-header">
                            <h3>Günlük İhlal Grafiği</h3>
                        </div>
                        <div className="card-body">
                            <Bar options={chartOptions} data={chartData} />
                        </div>
                    </div>
                    
                    <div className="card">
                        <div className="card-header">
                            <h3>Rapor Özeti</h3>
                        </div>
                        <div className="card-body" style={{ padding: 0 }}>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Tarih</th>
                                            <th>Toplam İhlal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map((day, idx) => (
                                            <tr key={idx}>
                                                <td style={{ color: 'var(--accent-blue-light)' }}>{day._id}</td>
                                                <td style={{ fontWeight: 'bold' }}>{day.totalCount} Adet</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Analysis;

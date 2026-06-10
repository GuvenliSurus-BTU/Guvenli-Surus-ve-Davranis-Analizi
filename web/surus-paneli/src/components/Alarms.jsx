import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Alarms = () => {
    const [alarms, setAlarms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAlarms = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/v1/alarms', {
                    headers: { 'Authorization': 'Bearer dummy_token' }
                });
                setAlarms(response.data.data || response.data || []);
            } catch (error) {
                console.error("Alarmlar çekilirken hata oluştu:", error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchAlarms();
        const interval = setInterval(fetchAlarms, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1>🚨 Tüm Alarmlar</h1>
                    <p className="subtitle">Sistem tarafından algılanan tüm riskli sürüş olayları</p>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Alarm Geçmişi</h3>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Alarm Tipi</th>
                                    <th>Cihaz ID</th>
                                    <th>Şiddet</th>
                                    <th>Açıklama</th>
                                    <th>Zaman</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Yükleniyor...</td>
                                    </tr>
                                ) : alarms.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Henüz kaydedilmiş bir alarm bulunmuyor.</td>
                                    </tr>
                                ) : (
                                    alarms.map((alarm, index) => {
                                        const severityClass = alarm.severity === 'high' ? 'badge-high' : 'badge-medium';
                                        return (
                                            <tr key={index}>
                                                <td style={{ fontWeight: 500 }}>{alarm.type}</td>
                                                <td style={{ color: 'var(--accent-blue-light)' }}>{alarm.deviceId}</td>
                                                <td>
                                                    <span className={`badge ${severityClass}`}>
                                                        {alarm.severity === 'high' ? 'YÜKSEK RİSK' : 'ORTA RİSK'}
                                                    </span>
                                                </td>
                                                <td>{alarm.message || '-'}</td>
                                                <td style={{ color: 'var(--text-muted)' }}>
                                                    {new Date(alarm.createdAt).toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Alarms;

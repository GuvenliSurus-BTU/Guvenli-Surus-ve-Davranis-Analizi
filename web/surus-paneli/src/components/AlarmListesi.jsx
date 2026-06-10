import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AlarmListesi = () => {
    const [alarms, setAlarms] = useState([]);

    useEffect(() => {
        // Backend API'sinden geçmiş alarmları çekiyoruz
        const fetchAlarms = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/v1/alarms');
                setAlarms(response.data.data || response.data || []);
            } catch (error) {
                console.error("Alarmlar çekilirken hata oluştu:", error);
            }
        };
        
        fetchAlarms();
        // İsteğe bağlı olarak 10 saniyede bir güncellenebilir
        const interval = setInterval(fetchAlarms, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="card mt-md">
            <div className="card-header">
              <h3>🚨 Son Alarmlar</h3>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Tip</th>
                      <th>Şiddet</th>
                      <th>Zaman</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alarms.length === 0 ? (
                      <tr><td colSpan="3" className="text-center text-muted" style={{ padding: '24px', textAlign: 'center' }}>Henüz kaydedilmiş bir uyarı bulunmuyor.</td></tr>
                    ) : (
                      alarms.slice(0, 15).map((alarm, index) => {
                        const severityClass = alarm.severity === 'high' ? 'badge-high' : 'badge-medium';
                        return (
                          <tr key={index}>
                            <td style={{ fontWeight: 500 }}>{alarm.type}</td>
                            <td>
                              <span className={`badge ${severityClass}`}>
                                {alarm.severity === 'high' ? 'YÜKSEK RİSK' : 'ORTA RİSK'}
                              </span>
                            </td>
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
    );
};

export default AlarmListesi;
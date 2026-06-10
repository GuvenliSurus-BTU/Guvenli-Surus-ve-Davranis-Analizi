import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Devices = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                // Dummy token used since auth bypass is active
                const response = await axios.get('http://localhost:5000/api/v1/devices', {
                    headers: { 'Authorization': 'Bearer dummy_token' }
                });
                setDevices(response.data.data || response.data || []);
            } catch (error) {
                console.error("Cihazlar çekilirken hata:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDevices();
    }, []);

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1>📱 Cihaz Yönetimi</h1>
                    <p className="subtitle">Sisteme kayıtlı cihazların durumu ve listesi</p>
                </div>
                <div className="live-indicator">
                    <span className="live-dot" style={{ backgroundColor: 'var(--accent-blue)' }}></span>
                    <span style={{ color: 'var(--accent-blue-light)' }}>{devices.length} Cihaz Kayıtlı</span>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Kayıtlı Araç Cihazları</h3>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Cihaz ID</th>
                                    <th>Kullanıcı (Ref)</th>
                                    <th>Araç Tipi</th>
                                    <th>Durum</th>
                                    <th>Kayıt Tarihi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Yükleniyor...</td>
                                    </tr>
                                ) : devices.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Henüz kaydedilmiş bir cihaz bulunmuyor.</td>
                                    </tr>
                                ) : (
                                    devices.map((device) => (
                                        <tr key={device._id}>
                                            <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{device.deviceId}</td>
                                            <td>{device.user || 'Belirtilmemiş'}</td>
                                            <td>{device.vehicleType || 'Bilinmiyor'}</td>
                                            <td>
                                                <span className={`badge ${device.isActive ? 'badge-active' : 'badge-inactive'}`}>
                                                    {device.isActive ? 'AKTİF' : 'PASİF'}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-muted)' }}>
                                                {new Date(device.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Devices;

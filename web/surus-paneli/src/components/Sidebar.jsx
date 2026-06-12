import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>🛡️ SafeDrive Pro</h2>
        <p>Yönetici Paneli</p>
      </div>

      <nav className="sidebar-nav">
        <div 
          className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}
        >
          <span className="icon">📊</span>
          <span>Kontrol Paneli</span>
        </div>
        
        <div 
          className={`nav-item ${location.pathname === '/devices' ? 'active' : ''}`}
          onClick={() => navigate('/devices')}
        >
          <span className="icon">📱</span>
          <span>Cihazlar</span>
        </div>
        
        <div 
          className={`nav-item ${location.pathname === '/alarms' ? 'active' : ''}`}
          onClick={() => navigate('/alarms')}
        >
          <span className="icon">🚨</span>
          <span>Alarmlar</span>
        </div>
        
        <div 
          className={`nav-item ${location.pathname === '/analysis' ? 'active' : ''}`}
          onClick={() => navigate('/analysis')}
        >
          <span className="icon">📈</span>
          <span>Sürüş Analizi</span>
        </div>

        <div 
          className={`nav-item ${location.pathname === '/speed-limit' ? 'active' : ''}`}
          onClick={() => navigate('/speed-limit')}
        >
          <span className="icon">🚦</span>
          <span>Hız Sınırı</span>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">AD</div>
          <div className="user-details">
            <div className="name">Admin Kullanıcı</div>
            <div className="role">Sistem Yöneticisi</div>
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          className="btn btn-outline btn-sm" 
          style={{ width: '100%', marginTop: '12px', borderColor: 'rgba(255,82,82,0.3)', color: '#ff5252' }}
        >
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

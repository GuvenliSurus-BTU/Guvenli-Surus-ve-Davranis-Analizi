import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    // Geçici doğrulama kontrolü (Bypass Modu)
    if (email === 'admin@adm.com' && password === '1234') {
      // Başarılı giriş
      localStorage.setItem('userToken', 'dummy_token');
      navigate('/dashboard');
    } else {
      // Hatalı giriş
      setError('E-posta adresi veya şifre hatalı!');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo">
          <span className="icon">🛡️</span>
          <h1>SafeDrive Pro</h1>
          <p>Sisteme Giriş Yapın</p>
        </div>

        {error && <div className="error-message" style={{ display: 'block' }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>E-posta Adresi</label>
            <input 
              type="email" 
              placeholder="ornek@adm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label>Şifre</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Giriş Yap
          </button>
        </form>
        
        <div className="auth-footer">
          Güvenli Sürüş ve Davranış Analizi Platformu &copy; 2026
        </div>
      </div>
    </div>
  );
};

export default Login;

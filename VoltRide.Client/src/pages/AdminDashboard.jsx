import React, { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { Battery, ShieldAlert, Lock, Navigation, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import '../index.css';

function AdminDashboard() {
  const [bikes, setBikes] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!storedUser || !token) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'Admin') {
      alert("Bu sayfaya sadece yetkili yöneticiler girebilir!");
      navigate('/dashboard');
      return;
    }

    setUser(parsedUser);

    fetch('http://localhost:5288/api/bike')
      .then(res => res.json())
      .then(data => setBikes(data))
      .catch(err => console.error("API error:", err));

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5288/bikehub', {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => {
        connection.on('ReceiveBikePositions', (updatedBikes) => {
          setBikes(updatedBikes);
        });

        connection.on('ReceiveAlert', (msg) => {
          setAlerts(prev => [...prev, msg]);
          setTimeout(() => setAlerts(prev => prev.slice(1)), 10000);
        });
      })
      .catch(err => console.error('SignalR error:', err));

    return () => connection.stop();
  }, [navigate]);

  const handleLock = async (bikeId) => {
    if (!window.confirm("Bu bisikleti zorla bakıma almak istediğinize emin misiniz? Devam eden sürüş iptal edilecek.")) return;
    
    try {
      const res = await fetch(`http://localhost:5288/api/bike/lock/${bikeId}`, {
        method: 'POST'
      });
      const data = await res.json();
      alert(data.message);
    } catch (err) {
      alert("İşlem başarısız.");
    }
  };

  const handleUnlock = async (bikeId) => {
    if (!window.confirm("Bu bisikletin bakımı bitti mi? Sahaya %100 şarj ile sürülecek.")) return;
    
    try {
      const res = await fetch(`http://localhost:5288/api/bike/unlock/${bikeId}`, {
        method: 'POST'
      });
      const data = await res.json();
      alert(data.message);
    } catch (err) {
      alert("İşlem başarısız.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="app-container" style={{ maxWidth: '1000px' }}>
      {alerts.length > 0 && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {alerts.map((a, i) => (
            <div key={i} style={{ background: '#EF4444', color: 'white', padding: '15px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' }}>
              <AlertTriangle size={20} /> {a}
            </div>
          ))}
        </div>
      )}

      <header className="header">
        <div className="brand">
          <ShieldAlert size={32} color="#EF4444" fill="#EF4444" />
          <h1 style={{ background: 'linear-gradient(135deg, #EF4444, #F59E0B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>VoltRide Admin Center</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: '#9CA3AF' }}>Yönetici: {user.email}</span>
          <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', fontWeight: 'bold' }}>
            Çıkış Yap
          </button>
        </div>
      </header>

      <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '20px', border: '1px solid var(--border)' }}>
        <h2 style={{ marginBottom: '20px' }}>Canlı Filo Yönetimi</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {bikes.map(bike => (
            <div key={bike.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '15px 20px', borderRadius: '12px' }}>
              
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '5px' }}>{bike.name}</div>
                <div style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>{bike.latitude.toFixed(4)}, {bike.longitude.toFixed(4)}</div>
              </div>

              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Battery size={20} color={bike.batteryLevel > 20 ? '#10B981' : '#EF4444'} />
                <span style={{ fontWeight: 'bold' }}>%{bike.batteryLevel}</span>
              </div>

              <div style={{ flex: 1 }}>
                <span className={`bike-badge badge-${bike.status}`}>
                  {bike.status}
                </span>
              </div>

              <div>
                {bike.status !== 'Maintenance' ? (
                  <button 
                    onClick={() => handleLock(bike.id)}
                    style={{ background: '#EF4444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}
                  >
                    <Lock size={16} /> Kilitle (Bakım)
                  </button>
                ) : (
                  <button 
                    onClick={() => handleUnlock(bike.id)}
                    style={{ background: '#10B981', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}
                  >
                    <Navigation size={16} /> Sahaya Sür
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMapEvents } from 'react-leaflet';
import * as signalR from '@microsoft/signalr';
import { Battery, CheckCircle, Navigation, MapPin, Wallet, History, AlertTriangle, Send } from 'lucide-react';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import '../index.css';

const bikeIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const targetIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}

function Dashboard() {
  const [bikes, setBikes] = useState([]);
  const [currentRental, setCurrentRental] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [rideHistory, setRideHistory] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [plannedRoute, setPlannedRoute] = useState([]);

  const navigate = useNavigate();

  const handleMapClick = (latlng) => {
    if (currentRental && !showHistory) {
      setPlannedRoute(prev => [...prev, latlng]);
    }
  };

  const sendRoute = async () => {
    if (!currentRental || plannedRoute.length === 0) return;
    try {
      const res = await fetch(`http://localhost:5288/api/bike/route/${currentRental}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plannedRoute)
      });
      const data = await res.json();
      alert(data.message);
      setPlannedRoute([]);
    } catch (err) {
      alert("Rota gönderilemedi.");
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!storedUser || !token) {
      navigate('/login');
      return;
    }
    
    setUser(JSON.parse(storedUser));

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

        connection.on('ReceiveWalletUpdate', (data) => {
          if (data.email === JSON.parse(storedUser).email) {
            setUser(prev => ({ ...prev, balance: data.balance }));
            const u = JSON.parse(storedUser);
            u.balance = data.balance;
            localStorage.setItem('user', JSON.stringify(u));
          }
        });

        connection.on('ReceiveAlert', (msg) => {
          setAlerts(prev => [...prev, msg]);
          setTimeout(() => setAlerts(prev => prev.slice(1)), 5000);
        });

        connection.on('ReceiveLiveRoute', (data) => {
          if (data.email === JSON.parse(storedUser).email) {
            setSelectedRoute(JSON.parse(data.route || '[]'));
          }
        });
      })
      .catch(err => console.error('SignalR error:', err));

    return () => connection.stop();
  }, [navigate]);

  const handleRent = async (bikeId) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5288/api/bike/rent/${bikeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user.email)
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentRental(bikeId);
      } else {
        alert(data.message || data);
      }
    } catch (err) {
      alert("Failed to start rental.");
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!currentRental) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5288/api/bike/return/${currentRental}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        alert(`${data.message}. Total fee: ${data.totalCost || 0} TL`);
        setCurrentRental(null);
        setSelectedRoute(null);
      }
    } catch (err) {
      alert("Failed to end rental.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
      setSelectedRoute(null);
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:5288/api/bike/history/${user.email}`);
      const data = await res.json();
      setRideHistory(data);
      setShowHistory(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="app-container">
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
          <Navigation size={32} color="#10B981" fill="#10B981" />
          <h1>VoltRide</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.15)', padding: '8px 16px', borderRadius: '20px', color: '#10B981', fontWeight: 'bold' }}>
            <Wallet size={18} /> ₺{user.balance.toFixed(2)}
          </div>
          
          <button onClick={fetchHistory} style={{ background: 'transparent', border: '1px solid #374151', color: 'white', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} /> {showHistory ? 'Hide History' : 'My Rides'}
          </button>

          {currentRental ? (
            <>
              {plannedRoute.length > 0 && (
                <button onClick={sendRoute} style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                  <Send size={18} /> Rotayı Yolla
                </button>
              )}
              <button className="btn-danger" onClick={handleReturn} disabled={loading}>
                {loading ? 'Ending...' : 'End Ride'}
              </button>
            </>
          ) : (
            <div className="status-badge">
              <CheckCircle size={18} /> Ready to Ride
            </div>
          )}
          
          <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', fontWeight: 'bold' }}>
            Logout
          </button>
        </div>
      </header>

      <div className="main-content">
        <div className="sidebar">
          <h2>{showHistory ? 'Geçmiş Sürüşlerim' : '⚡ Canlı Filo'}</h2>
          
          <div className="bike-list">
            {showHistory ? (
              rideHistory.length === 0 ? <p style={{ color: '#9CA3AF' }}>Henüz sürüşünüz yok.</p> :
              rideHistory.map(ride => (
                <div key={ride.id} className="bike-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedRoute(JSON.parse(ride.routeCoordinates || '[]'))}>
                  <div className="bike-header">
                    <span className="bike-name">Bisiklet #{ride.bikeId}</span>
                    <span className="bike-badge badge-Available">₺{ride.totalCost}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                    {new Date(ride.startTime).toLocaleString()} - {new Date(ride.endTime).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              bikes.map(bike => (
                <div key={bike.id} className={`bike-card status-${bike.status}`}>
                  <div className="bike-header">
                    <span className="bike-name">{bike.name}</span>
                    <span className={`bike-badge badge-${bike.status}`}>
                      {bike.status}
                    </span>
                  </div>
                  
                  <div className="bike-stats">
                    <div className="stat-item">
                      <Battery size={16} color={bike.batteryLevel > 20 ? '#10B981' : '#EF4444'} />
                      <span>{bike.batteryLevel}%</span>
                    </div>
                    <div className="stat-item">
                      <MapPin size={16} color="#9CA3AF" />
                      <span>{bike.latitude.toFixed(4)}, {bike.longitude.toFixed(4)}</span>
                    </div>
                  </div>
                  
                  {bike.status === 'Available' && !currentRental && (
                    <button 
                      className="btn-primary" 
                      onClick={() => handleRent(bike.id)} 
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Unlock Bike'}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="map-container">
          <MapContainer center={[37.915, 40.218]} zoom={14} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapEvents onMapClick={handleMapClick} />

            <Circle 
              center={[37.915, 40.218]} 
              radius={2000} 
              pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.05, weight: 2, dashArray: '5, 10' }} 
            />

            {selectedRoute && selectedRoute.length > 0 && (
              <Polyline positions={selectedRoute} color="#EF4444" weight={4} opacity={0.8} />
            )}

            {plannedRoute.length > 0 && (
              <Polyline positions={plannedRoute} color="#3B82F6" weight={4} dashArray="10, 10" opacity={0.8} />
            )}
            {plannedRoute.map((pt, i) => (
              <Marker key={`target-${i}`} position={pt} icon={targetIcon}>
                <Popup>Hedef {i+1}</Popup>
              </Marker>
            ))}

            {!showHistory && bikes.map(bike => (
              <Marker key={bike.id} position={[bike.latitude, bike.longitude]} icon={bikeIcon}>
                <Popup>
                  <div className="custom-popup">
                    <h3>{bike.name}</h3>
                    <p><b>Battery:</b> {bike.batteryLevel}%</p>
                    <p><b>Status:</b> {bike.status}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
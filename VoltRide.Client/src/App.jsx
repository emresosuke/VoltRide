import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import * as signalR from '@microsoft/signalr';
import { Battery, CheckCircle, Navigation, MapPin } from 'lucide-react';
import L from 'leaflet';
import './App.css';
import './index.css';

// Leaflet marker configuration
const bikeIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function App() {
  const [bikes, setBikes] = useState([]);
  const [currentRental, setCurrentRental] = useState(null);
  const [userEmail] = useState('yunus@voltride.com');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
        console.log('Connected to VoltRide live stream.');
        connection.on('ReceiveBikePositions', (updatedBikes) => {
          setBikes(updatedBikes);
        });
      })
      .catch(err => console.error('SignalR error:', err));

    return () => connection.stop();
  }, []);

  const handleRent = async (bikeId) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5288/api/bike/rent/${bikeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userEmail)
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentRental(data.logId);
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
        alert(`${data.message}. Total fee: ${data.totalCost || 50} TL`);
        setCurrentRental(null);
      }
    } catch (err) {
      alert("Failed to end rental.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="brand">
          <Navigation size={32} color="#10B981" fill="#10B981" />
          <h1>VoltRide</h1>
        </div>
        <div>
          {currentRental ? (
            <button className="btn-danger" onClick={handleReturn} disabled={loading}>
              {loading ? 'Ending...' : 'End Ride'}
            </button>
          ) : (
            <div className="status-badge">
              <CheckCircle size={18} /> Ready to Ride
            </div>
          )}
        </div>
      </header>

      <div className="main-content">
        <div className="sidebar">
          <h2>⚡ Live Fleet Status</h2>
          <div className="bike-list">
            {bikes.map(bike => (
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
            ))}
          </div>
        </div>

        <div className="map-container">
          <MapContainer center={[37.915, 40.218]} zoom={14} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {bikes.map(bike => (
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

export default App;
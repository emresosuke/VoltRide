import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegister ? 'register' : 'login';
    
    try {
      const res = await fetch(`http://localhost:5288/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, passwordHash: password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (isRegister) {
          alert('Registration successful! Please login.');
          setIsRegister(false);
        } else {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          if (data.user.role === 'Admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        }
      } else {
        alert(data.message || 'Error occurred');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0f19' }}>
      <div style={{ background: 'rgba(18, 24, 38, 0.6)', padding: '40px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', width: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#10B981' }}>VoltRide {isRegister ? 'Register' : 'Login'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="email" 
            placeholder="Email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #374151', background: '#111827', color: 'white' }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #374151', background: '#111827', color: 'white' }}
          />
          <button type="submit" style={{ padding: '12px', borderRadius: '8px', background: '#10B981', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
            {isRegister ? 'Create Account' : 'Login'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px', cursor: 'pointer', color: '#9CA3AF' }} onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
        </p>
      </div>
    </div>
  );
}

export default Login;

import React, { useState } from 'react';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const users = {
    uploader: { password: 'upload123', role: 'uploader' },
    manager: { password: 'manager123', role: 'manager' },
    accounts: { password: 'accounts123', role: 'accounts' },
    admin: { password: 'admin123', role: 'admin' }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const user = users[username];
    if (user && user.password === password) {
      onLogin({ username, role: user.role });
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Transport Invoices</h1>
          <p>Sign in to your account</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block">
            Sign In
          </button>
        </form>

        {/* Credentials section removed */}
      </div>
    </div>
  );
}

export default Login;

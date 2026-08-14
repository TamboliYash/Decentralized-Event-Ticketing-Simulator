import { useState } from "react";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempt with', { email, password });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Login</h1>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" name="email" placeholder="enter email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" placeholder="******" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="forgot-password-container">
            <a href="/forgot-password">Forgot password?</a>
          </div>
          <button type="submit" className="login-button">Log In</button>
        </form>
      </div>
      <hr className="divider" />
      <div className="register-footer">
        <p>Don't have an account? <a href="/register">Register</a></p>
      </div>
    </div>
  );
};

export default Login;

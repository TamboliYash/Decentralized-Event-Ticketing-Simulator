import {useState} from "react";
import { Link } from 'react-router-dom';

const Register = () => {
  const [role, setRole] = useState('buyer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const showPasswordError = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (showPasswordError) return;

    console.log("Registration attempt", { role, fullName, email, password });

  };

  return (
    <div className="register-wrapper">
      <div className="header">
        <h1 className="title">Register</h1>
      </div>
      <div className="register-card">
        <div className="card-header">
          <h2>Create your account</h2>
          <p>Enter your details to register</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group role-group">
            <label>I AM A</label>
            <div className="role-toggle-container">
              <button type="button" className={`role-btn ${role === 'buyer' ? 'active' : ''}`}
                onClick={() => setRole('buyer')}>Buyer
              </button>
              <button type="button" className={`role-btn ${role === 'organizer' ? 'active' : ''}`}
                onClick={() => setRole('organizer')}>Organizer
              </button>
              <button type="button" className="role-button-disabled" disabled>
                Staff
              </button>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="fullName">Full Name</label>
            <input type="text" id="fullName" placeholder="enter name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" placeholder="enter email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="******" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className={`input-group ${showPasswordError ? 'has-error' : ''}`}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-with-icon">
              <input type="password" id="confirmPassword" placeholder="******" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              {showPasswordError && (
                <span className="error-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </span>
              )}
            </div>
            {showPasswordError && (
              <p className="error-message">Passwords do not match</p>
            )}
          </div>
          <button type="submit" className="submit-button">
            Create Account
          </button>
        </form>
        <div className="login-footer">
          <p>Already have an account? <Link to='/Login'>Log In</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, KeyRound, ShieldCheck } from 'lucide-react';
import { useUser } from '../context/UserContext';
import './AuthPage.css';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const { requestPasswordResetOtp, resetPassword } = useUser();
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await requestPasswordResetOtp(email);
      setInfo('If an account exists with this email, a reset code was sent.');
      setStep('verify');
    } catch (err) {
      setError(
        err.response?.data?.error?.message || err.message || 'Failed to request reset. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit code sent to your email.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email, otp, newPassword);
      // Assuming auto-login via UserContext
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.error?.message || err.message || 'Failed to reset password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <div className="auth-brand-icon">
            <BookOpen size={30} />
          </div>
          <h1 className="auth-title">Forgot Password</h1>
          <p className="auth-subtitle">
            {step === 'request'
              ? 'Enter your email to receive a reset code'
              : `Enter the code sent to ${email}`}
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {info && <div className="auth-info">{info}</div>}

        {step === 'request' && (
          <form onSubmit={handleRequestOtp} noValidate>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              <KeyRound size={18} />
              {loading ? 'Sending code…' : 'Send Reset Code'}
            </button>
          </form>
        )}

        {step === 'verify' && (
          <form onSubmit={handleResetPassword} noValidate>
            <div className="form-group">
              <label htmlFor="otp">Verification Code</label>
              <input
                id="otp"
                name="otp"
                type="text"
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="Min. 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              <ShieldCheck size={18} />
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>

            <button
              className="auth-btn secondary"
              type="button"
              disabled={loading}
              onClick={handleRequestOtp}
            >
              Resend Code
            </button>
          </form>
        )}

        <div className="auth-footer">
          Remembered your password?
          <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, ShieldCheck } from 'lucide-react';
import { useUser } from '../context/UserContext';
import './AuthPage.css';

export default function SignupVerifyPage() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const { verifySignupOtp, requestSignupOtp } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const signupState = location.state || {};
  const email = signupState.email || '';
  const username = signupState.username || '';
  const password = signupState.password || '';

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email) {
      setError('Please start signup again to receive a code.');
      return;
    }
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit code sent to your email.');
      return;
    }
    setLoading(true);
    try {
      await verifySignupOtp(email, otp);
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.error?.message || err.message || 'OTP verification failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    if (!email || !username || !password) {
      setError('Please return to signup to resend the code.');
      return;
    }
    setLoading(true);
    try {
      await requestSignupOtp(email, username, password);
      setInfo('A new code has been sent to your email.');
    } catch (err) {
      setError(
        err.response?.data?.error?.message || err.message || 'OTP resend failed. Please try again.'
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
          <h1 className="auth-title">Verify your email</h1>
          <p className="auth-subtitle">Enter the 6-digit code we sent to {email || 'your email'}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {info && <div className="auth-info">{info}</div>}

        <form onSubmit={handleVerify} noValidate>
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

          <button className="auth-btn" type="submit" disabled={loading}>
            <ShieldCheck size={18} />
            {loading ? 'Verifying…' : 'Verify & Create Account'}
          </button>

          <button
            className="auth-btn secondary"
            type="button"
            disabled={loading}
            onClick={handleResend}
          >
            Resend Code
          </button>
        </form>

        <div className="auth-footer">
          Need to change your email?
          <Link to="/signup">Go back</Link>
        </div>
      </div>
    </div>
  );
}

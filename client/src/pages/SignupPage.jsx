import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, UserPlus } from 'lucide-react';
import { useUser } from '../context/UserContext';
import './AuthPage.css';

export default function SignupPage() {
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useUser();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.email || !form.username || !form.password || !form.confirmPassword) {
      return 'Please fill in all fields.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return 'Please enter a valid email address.';
    }
    if (form.username.length < 3 || form.username.length > 50) {
      return 'Username must be 3–50 characters.';
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(form.username)) {
      return 'Username may only contain letters, numbers, _ and -.';
    }
    if (form.password.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    if (form.password !== form.confirmPassword) {
      return 'Passwords do not match.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      await signup(form.email, form.username, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Sign up failed. Please try again.');
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
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Join BookShell and start reading</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="your_username"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            <UserPlus size={18} />
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?
          <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}

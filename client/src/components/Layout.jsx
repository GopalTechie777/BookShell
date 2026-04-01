import { Link, Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Search, LogOut, UserCircle, Compass, Library, ShieldCheck, Mail } from 'lucide-react';
import { useUser } from '../context/UserContext';
import './Layout.css';

export default function Layout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const { user, logout } = useUser();

  const handleSearch = (e) => {
    e.preventDefault();
    const query = new FormData(e.target).get('q');
    if (query?.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="page-wrapper">
      <header className="fixed-header">
        <div className="container header-content">
          <Link to="/" className="brand-link">
            <BookOpen className="brand-icon" size={28} />
            <span className="brand-text text-gradient">BookShell</span>
          </Link>

          <form onSubmit={handleSearch} className="search-bar">
            <Search className="search-icon" size={18} />
            <input 
              name="q" 
              type="text" 
              placeholder="Search books, authors..." 
              defaultValue={q}
            />
          </form>

          <nav className="header-nav">
            <Link to="/categories" className="nav-link">Categories</Link>
            {user ? (
              <>
                <span className="nav-user">
                  <UserCircle size={18} />
                  {user.username}
                </span>
                <button className="nav-logout-btn" onClick={logout}>
                  <LogOut size={15} />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Log in</Link>
                <Link to="/signup" className="nav-signup-btn">Sign Up</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="footer-area">
        <div className="container footer-grid">
          <div className="footer-brand-col">
            <Link to="/" className="footer-brand-link">
              <BookOpen className="footer-brand-icon" size={22} />
              <span>BookShell</span>
            </Link>
            <p className="footer-tagline">
              Discover timeless classics and modern favorites in one beautifully organized reading space.
            </p>
            <div className="footer-contact">
              <Mail size={14} />
              <span>hello@bookshell.app</span>
            </div>
          </div>

          <div className="footer-link-col">
            <h4>Explore</h4>
            <Link to="/" className="footer-link-item"><Compass size={14} /> Home</Link>
            <Link to="/categories" className="footer-link-item"><Library size={14} /> Categories</Link>
            <Link to="/search" className="footer-link-item"><Search size={14} /> Search</Link>
          </div>

          <div className="footer-link-col">
            <h4>Account</h4>
            {user ? (
              <>
                <span className="footer-user-pill"><UserCircle size={14} /> Signed in as {user.username}</span>
                <button className="footer-action-btn" onClick={logout}>
                  <LogOut size={14} /> Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="footer-link-item">Log in</Link>
                <Link to="/signup" className="footer-link-item">Create account</Link>
                <Link to="/forgot-password" className="footer-link-item">Forgot password</Link>
              </>
            )}
          </div>

          <div className="footer-link-col">
            <h4>Library</h4>
            <p className="footer-note">
              Curated reading experience with chapter-based navigation, category browsing, and smart discovery.
            </p>
            <span className="footer-secure-badge"><ShieldCheck size={14} /> Safe account auth enabled</span>
          </div>
        </div>

        <div className="footer-bottom-row">
          <div className="container footer-bottom-content">
            <p>© {new Date().getFullYear()} BookShell. For readers, by readers.</p>
            <p>Made with care for book lovers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

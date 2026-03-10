import { Link, Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Search, LogIn, LogOut, UserCircle } from 'lucide-react';
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
      <header className="fixed-header glass-panel">
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
        <div className="container">
          <p>© {new Date().getFullYear()} BookShell. For readers, by readers.</p>
        </div>
      </footer>
    </div>
  );
}

import { Link, Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Search } from 'lucide-react';
import './Layout.css';

export default function Layout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';

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

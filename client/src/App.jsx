import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';

// Public Pages
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import CategoriesIndexPage from './pages/CategoriesIndexPage';
import BookDetailPage from './pages/BookDetailPage';
import ReaderPage from './pages/ReaderPage';
import SearchResultsPage from './pages/SearchResultsPage';

// Admin Pages
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminCategories from './pages/AdminCategories';
import AdminBooks from './pages/AdminBooks';
import AdminBookForm from './pages/AdminBookForm';
import AdminChapters from './pages/AdminChapters';
import AdminChapterForm from './pages/AdminChapterForm';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="categories" element={<CategoriesIndexPage />} />
            <Route path="categories/:id" element={<CategoryPage />} />
            <Route path="books/:id" element={<BookDetailPage />} />
            <Route path="books/:id/read/:chapterId" element={<ReaderPage />} />
            <Route path="search" element={<SearchResultsPage />} />
            <Route path="*" element={<div className="container" style={{padding: '100px 24px', textAlign: 'center'}}><h2>404 - Page Not Found</h2></div>} />
          </Route>

          {/* Admin Login Route (No layout) */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            
            <Route path="categories" element={<AdminCategories />} />
            
            <Route path="books" element={<AdminBooks />} />
            <Route path="books/new" element={<AdminBookForm />} />
            <Route path="books/:id" element={<AdminBookForm />} />
            
            <Route path="books/:id/chapters" element={<AdminChapters />} />
            <Route path="books/:id/chapters/new" element={<AdminChapterForm />} />
            <Route path="books/:id/chapters/:chapterId/edit" element={<AdminChapterForm />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

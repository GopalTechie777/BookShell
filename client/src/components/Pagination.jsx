import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Pagination.css';

export default function Pagination({ total, limit = 20 }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) return null;

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage);
    setSearchParams(newParams);
    window.scrollTo(0, 0);
  };

  return (
    <div className="pagination">
      <button 
        className="pagination-btn glass-panel"
        disabled={currentPage === 1}
        onClick={() => handlePageChange(currentPage - 1)}
      >
        <ChevronLeft size={18} />
        <span>Prev</span>
      </button>

      <span className="pagination-info">
        Page <strong className="text-gradient">{currentPage}</strong> of {totalPages}
      </span>

      <button 
        className="pagination-btn glass-panel"
        disabled={currentPage === totalPages}
        onClick={() => handlePageChange(currentPage + 1)}
      >
        <span>Next</span>
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

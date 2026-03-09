import React from 'react';
import { Link } from 'react-router-dom';
import { Book as BookIcon } from 'lucide-react';
import './BookCard.css';

export default function BookCard({ book }) {
  const coverUrl = book.coverImage || null;
  
  const Wrapper = book.isExternal ? 'a' : Link;
  const linkProps = book.isExternal 
    ? { href: book.externalUrl, target: '_blank', rel: 'noopener noreferrer' } 
    : { to: `/books/${book.id}` };

  return (
    <Wrapper {...linkProps} className="book-card glass-panel">
      <div className="book-cover">
        {coverUrl ? (
          <img src={coverUrl} alt={book.title} />
        ) : (
          <div className="book-cover-placeholder">
            <BookIcon size={48} className="placeholder-icon" />
          </div>
        )}
      </div>
      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{book.author}</p>
        {book.category && (
          <span className="book-category">{book.category.name}</span>
        )}
      </div>
    </Wrapper>
  );
}

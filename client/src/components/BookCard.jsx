import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Book as BookIcon } from 'lucide-react';
import './BookCard.css';

export default function BookCard({ book }) {
  const [imgError, setImgError] = useState(false);

  const hasCover = book.coverImage && !imgError;

  const Wrapper = book.isExternal ? 'a' : Link;
  const linkProps = book.isExternal
    ? { href: book.externalUrl, target: '_blank', rel: 'noopener noreferrer' }
    : { to: `/books/${book.id}` };

  return (
    <Wrapper {...linkProps} className="book-card">
      <div className="book-cover">
        {hasCover ? (
          <img
            src={book.coverImage}
            alt={book.title}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="fallback-cover">
            <BookIcon size={48} className="fallback-icon" />
            <span className="fallback-title">{book.title}</span>
          </div>
        )}
      </div>
      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{book.author}</p>
        <div className="book-meta">
          {book.category && (
            <span className="book-category">{book.category.name}</span>
          )}
        </div>
      </div>
    </Wrapper>
  );
}
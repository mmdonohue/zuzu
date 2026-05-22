import React from 'react';
import type { PortfolioItem } from '../types';
import PortfolioCard from '../PortfolioCard';

const DEFAULT_ACCENT = '#74e5ff';

function FeaturedCard({ item }: { item: PortfolioItem }) {
  const accent = item.css_options?.accent ?? DEFAULT_ACCENT;

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 transition-all duration-300 hover:border-white/20 hover:shadow-2xl">
      <div className="relative aspect-[16/7] overflow-hidden">
        {item.image && (
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-sm"
                  style={{ color: accent }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">{item.title}</h3>
          {item.subtitle && (
            <p className="text-base mt-1" style={{ color: accent }}>
              {item.subtitle}
            </p>
          )}
          {item.text && (
            <p className="text-sm text-white/70 mt-2 max-w-2xl line-clamp-2">{item.text}</p>
          )}
          {item.link && item.link !== '#' && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: accent }}
            >
              View Project
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Magazine({ items }: { items: PortfolioItem[] }) {
  const featured = items.filter((i) => i.featured);
  const rest = items.filter((i) => !i.featured);

  return (
    <div className="space-y-6">
      {featured.map((item) => (
        <FeaturedCard key={item.id} item={item} />
      ))}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((item) => (
            <PortfolioCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

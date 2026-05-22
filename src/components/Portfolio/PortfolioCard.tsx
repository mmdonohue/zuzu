import React from 'react';
import type { PortfolioItem } from './types';

const DEFAULT_ACCENT = '#74e5ff';

type Props = {
  item: PortfolioItem;
  variant?: 'default' | 'featured';
};

export default function PortfolioCard({ item, variant = 'default' }: Props) {
  const accent = item.css_options?.accent ?? DEFAULT_ACCENT;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 transition-all duration-300 hover:border-white/20 hover:-translate-y-1 hover:shadow-2xl ${item.css_options?.card_class ?? ''}`}
    >
      {item.image && (
        <div className={`relative overflow-hidden ${variant === 'featured' ? 'aspect-[2/1]' : 'aspect-video'}`}>
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          {item.featured && (
            <span
              className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm"
              style={{ color: accent, background: `${accent}18`, border: `1px solid ${accent}40` }}
            >
              Featured
            </span>
          )}
        </div>
      )}
      <div className="p-5 space-y-3">
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-lg leading-tight text-white">{item.title}</h3>
          {item.subtitle && (
            <p className="text-sm mt-0.5" style={{ color: accent }}>
              {item.subtitle}
            </p>
          )}
        </div>
        {item.text && <p className="text-sm text-white/60 line-clamp-3">{item.text}</p>}
        {item.link && item.link !== '#' && (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-70"
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
  );
}

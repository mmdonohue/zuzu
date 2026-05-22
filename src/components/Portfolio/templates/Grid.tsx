import React from 'react';
import type { PortfolioItem } from '../types';
import PortfolioCard from '../PortfolioCard';

export default function Grid({ items }: { items: PortfolioItem[] }) {
  const sorted = [...items].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sorted.map((item) => (
        <PortfolioCard key={item.id} item={item} />
      ))}
    </div>
  );
}

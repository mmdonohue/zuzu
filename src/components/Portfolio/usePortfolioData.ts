import { useMemo } from 'react';
import type { PortfolioItem } from './types';

export function usePortfolioData(
  siteItems?: PortfolioItem[],
  parentItems?: PortfolioItem[]
): PortfolioItem[] {
  return useMemo(() => {
    if (siteItems && siteItems.length > 0) return siteItems;
    return parentItems ?? [];
  }, [siteItems, parentItems]);
}

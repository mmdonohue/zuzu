import React from 'react';
import type { PortfolioProps } from './types';
import Grid from './templates/Grid';
import Magazine from './templates/Magazine';
import Cinematic from './templates/Cinematic';

const TEMPLATES = {
  1: Grid,
  2: Magazine,
  3: Cinematic,
} as const;

export default function Portfolio({ items, templateId = 1, autoplay, showNav }: PortfolioProps) {
  const Template = TEMPLATES[templateId];
  return <Template items={items} autoplay={autoplay} showNav={showNav} />;
}

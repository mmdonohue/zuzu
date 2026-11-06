export type CssOptions = {
  accent?: string;
  card_class?: string;
  bg_color?: string;
  /** paper theme: show a click-to-expand chip that opens the full image (for diagrams) */
  image_expand?: boolean;
  /** CSS object-position for the cropped image, e.g. '20% 40%' */
  image_position?: string;
};

export type PortfolioItem = {
  id: string;
  title: string;
  subtitle?: string;
  text?: string;
  link?: string;
  image?: string;
  gallery?: string[];
  tags?: string[];
  featured?: boolean;
  type?: 'project' | 'cta' | 'splash';
  logo?: string;            // splash: image URL for logo (optional — falls back to styled title)
  cta_label?: string;
  cta_url?: string;
  display_url?: string;
  site_slug?: string;   // if set on a cta slide, pulls live event data
  event_id?: string;    // optional — targets a specific event by uuid; falls back to first active
  css_options?: CssOptions;
};

export type PortfolioTemplateId = 1 | 2 | 3;

/** 'dark' = full-bleed cinematic (default), 'paper' = flat light split layout (design.md) */
export type PortfolioTheme = 'dark' | 'paper';

export type PortfolioProps = {
  items: PortfolioItem[];
  templateId?: PortfolioTemplateId;
  autoplay?: boolean;
  showNav?: boolean;
  theme?: PortfolioTheme;
};

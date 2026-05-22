export type CssOptions = {
  accent?: string;
  card_class?: string;
  bg_color?: string;
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

export type PortfolioProps = {
  items: PortfolioItem[];
  templateId?: PortfolioTemplateId;
  autoplay?: boolean;
  showNav?: boolean;
};

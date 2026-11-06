import React from "react";
import type { PortfolioProps } from "./types";
import Grid from "./templates/Grid";
import Magazine from "./templates/Magazine";
import Cinematic from "./templates/Cinematic";

export default function Portfolio({
  items,
  templateId = 1,
  autoplay,
  showNav,
  theme,
}: PortfolioProps) {
  switch (templateId) {
    case 2:
      return <Magazine items={items} />;
    case 3:
      return (
        <Cinematic
          items={items}
          autoplay={autoplay}
          showNav={showNav}
          theme={theme}
        />
      );
    default:
      return <Grid items={items} />;
  }
}

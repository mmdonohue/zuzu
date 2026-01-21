import React from "react";
import { Box, Container } from "@mui/material";
import Header from "./Header";
import Footer from "./Footer";
import { useBackground, BACKGROUND_IMG} from "@/context/BackgroundContext";


const bgImg = BACKGROUND_IMG["astro"]; // yatai

type LayoutProps = {
  children: React.ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | false;
  disableGutters?: boolean;
  fullWidth?: boolean;
};

const Layout: React.FC<LayoutProps> = ({
  children,
  maxWidth = "lg",
  disableGutters = false,
  fullWidth = false,
}) => {
  const { backgroundColor, ditherEnabled } = useBackground();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        position: "relative",
        // Background image configuration
        "&::before": {
          content: '""',
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: ditherEnabled
            ? `url(/images/dither.png), url(/images/${bgImg})`
            : `url(/images/${bgImg})`,
          backgroundSize: ditherEnabled ? "900px, cover" : "cover",
          backgroundPosition: "center",
          backgroundRepeat: ditherEnabled ? "repeat, no-repeat" : "no-repeat",
          backgroundBlendMode: ditherEnabled ? "overlay, multiply" : "normal",
          backgroundAttachment: "local",
          opacity: 0.8,
          zIndex: -1,
          pointerEvents: "none",
          transition: "opacity 0.6s ease-in-out",
        },
        // Color overlay with blend mode
        "&::after": {
          content: '""',
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: backgroundColor,
          backgroundBlendMode: "overlay",
          zIndex: -1,
          pointerEvents: "none",
          transition:
            "background-color 0.6s ease-in-out, opacity 0.6s ease-in-out",
        },
      }}
    >
      <Header />
      {fullWidth ? (
        <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
          {children}
        </Box>
      ) : (
        <Container
          component="main"
          maxWidth={maxWidth}
          disableGutters={disableGutters}
          sx={{ flexGrow: 1, py: 4 }}
          className="container-custom"
        >
          {children}
        </Container>
      )}
      <Footer />
    </Box>
  );
};

export default Layout;

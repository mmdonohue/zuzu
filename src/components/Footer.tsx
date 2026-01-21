import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Container, Grid, Link, Typography } from "@mui/material";

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: "auto",
        backgroundColor: (theme) =>
          theme.palette.mode === "light"
            ? "#42424287"
            : theme.palette.grey[800],
      }}
      className="text-white"
    >
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="h6" color="inherit" gutterBottom>
              ZuZu
            </Typography>
            <Typography variant="body2" color="inherit">
              A React scaffold application for integrating multiple tech stacks
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="h6" color="inherit" gutterBottom>
              Links
            </Typography>
            <ul className="space-y-2 list-none p-0">
              {[
                { name: "Home", path: "/" },
                { name: "About", path: "/about" },
                { name: "Dashboard", path: "/dashboard" },
              ].map((page) => (
                <li key={page.name}>
                  <Link
                    component={RouterLink}
                    to={page.path}
                    color="inherit"
                    underline="hover"
                  >
                    {page.name}
                  </Link>
                </li>
              ))}
            </ul>
          </Grid>
          <Grid size={{ xs: 6, sm: 2 }}>
            <Typography variant="h6" color="inherit" gutterBottom>
              Technologies
            </Typography>
            <ul className="space-y-2 list-none p-0">
              {["React", "MUI", "TypeScript", "Redux", "Tailwind CSS"].map(
                (tech) => (
                  <li key={tech}>
                    <Typography variant="body2" color="inherit">
                      {tech}
                    </Typography>
                  </li>
                ),
              )}
            </ul>
          </Grid>
          <Grid size={{ xs: 6, sm: 2 }}>
            <Typography variant="h6" gutterBottom>
              TECH COL 2
            </Typography>
            <ul className="space-y-2 list-none p-0">
              {["Express", "TanStack Query", "Cypress", "Supabase"].map(
                (tech) => (
                  <li key={tech}>
                    <Typography variant="body2" color="inherit">
                      {tech}
                    </Typography>
                  </li>
                ),
              )}
            </ul>
          </Grid>
        </Grid>
        <Box mt={3}>
          <Typography variant="body2" color="inherit" align="center">
            {"Copyright © "}
            <Link color="inherit" component={RouterLink} to="/">
              ZuZu
            </Link>{" "}
            {new Date().getFullYear()}
            {"."}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;

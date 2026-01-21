import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";

import logo from "../assets/img/zuzu-logo.png";
import { useAuth } from "@/context/AuthContext";
import { useBackground, BACKGROUND_COLORS } from "@/context/BackgroundContext";

function Logo() {
  return <img src={logo} alt="Logo" className="w-12 sm:w-10 md:w-16 lg:w-16" />;
}

const publicPages = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
];

const protectedPages = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "OpenRouter", path: "/openrouter" },
  { name: "Leet Master", path: "/leet-master" },
  { name: "Logs", path: "/logs" },
];

const Header: React.FC = () => {
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { isAuthenticated, user, logout } = useAuth();
  const {
    backgroundColor,
    setBackgroundColor,
    ditherEnabled,
    setDitherEnabled,
  } = useBackground();
  const navigate = useNavigate();

  const pages = isAuthenticated
    ? [...publicPages, ...protectedPages]
    : publicPages;

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleSettingClick = async (setting: string) => {
    handleCloseUserMenu();

    switch (setting) {
      case "Account":
        navigate("/account");
        break;
      case "Logout":
        await logout();
        navigate("/");
        break;
      case "Login":
        navigate("/login");
        break;
      case "Sign Up":
        navigate("/signup");
        break;
      default:
        break;
    }
  };

  return (
    <AppBar
      position="static"
      className="bg-zuzu-primary"
      sx={{ backgroundColor: BACKGROUND_COLORS.find(c => c.name === "smoke")?.color || "transparent", backdropFilter: "blur(2px)" }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/*  Logo() */}
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              fontWeight: 700,
              color: "inherit",
              textDecoration: "none",
            }}
          >
            ZuZu
          </Typography>

          {/* Mobile menu */}
          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: "block", md: "none" },
              }}
            >
              {pages.map((page) => (
                <MenuItem
                  key={page.name}
                  onClick={handleCloseNavMenu}
                  component={RouterLink}
                  to={page.path}
                >
                  <Typography textAlign="center">{page.name}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          <Typography
            variant="h5"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: "flex", md: "none" },
              flexGrow: 1,
              fontWeight: 700,
              color: "inherit",
              textDecoration: "none",
            }}
          >
            ZuZu
          </Typography>

          {/* Desktop menu */}
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            {pages.map((page) => (
              <Button
                key={page.name}
                component={RouterLink}
                to={page.path}
                onClick={handleCloseNavMenu}
                sx={{ my: 2, color: "white", display: "block" }}
              >
                {page.name}
              </Button>
            ))}
          </Box>

          {/* Background Controls */}
          <Box
            sx={{
              display: "flex",
              gap: 0.5,
              mr: 2,
              alignItems: "center",
            }}
          >
            {/* Dither Pattern Button */}
            <Tooltip title="dither">
              <Box
                onClick={() => setDitherEnabled(!ditherEnabled)}
                sx={{
                  width: 28,
                  height: 28,
                  backgroundImage: "url(/images/dither.png)",
                  backgroundSize: "28px",
                  backgroundPosition: "center",
                  backgroundRepeat: "repeat",
                  cursor: "pointer",
                  border: ditherEnabled
                    ? "2px solid #10a1f2"
                    : "1px solid #fff",
                  borderRadius: 1,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.1)",
                    border: "2px solid #fff",
                  },
                }}
              />
            </Tooltip>

            {/* Divider */}
            <Box
              sx={{
                width: "1px",
                height: 28,
                backgroundColor: "rgba(255,255,255,0.5)",
                mx: 0.5,
              }}
            />

            {/* Color Options */}
            {BACKGROUND_COLORS.map((bg) => (
              <Tooltip key={bg.color} title={bg.name}>
                <Box
                  onClick={() => setBackgroundColor(bg.color)}
                  sx={{
                    width: 28,
                    height: 28,
                    backgroundColor:
                      bg.color === "transparent"
                        ? "rgba(255,255,255,0.2)"
                        : bg.color,
                    backgroundBlendMode:
                      bg.color === "transparent" ? "normal" : "overlay",
                    backgroundImage:
                      bg.color === "transparent"
                        ? "linear-gradient(45deg, rgba(255,255,255,0.3) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.3) 75%, rgba(255,255,255,0.3)), linear-gradient(45deg, rgba(255,255,255,0.3) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.3) 75%, rgba(255,255,255,0.3))"
                        : "none",
                    backgroundSize:
                      bg.color === "transparent" ? "8px 8px" : "auto",
                    backgroundPosition:
                      bg.color === "transparent" ? "0 0, 4px 4px" : "0 0",
                    cursor: "pointer",
                    border:
                      backgroundColor === bg.color
                        ? "2px solid #10a1f2"
                        : "1px solid #fff",
                    borderRadius: 1,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      transform: "scale(1.1)",
                      border: "2px solid #fff",
                    },
                  }}
                />
              </Tooltip>
            ))}
          </Box>

          {/* User menu */}
          <Box sx={{ flexGrow: 0 }}>
            {isAuthenticated ? (
              <>
                <Tooltip title="Open settings">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar sx={{ bgcolor: "secondary.main" }}>
                      {user?.firstName?.[0]?.toUpperCase() || <PersonIcon />}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: "45px" }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  <MenuItem onClick={() => handleSettingClick("Account")}>
                    <Typography textAlign="center">Account</Typography>
                  </MenuItem>
                  <MenuItem onClick={() => handleSettingClick("Logout")}>
                    <Typography textAlign="center">Logout</Typography>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button
                  component={RouterLink}
                  to="/login"
                  sx={{ color: "white", mr: 1 }}
                >
                  Login
                </Button>
                <Button
                  component={RouterLink}
                  to="/signup"
                  variant="outlined"
                  sx={{ color: "white", borderColor: "white" }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;

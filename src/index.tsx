import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import App from "./App";
import { store } from "./store";
import { AuthProvider } from "./context/AuthContext";
import { BackgroundProvider } from "./context/BackgroundContext";
import { SnackbarProvider } from "./contexts/SnackbarContext";
import "./styles/globals.css";

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Create MUI theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#6F87BF",
    },
    secondary: {
      main: "#001133",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <SnackbarProvider>
              <AuthProvider>
                <BackgroundProvider>
                  <App />
                </BackgroundProvider>
              </AuthProvider>
            </SnackbarProvider>
          </ThemeProvider>
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
);

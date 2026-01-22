// src/styles/themes.ts
import { createTheme, ThemeOptions } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material";
import { useBackground } from "@/context/BackgroundContext";

// Color constants
const COLORS = {
  // Primary palette
  primary: "#fff",
  secondary: "#00000066",

  // Transparent backgrounds
  transparent: "transparent",
  transparentWhite: "#ffffff44",
  transparentWhiteDark: "#ffffff36",
  transparentWhiteLight: "#ffffff99",
  transparentBlack: "#00000044",
  transparentBlackDark: "#00000066",
    transparentBlackLight: "#00000022",

  buttonWhite: "#ffffff88",

  // Text colors
  textPrimary: "#fff",
  textSecondary: "#ffffff99",

  // Accent colors
  accentBlue: "#10a1f291",
  borderWhite: "#fff",

  // Status colors
  statusCritical: "#d32f2f",
  statusWarning: "#ff9800",
  statusInfo: "#2196f3",
  statusSuccess: "#4caf50",
} as const;

// Dialog Paper Props - for transparent white dialogs
export const dialogPaperProps = {
  sx: {
    backgroundColor: COLORS.transparentWhite,
    border: `1px solid ${COLORS.borderWhite}`,
    color: COLORS.textPrimary,
  } as SxProps<Theme>,
};

// Dark theme for MUI components
export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: COLORS.primary,
    },
    secondary: {
      main: COLORS.secondary,
    },
    background: {
      default: "transparent",
      paper: "#00000099",
    },
  },
});

// Light theme for MUI components
export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: COLORS.primary,
    },
    secondary: {
      main: COLORS.secondary,
    },
    background: {
      default: "transparent",
      paper: "#ffffff99",
    },
  },
  components: {
    MuiDialog: {
      styleOverrides: {
        root: {
          backgroundImage:
            "url(/images/daydreaming-astronaut-in-wildflower-meadow-4k.jpeg)",
          border: `1px solid ${COLORS.borderWhite}`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundBlendMode: "normal",
        },
      },
    },
  },
});

// Custom theme with transparent backgrounds
export const transparentTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: COLORS.primary,
    },
    secondary: {
      main: COLORS.secondary,
    },
    background: {
      default: "transparent",
      paper: COLORS.transparentWhite,
    },
    text: {
      primary: COLORS.textPrimary,
      secondary: COLORS.textSecondary,
    },
  },
  components: {
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: COLORS.transparentWhite,
          border: `1px solid ${COLORS.borderWhite}`,
          color: COLORS.textPrimary,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: COLORS.transparentWhite,
          color: COLORS.textPrimary,
        },
      },
    },
  },
});

// Common SX props for form fields with dark theme styling
export const darkFormFieldSx: SxProps<Theme> = {
  backgroundColor: COLORS.transparentBlack,
  border: `1px solid ${COLORS.borderWhite}`,
  borderRadius: 1,
  "& .MuiInputBase-input": {
    color: COLORS.textPrimary,
  },
  "& .MuiInputBase-input::placeholder": {
    color: COLORS.textSecondary,
    opacity: 1,
  },
  "& .MuiInputLabel-root": {
    color: COLORS.textSecondary,
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: COLORS.textPrimary,
  },
};

// Common SX props for select fields
export const darkSelectSx: SxProps<Theme> = {
  backgroundColor: COLORS.transparentWhite,
  color: COLORS.textPrimary,
  border: `1px solid ${COLORS.borderWhite}`,
  "& .MuiSvgIcon-root": {
    color: COLORS.textPrimary,
  },
};

// Common SX props for transparent paper components
export const transparentPaperSx: SxProps<Theme> = {
  backgroundColor: COLORS.transparentWhite,
  border: `1px solid ${COLORS.borderWhite}`,
  color: COLORS.textPrimary,
};

// Common SX props for buttons with blue accent
export const accentButtonSx: SxProps<Theme> = {
  backgroundColor: COLORS.accentBlue,
  color: COLORS.textPrimary,
  "&:hover": {
    backgroundColor: COLORS.primary,
  },
};

// DataGrid dark theme styling
export const darkDataGridSx: SxProps<Theme> = {
  color: COLORS.textPrimary,
  border: `1px solid ${COLORS.borderWhite}`,
  fontSize: "12px",
  backgroundColor: "transparent",
  "--DataGrid-pinnedBackground": "transparent",
  "--DataGrid-containerBackground": COLORS.transparentBlack,
  borderRadius: 1,
  "& .MuiDataGrid-cell": {
    color: COLORS.textPrimary,
    borderColor: COLORS.transparentWhite,
  },
  "& .MuiDataGrid-columnHeaders": {
    backgroundColor: COLORS.transparentBlackDark,
    color: COLORS.textPrimary,
    borderColor: COLORS.transparentWhite,
  },
  "& .MuiDataGrid-row": {
    "&:hover": {
      backgroundColor: COLORS.transparentBlack,
    },
  },
  "& .MuiDataGrid-footerContainer": {
    backgroundColor: COLORS.transparentWhite,
    color: COLORS.textPrimary,
    borderColor: COLORS.transparentWhite,
  },
};

// Export colors for direct access
export { COLORS };

// Type for theme mode
export type ThemeMode = "light" | "dark" | "transparent";

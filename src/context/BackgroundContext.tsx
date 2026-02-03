import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";

type BackgroundColor = {
  color: string;
  name: string;
};

export const BACKGROUND_IMG = {
  astro: "daydreaming-astronaut-in-wildflower-meadow-4k.jpeg",
  yatai: "pexels-huuhuynh-16797718.jpg",
};

type BackgroundContextType = {
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  ditherEnabled: boolean;
  setDitherEnabled: (enabled: boolean) => void;
};

const BackgroundContext = createContext<BackgroundContextType | undefined>(
  undefined,
);

export const BACKGROUND_COLORS: BackgroundColor[] = [
  { color: "#00000066", name: "smoke" },
  { color: "transparent", name: "clear" },
  { color: "#10a1f291", name: "blue" },
  { color: "#f9a9f991", name: "violet" },
  { color: "#4f4cf091", name: "purple" },
  { color: "#f9dca991", name: "yellow" },
  { color: "#000000bf", name: "black" },
  { color: "#f5e9ec91", name: "white" },
];

// Cookie constants
const COOKIE_BG_COLOR = "zuzu_bg_color";
const COOKIE_DITHER = "zuzu_dither";
const COOKIE_MAX_AGE_DAYS = 365;

// Cookie helper functions
const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};

const setCookie = (name: string, value: string): void => {
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
};

// Initialize from cookies
const getInitialBackgroundColor = (): string => {
  const saved = getCookie(COOKIE_BG_COLOR);
  if (saved && BACKGROUND_COLORS.some((bg) => bg.color === saved)) {
    return saved;
  }
  return "transparent";
};

const getInitialDitherEnabled = (): boolean => {
  const saved = getCookie(COOKIE_DITHER);
  return saved === "true";
};

type BackgroundProviderProps = {
  children: ReactNode;
};

export const BackgroundProvider: React.FC<BackgroundProviderProps> = ({
  children,
}) => {
  const [backgroundColor, setBackgroundColorState] = useState<string>(
    getInitialBackgroundColor,
  );
  const [ditherEnabled, setDitherEnabledState] = useState<boolean>(
    getInitialDitherEnabled,
  );

  // Wrapped setters that also persist to cookies
  const setBackgroundColor = useCallback((color: string) => {
    setBackgroundColorState(color);
    setCookie(COOKIE_BG_COLOR, color);
  }, []);

  const setDitherEnabled = useCallback((enabled: boolean) => {
    setDitherEnabledState(enabled);
    setCookie(COOKIE_DITHER, String(enabled));
  }, []);

  return (
    <BackgroundContext.Provider
      value={{
        backgroundColor,
        setBackgroundColor,
        ditherEnabled,
        setDitherEnabled,
      }}
    >
      {children}
    </BackgroundContext.Provider>
  );
};

export const useBackground = (): BackgroundContextType => {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error("useBackground must be used within a BackgroundProvider");
  }
  return context;
};

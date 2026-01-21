import React, { createContext, useContext, useState, ReactNode } from "react";

type BackgroundColor = {
  color: string;
  name: string;
};

type BackgroundImage =  { [key: string]: number }

export const BACKGROUND_IMG = {
  "astro": "daydreaming-astronaut-in-wildflower-meadow-4k.jpeg",
  "yatai": "pexels-huuhuynh-16797718.jpg"
}

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

type BackgroundProviderProps = {
  children: ReactNode;
};

export const BackgroundProvider: React.FC<BackgroundProviderProps> = ({
  children,
}) => {
  const [backgroundColor, setBackgroundColor] = useState<string>("transparent");
  const [ditherEnabled, setDitherEnabled] = useState<boolean>(false);

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

"use client";

import { createContext, useContext } from "react";

export type DevTheme = "light" | "dark";

export interface DevThemeContextType {
    theme: DevTheme;
    toggleTheme: () => void;
}

export const DevThemeContext = createContext<DevThemeContextType>({
    theme: "light",
    toggleTheme: () => {},
});

export const useDevTheme = () => useContext(DevThemeContext);

export const THEME_VARS: Record<DevTheme, Record<string, string>> = {
    light: {
        "--dev-bg": "#F8F8FA",
        "--dev-card": "#FFFFFF",
        "--dev-card-hover": "#F4F4F5",
        "--dev-input": "#F4F4F5",
        "--dev-sidebar": "#FFFFFF",
        "--dev-terminal": "#F9FAFB",
        "--dev-border": "rgba(0, 0, 0, 0.08)",
        "--dev-border-strong": "rgba(0, 0, 0, 0.12)",
        "--dev-border-subtle": "rgba(0, 0, 0, 0.04)",
        "--dev-border-hover": "rgba(0, 0, 0, 0.16)",
        "--dev-text": "#09090B",
        "--dev-text-secondary": "#3F3F46",
        "--dev-text-muted": "#71717A",
        "--dev-text-dim": "#A1A1AA",
        "--dev-text-dimmer": "#D4D4D8",
        "--dev-hover": "rgba(0, 0, 0, 0.04)",
        "--dev-active": "rgba(0, 0, 0, 0.08)",
        "--dev-accent": "#059669",
        "--dev-accent-bg": "rgba(5, 150, 105, 0.08)",
        "--dev-shadow": "0 1px 3px rgba(0,0,0,0.08)",
    },
    dark: {
        "--dev-bg": "#0E0E10",
        "--dev-card": "#151518",
        "--dev-card-hover": "#1A1A1E",
        "--dev-input": "#0E0E10",
        "--dev-sidebar": "#0A0A0B",
        "--dev-terminal": "#0C0C0E",
        "--dev-border": "rgba(255, 255, 255, 0.06)",
        "--dev-border-strong": "rgba(255, 255, 255, 0.08)",
        "--dev-border-subtle": "rgba(255, 255, 255, 0.04)",
        "--dev-border-hover": "rgba(255, 255, 255, 0.12)",
        "--dev-text": "#FAFAFA",
        "--dev-text-secondary": "#A1A1AA",
        "--dev-text-muted": "#71717A",
        "--dev-text-dim": "#52525B",
        "--dev-text-dimmer": "#3F3F46",
        "--dev-hover": "rgba(255, 255, 255, 0.04)",
        "--dev-active": "rgba(255, 255, 255, 0.08)",
        "--dev-accent": "#34D399",
        "--dev-accent-bg": "rgba(52, 211, 153, 0.10)",
        "--dev-shadow": "none",
    },
};

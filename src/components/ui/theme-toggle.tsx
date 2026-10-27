"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "@/components/ui/icons";

type Theme = "system" | "light" | "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
  try {
    if (theme === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", theme);
  } catch {}
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme") as Theme | null;
      if (stored === "dark" || stored === "light") {
        setTheme(stored);
      }
    } catch {}
  }, []);

  function cycle() {
    const next: Theme =
      theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);
    applyTheme(next);
  }

  const icons = {
    system: <Monitor size={16} />,
    light: <Sun size={16} />,
    dark: <Moon size={16} />,
  };

  const labels = { system: "System", light: "Light", dark: "Dark" };

  return (
    <button
      onClick={cycle}
      title={`Theme: ${labels[theme]} — click to change`}
      className="w-[34px] h-[34px] flex items-center justify-center rounded-md text-text-secondary hover:bg-sidebar-hover hover:text-foreground transition-colors"
    >
      {icons[theme]}
    </button>
  );
}

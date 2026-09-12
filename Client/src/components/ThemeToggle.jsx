import { useTheme } from "../context/ThemeContext";
import "./ThemeToggle.css";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <span className={`theme-toggle__icon ${theme === "dark" ? "theme-toggle__icon--sun" : "theme-toggle__icon--moon"}`}>
        {theme === "dark" ? "☀️" : "🌙"}
      </span>
    </button>
  );
}

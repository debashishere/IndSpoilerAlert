import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface ThemeToggleProps {
  className?: string;
  style?: React.CSSProperties;
  floating?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  style = {},
  floating = true 
}) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  const defaultFloatingStyle: React.CSSProperties = floating ? {
    position: 'fixed',
    top: '16px',
    right: '24px',
    zIndex: 9999,
  } : {};

  return (
    <div 
      className={`theme-toggle-wrapper ${floating ? 'theme-toggle-floating' : ''} ${className}`}
      style={{ ...defaultFloatingStyle, ...style }}
    >
      <button
        onClick={toggleTheme}
        className={`theme-toggle-btn ${isLight ? 'is-light' : 'is-dark'}`}
        aria-label={`Switch to ${isLight ? 'Dark' : 'Light'} theme`}
        title={`Current: ${isLight ? 'Light' : 'Dark'} Mode. Click to switch to ${isLight ? 'Dark' : 'Light'} Theme`}
        id="theme-toggle-button"
      >
        <div className="icon-container">
          {isLight ? (
            <Sun className="theme-icon sun-icon" size={20} />
          ) : (
            <Moon className="theme-icon moon-icon" size={20} />
          )}
        </div>
        <span className="theme-toggle-label">
          {isLight ? 'Light' : 'Dark'}
        </span>
      </button>
    </div>
  );
};

export default ThemeToggle;

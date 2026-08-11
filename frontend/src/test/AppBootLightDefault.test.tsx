import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { ThemeToggle } from '../components/shell';

const TestComponent = () => {
  const { theme } = useTheme();
  return <div data-testid="theme-val">{theme}</div>;
};

describe('App Boot: Light Default + Theme Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.body.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Slice 1: Light Default for First-Time Visitors', () => {
    it('defaults theme to "light" when localStorage has no entry', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme-val').textContent).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.body.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('Slice 2: Theme Persistence & Restoration', () => {
    it('restores stored "dark" preference from localStorage on mount', () => {
      localStorage.setItem('theme', 'dark');
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme-val').textContent).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.getAttribute('data-theme')).toBe('dark');
    });

    it('restores stored "light" preference from localStorage on mount', () => {
      localStorage.setItem('theme', 'light');
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme-val').textContent).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.body.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('Slice 3: ThemeToggle Component & User Interaction', () => {
    it('renders ThemeToggle in light mode by default with "Switch to Dark" action', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button', { name: /switch to dark/i });
      expect(button).toBeDefined();
      expect(button.className).toContain('is-light');
      expect(button.getAttribute('aria-label')).toMatch(/switch to dark/i);
    });

    it('toggles theme to dark when clicked, updating DOM and localStorage', async () => {
      const user = userEvent.setup();
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button', { name: /switch to dark/i });
      await user.click(button);

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.getAttribute('data-theme')).toBe('dark');
      expect(localStorage.getItem('theme')).toBe('dark');

      const updatedButton = screen.getByRole('button', { name: /switch to light/i });
      expect(updatedButton.className).toContain('is-dark');
    });

    it('toggles back to light mode when clicked a second time', async () => {
      const user = userEvent.setup();
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button', { name: /switch to dark/i });
      await user.click(button); // to dark
      await user.click(button); // to light

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.body.getAttribute('data-theme')).toBe('light');
      expect(localStorage.getItem('theme')).toBe('light');
    });
  });

  describe('Slice 4: Early Boot Inline Script in index.html (No Dark Flash)', () => {
    it('contains inline theme setup script in head to set data-theme before React hydrates', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const htmlPath = path.resolve(__dirname, '../../index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

      expect(htmlContent).toContain('localStorage.getItem(\'theme\')');
      expect(htmlContent).toContain('document.documentElement.setAttribute(\'data-theme\'');
    });
  });
});

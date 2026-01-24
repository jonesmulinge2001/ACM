import { Injectable } from "@angular/core";
import { ThemeMode } from "../interfaces";

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly THEME_KEY = 'academeet_theme';

  getTheme(): ThemeMode {
    return (localStorage.getItem(this.THEME_KEY) as ThemeMode) ?? 'system';
  }

  setTheme(theme: ThemeMode): void {
    localStorage.setItem(this.THEME_KEY, theme);
    this.applyTheme(theme);
  }

  applyTheme(theme: ThemeMode): void {
    const root = document.documentElement;

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.remove('dark');
      if (prefersDark) root.classList.add('dark');
      return;
    }

    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }

  initTheme(): void {
    this.applyTheme(this.getTheme());
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { FormsModule } from '@angular/forms';

export type ThemeMode = 'light' | 'dark' | 'system';

@Component({
  selector: 'app-theme-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './theme.component.html',
})
export class ThemeComponent implements OnInit {
  selectedTheme!: ThemeMode;

  themes: { value: ThemeMode; label: string; icon?: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.selectedTheme = this.themeService.getTheme();
  }

  changeTheme(theme: ThemeMode): void {
    this.selectedTheme = theme;
    this.themeService.setTheme(theme);
  }
}

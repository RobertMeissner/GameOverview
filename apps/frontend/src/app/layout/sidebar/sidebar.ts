import {Component, signal, output, inject} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {CommonModule} from '@angular/common';
import {ThemeService} from '../../services/theme.service';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  protected themeService = inject(ThemeService);

  protected navItems = signal<NavItem[]>([
    {path: "/catalog", label: 'Catalog',icon:"bi-book"},
    {path: "/top-games", label: 'Top Games',icon: "bi-trophy"},
    {path: "/backlog", label: 'Backlog',icon: "bi-clock-history"},
    {path: "/stores", label: 'Stores',icon: "bi-shop"},
    {path: "/scraper", label: 'Game Scraper',icon: "bi-search"},
    {path: "/admin", label: 'Admin',icon: "bi-gear-wide-connected"},
    {path: "/settings", label: 'Settings',icon: "bi-gear"},
    {path: "/about", label: 'About',icon:"bi-info-circle"},
  ])

  protected isCollapsed = signal(true);
  collapsedChange = output<boolean>();

  protected toggleCollapse() {
    this.isCollapsed.update(v => !v);
    this.collapsedChange.emit(this.isCollapsed());
  }

  protected toggleTheme() {
    this.themeService.toggleTheme();
  }
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

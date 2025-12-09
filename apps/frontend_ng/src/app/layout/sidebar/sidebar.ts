import {Component, signal} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  protected navItems = signal<NavItem[]>([
    {path: "/catalog", label: 'Catalog',},
    {path: "/top-games", label: 'Top Games',},
    {path: "/settings", label: 'Settings',},
    {path: "/about", label: 'About',},
  ])
}

interface NavItem {
  path: string;
  label: string;
}

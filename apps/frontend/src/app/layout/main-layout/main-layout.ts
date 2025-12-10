import {Component, signal} from '@angular/core';
import {Sidebar} from '../sidebar/sidebar';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Sidebar],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  protected isSidebarCollapsed = signal(false);

  protected onSidebarCollapsedChange(collapsed: boolean) {
    this.isSidebarCollapsed.set(collapsed);
  }

}

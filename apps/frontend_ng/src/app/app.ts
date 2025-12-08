import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {CatalogComponent} from './catalog-component/catalog-component';
import {TopGames} from './features/top-games/top-games';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CatalogComponent, TopGames],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend_ng');
}

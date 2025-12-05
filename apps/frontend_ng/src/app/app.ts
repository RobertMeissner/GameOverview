import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {CatalogComponent} from './catalog-component/catalog-component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CatalogComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend_ng');
}

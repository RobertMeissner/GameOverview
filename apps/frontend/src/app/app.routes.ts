import {Routes} from '@angular/router';
import {CatalogComponent} from './features/catalog-component/catalog-component';
import {MainLayout} from './layout/main-layout/main-layout';
import {TopGames} from './features/top-games/top-games';
import {AdminPanel} from './features/admin-panel/admin-panel';
import {Backlog} from './features/backlog/backlog';
import {GameScraper} from './features/game-scraper/game-scraper';
import {StoreDashboard} from './features/store-dashboard/store-dashboard';

export const routes: Routes = [
    {
      path: "", component: MainLayout,
      children: [
        {path: "", redirectTo: "catalog", pathMatch: "full"},
        {path: 'catalog', component: CatalogComponent},
        {path: "top-games", component: TopGames},
        {path: "backlog", component: Backlog},
        {path: "stores", component: StoreDashboard},
        {path: "admin", component: AdminPanel},
        {path: "scraper", component: GameScraper}
      ]
    },
    {path: "**", redirectTo: ""}
  ]
;

import {Routes} from '@angular/router';
import {CatalogComponent} from './features/catalog-component/catalog-component';
import {MainLayout} from './layout/main-layout/main-layout';
import {TopGames} from './features/top-games/top-games';

export const routes: Routes = [
    {
      path: "", component: MainLayout,
      children: [{path: "", redirectTo: "catalog", pathMatch: "full"}, {
        path: 'catalog', component: CatalogComponent
      },
        {path: "top-games", component: TopGames}]
    },
    {path: "**", redirectTo: ""}
  ]
;

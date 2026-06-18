/**
 * Inventory Management System
 * Developer: Yuning Wang
 * Application Routes Configuration
 */

import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then(m => m.TABS_ROUTES)
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];

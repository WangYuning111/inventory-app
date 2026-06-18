/**
 * Inventory Management System
 * Developer: Yuning Wang
 * Tabs Navigation Routes
 */

import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const TABS_ROUTES: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () => import('../pages/home/home.page').then(m => m.HomePage)
      },
      {
        path: 'search',
        loadComponent: () => import('../pages/search/search.page').then(m => m.SearchPage)
      },
      {
        path: 'manage',
        loadComponent: () => import('../pages/manage/manage.page').then(m => m.ManagePage)
      },
      {
        path: 'featured',
        loadComponent: () => import('../pages/featured/featured.page').then(m => m.FeaturedPage)
      },
      {
        path: 'privacy',
        loadComponent: () => import('../pages/privacy/privacy.page').then(m => m.PrivacyPage)
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full'
  }
];

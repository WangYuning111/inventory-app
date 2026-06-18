/**
 * Inventory Management System
 * Developer: Yuning Wang
 * Tabs Navigation Page
 */

import { Component } from '@angular/core';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  searchOutline,
  createOutline,
  starOutline,
  shieldOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home" href="/tabs/home">
          <ion-icon name="home-outline"></ion-icon>
          <ion-label>Inventory</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="search" href="/tabs/search">
          <ion-icon name="search-outline"></ion-icon>
          <ion-label>Search</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="manage" href="/tabs/manage">
          <ion-icon name="create-outline"></ion-icon>
          <ion-label>Manage</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="featured" href="/tabs/featured">
          <ion-icon name="star-outline"></ion-icon>
          <ion-label>Featured</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="privacy" href="/tabs/privacy">
          <ion-icon name="shield-outline"></ion-icon>
          <ion-label>Privacy</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
  standalone: true,
  imports: [
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel
  ]
})
export class TabsPage {
  constructor() {
    // Register Ionicons
    addIcons({
      'home-outline': homeOutline,
      'search-outline': searchOutline,
      'create-outline': createOutline,
      'star-outline': starOutline,
      'shield-outline': shieldOutline
    });
  }
}

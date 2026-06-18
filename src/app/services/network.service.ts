/**
 * Inventory Management System
 * Developer: Yuning Wang
 * Network Service - Monitors network status for mobile devices
 */

import { Injectable } from '@angular/core';
import { Observable, fromEvent, merge, of, BehaviorSubject } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private onlineStatus = new BehaviorSubject<boolean>(navigator.onLine);

  constructor() {
    // Monitor online/offline events
    merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    )
      .pipe(startWith(navigator.onLine))
      .subscribe(status => this.onlineStatus.next(status));
  }

  /**
   * Check if device is currently online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Get observable for network status changes
   */
  getNetworkStatus(): Observable<boolean> {
    return this.onlineStatus.asObservable();
  }

  /**
   * Check API server connectivity
   */
  async checkServerConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/ArtGalley/ArtGalleyRESTful', {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      return false;
    }
  }
}

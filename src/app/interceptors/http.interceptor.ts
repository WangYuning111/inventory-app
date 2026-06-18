/**
 * Inventory Management System
 * Developer: Yuning Wang
 * Global HTTP Interceptor
 * Handles: error catching, logging, loading indicators, auth tokens
 */

import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, throwError, of, tap } from 'rxjs';
import { LoadingController, ToastController } from '@ionic/angular/standalone';
import { LoggerService } from '../services/logger.service';
import { NetworkService } from '../services/network.service';
import { I18nService } from '../services/i18n.service';

let activeRequests = 0;
let loadingElement: HTMLIonLoadingElement | null = null;

async function showLoading(loadingCtrl: LoadingController, message: string) {
  activeRequests++;
  if (!loadingElement) {
    loadingElement = await loadingCtrl.create({
      message,
      spinner: 'crescent',
      translucent: true,
      duration: 30000
    });
    await loadingElement.present();
  }
}

async function hideLoading() {
  activeRequests--;
  if (activeRequests <= 0 && loadingElement) {
    await loadingElement.dismiss();
    loadingElement = null;
    activeRequests = 0;
  }
}

export const httpErrorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next) => {
  const logger = inject(LoggerService);
  const loadingCtrl = inject(LoadingController);
  const toastCtrl = inject(ToastController);
  const networkService = inject(NetworkService);
  const i18n = inject(I18nService);

  const t = (k: string) => i18n.t(k);

  // Skip loading for background sync requests
  const skipLoading = req.headers.has('X-Skip-Loading');
  const cloned = req.clone({ headers: req.headers.delete('X-Skip-Loading') });

  if (!skipLoading) {
    showLoading(loadingCtrl, t('app.loading'));
  }

  logger.debug('HTTP', `${req.method} ${req.url}`);

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = t('errors.unknownError');
      let status = error.status;

      if (!networkService.isOnline()) {
        message = t('errors.networkError');
        status = 0;
      } else if (error.status === 0) {
        message = t('errors.networkError');
      } else if (error.status === 400) {
        message = error.error?.message || t('errors.validationFailed');
      } else if (error.status === 401) {
        message = t('errors.unauthorized');
      } else if (error.status === 403) {
        message = t('errors.forbidden');
      } else if (error.status === 404) {
        message = t('errors.notFound');
      } else if (error.status === 409) {
        message = t('errors.conflict');
      } else if (error.status === 422) {
        message = error.error?.message || t('errors.validationFailed');
      } else if (error.status >= 500) {
        message = t('errors.serverError');
      }

      logger.error('HTTP', `${req.method} ${req.url} failed`, { status, message, error: error.error });

      toastCtrl.create({
        message,
        duration: 4000,
        position: 'bottom',
        color: 'danger',
        buttons: [{ text: t('app.close'), role: 'cancel' }]
      }).then(t => t.present());

      return throwError(() => new Error(message));
    }),
    finalize(() => {
      if (!skipLoading) {
        hideLoading();
      }
    })
  );
};

export const httpAuthInterceptor: HttpInterceptorFn = (req, next) => {
  // Add auth token if available (placeholder for future auth implementation)
  const token = localStorage.getItem('auth_token');
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next(req);
};

// Simple in-memory cache for GET requests
const httpCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds

export const httpCacheInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);
  if (req.method !== 'GET') return next(req);

  const cacheKey = `${req.method}:${req.urlWithParams}`;
  const cached = httpCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger.debug('HTTP Cache', `Cache hit for ${req.urlWithParams}`);
    return of(cached.data);
  }

  return next(req).pipe(
    tap(response => {
      httpCache.set(cacheKey, { data: response, timestamp: Date.now() });
    })
  );
};

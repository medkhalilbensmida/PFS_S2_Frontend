import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';

import {
  ApplicationConfig,
  provideZoneChangeDetection,
  importProvidersFrom,
  inject,
} from '@angular/core';
import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
  withFetch,
  withInterceptors,
  HttpHandlerFn,
  HttpRequest,
  HttpInterceptorFn
} from '@angular/common/http';
import { routes } from './app.routes';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideClientHydration } from '@angular/platform-browser';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

// icons
import { TablerIconsModule } from 'angular-tabler-icons';
import * as TablerIcons from 'angular-tabler-icons/icons';

// perfect scrollbar
import { NgScrollbarModule } from 'ngx-scrollbar';
import { NgxPermissionsModule } from 'ngx-permissions';

// Import all material modules
import { MaterialModule } from './material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';
import { catchError, of, throwError } from 'rxjs';
import { AuthService } from './pages/authentication/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TranslationService } from './pages/apps/courses/services/translation.service';
import { AuthInterceptorProvider } from './pages/authentication/interceptors/auth.interceptor';

// Functional interceptor
const authInterceptorFn: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const snackBar = inject(MatSnackBar);
  const router = inject(Router);

  // Skip interception for auth requests
  if (req.url.includes('/auth/')) {
    return next(req);
  }

  const token = authService.getToken();

  // Clone request and add Authorization header if token exists
  const authReq = token 
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  // Pass the modified request to the next handler
  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        authService.signOut();
        snackBar.open('Votre session a expiré. Veuillez vous reconnecter.', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        router.navigate(['/authentication/login']);
      } else if (error.status === 403) {
        snackBar.open('Accès refusé. Vous n\'avez pas les permissions nécessaires.', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
      return throwError(() => error);
    })
  );
};

// Enhanced HttpLoaderFactory with better error handling
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  // Use absolute path to prevent issues with base href
  const loader = new TranslateHttpLoader(http, '/assets/i18n/', '.json');
  
  // Override getTranslation to handle errors gracefully
  loader.getTranslation = (lang: string) => {
    return http.get(`${loader.prefix}${lang}${loader.suffix}`).pipe(
      catchError(error => {
        console.warn(`Failed to load translations for ${lang}, using empty object`);
        return of({}); // Return empty object to prevent app from breaking
      })
    );
  };
  
  return loader;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
      withComponentInputBinding()
    ),
    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi(),
      withInterceptors([authInterceptorFn])
    ),
    provideClientHydration(),
    provideAnimationsAsync(),

    // Custom Translation Service Initialization
    {
      provide: 'APP_INITIALIZER',
      useFactory: (translationService: TranslationService) => 
        () => translationService.initialize(),
      deps: [TranslationService],
      multi: true
    },

    importProvidersFrom(
      FormsModule,
      ReactiveFormsModule,
      MaterialModule,
      NgxPermissionsModule.forRoot(),
      TablerIconsModule.pick(TablerIcons),
      NgScrollbarModule,
      NgxEchartsModule.forRoot({
        echarts: () => import('echarts'),
      }),
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
        defaultLanguage: 'fr',
        isolate: false
      }),
      CalendarModule.forRoot({
        provide: DateAdapter,
        useFactory: adapterFactory
      })
    ),
    // Register the existing interceptor
    AuthInterceptorProvider,
  ],
};
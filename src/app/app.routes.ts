import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { AuthGuard } from './pages/authentication/guards/auth.guard';
import { SurveillanceAssignmentComponent } from './components/surveillance-assignment/surveillance-assignment.component';
import { SurveillanceManagementComponent } from './components/surveillance-management/surveillance-management.component';
import { AppAvailabilitycalendarComponent } from './components/availability-calendar/availabilitycalendar.component';
import { enseignantGuard } from './pages/authentication/guards/enseignant.guard';
import { ReportGenerationComponent } from './components/report-generation/report-generation.component';
export const routes: Routes = [
  {
    path: '',
    component: FullComponent,
    canActivate: [AuthGuard], // Protection globale pour toutes les routes enfants
    children: [
      {
        path: '',
        redirectTo: '/apps/Sessions', // Redirige vers Sessions par défaut
        pathMatch: 'full',
      },
      {
        path: 'surveillance-management/:sessionId',
        component: SurveillanceManagementComponent,
        data: {
          title: 'Gestion des Surveillances',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard1' },
            { title: 'Sessions', url: '/apps/courses/session-list' },
            { title: 'Gestion des Surveillances' },
          ],
        },
      },
      {
        path: 'availability-calendar',
        component: AppAvailabilitycalendarComponent,
        canActivate: [enseignantGuard], // Add the guard here
        data: {
          title: 'Disponibilités des Surveillances',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard1' },
            { title: 'Disponibilités des Surveillances' }
          ]
        }
      },
      {
        path: 'surveillance-assignment',
        component: SurveillanceAssignmentComponent,
        data: {
          title: 'Affectation des Surveillances',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard1' },
            { title: 'Affectation des Surveillances (Toutes)' },
          ],
        },
      },
      {
        path: 'surveillance-assignment/:sessionId',
        component: SurveillanceAssignmentComponent,
        data: {
          title: 'Affectation - Session Spécifique',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard1' },
            { title: 'Sessions', url: '/apps/courses/session-list' },
            { title: 'Affectation Surveillances' },
          ],
        },
      },
      {
        path: 'reports',
        component: ReportGenerationComponent,
        canActivate: [AuthGuard],
        data: { 
          roles: ['ROLE_ADMIN'],
          title: 'Rapports et Convocations',
          
        }
      },
      {
        path: 'starter',
        loadChildren: () =>
          import('./pages/pages.routes').then((m) => m.PagesRoutes),
      },
      {
        path: 'dashboards',
        loadChildren: () =>
          import('./pages/dashboards/dashboards.routes').then(
            (m) => m.DashboardsRoutes
          ),
      },
      {
        path: 'ui-components',
        loadChildren: () =>
          import('./pages/ui-components/ui-components.routes').then(
            (m) => m.UiComponentsRoutes
          ),
      },
      {
        path: 'forms',
        loadChildren: () =>
          import('./pages/forms/forms.routes').then((m) => m.FormsRoutes),
      },
      {
        path: 'charts',
        loadChildren: () =>
          import('./pages/charts/charts.routes').then((m) => m.ChartsRoutes),
      },
      {
        path: 'apps',
        loadChildren: () =>
          import('./pages/apps/apps.routes').then((m) => m.AppsRoutes),
      },
      {
        path: 'widgets',
        loadChildren: () =>
          import('./pages/widgets/widgets.routes').then((m) => m.WidgetsRoutes),
      },
      {
        path: 'tables',
        loadChildren: () =>
          import('./pages/tables/tables.routes').then((m) => m.TablesRoutes),
      },
      {
        path: 'datatable',
        loadChildren: () =>
          import('./pages/datatable/datatable.routes').then(
            (m) => m.DatatablesRoutes
          ),
      },
      {
        path: 'theme-pages',
        loadChildren: () =>
          import('./pages/theme-pages/theme-pages.routes').then(
            (m) => m.ThemePagesRoutes
          ),
      },
    ],
  },
  {
    path: '',
    component: BlankComponent,
    children: [
      {
        path: 'authentication',
        loadChildren: () =>
          import('./pages/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes
          ),
      },
      {
        path: 'landingpage',
        loadChildren: () =>
          import('./pages/theme-pages/landingpage/landingpage.routes').then(
            (m) => m.LandingPageRoutes
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'authentication/error',
  },
];
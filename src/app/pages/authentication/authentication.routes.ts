import { Routes } from '@angular/router';
import { AppBoxedLoginComponent } from './pages/login/login.component';
import { AppBoxedRegisterComponent } from './pages/register/register.component';
import { AppErrorComponent } from './pages/error/error.component';
import { AppMaintenanceComponent } from './pages/maintenance/maintenance.component';
import { AuthGuard } from './guards/auth.guard';

export const AuthenticationRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'login',
        component: AppBoxedLoginComponent
      },
      {
        path: 'register',
        component: AppBoxedRegisterComponent
      },
      {
        path: 'error',
        component: AppErrorComponent
      },
      {
        path: 'maintenance',
        component: AppMaintenanceComponent
      }
    ]
  }
];
import { Routes } from '@angular/router';

// theme pages
import { AppAccountSettingComponent } from '../apps/account/components/account-setting/account-setting.component';
import { AppFaqComponent } from './faq/faq.component';
import { AppPricingComponent } from './pricing/pricing.component';
import { AppTreeviewComponent } from './treeview/treeview.component';

export const ThemePagesRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'account-setting',
        component: AppAccountSettingComponent,
        data: {
          title: 'Paramètres du compte',
          breadcrumb: true,
          urls: [],
        },
      },
      {
        path: 'faq',
        component: AppFaqComponent,
        data: {
          title: 'FAQ',
          breadcrumb: true,
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard1' },
            { title: 'FAQ' },
          ],
        },
      },
      {
        path: 'pricing',
        component: AppPricingComponent,
        data: {
          title: 'Pricing',
          breadcrumb: true,
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard1' },
            { title: 'Pricing' },
          ],
        },
      },
      {
        path: 'treeview',
        component: AppTreeviewComponent,
        data: {
          title: 'Treeview',
          breadcrumb: true,
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard1' },
            { title: 'Treeview' },
          ],
        },
      },
    ],
  },
];

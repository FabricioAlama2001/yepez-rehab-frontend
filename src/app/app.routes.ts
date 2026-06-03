import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './shared/layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('./features/patients/pages/patients-list/patients-list.component').then((m) => m.PatientsListComponent)
      },
      {
        path: 'patients/:id',
        loadComponent: () =>
          import('./features/patients/pages/patient-detail/patient-detail.component').then((m) => m.PatientDetailComponent)
      },
      {
        path: 'appointments',
        loadComponent: () =>
          import('./features/appointments/pages/appointments-agenda/appointments-agenda.component').then((m) => m.AppointmentsAgendaComponent)
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/pages/users-list/users-list.component').then((m) => m.UsersListComponent)
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

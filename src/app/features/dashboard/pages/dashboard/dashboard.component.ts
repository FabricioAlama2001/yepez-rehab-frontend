import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  readonly metrics = [
    {
      title: 'Pacientes registrados',
      value: 0,
      icon: 'pi pi-users'
    },
    {
      title: 'Citas del día',
      value: 0,
      icon: 'pi pi-calendar-clock'
    },
    {
      title: 'Citas canceladas',
      value: 0,
      icon: 'pi pi-times-circle'
    },
    {
      title: 'Citas atendidas',
      value: 0,
      icon: 'pi pi-check-circle'
    }
  ];
}

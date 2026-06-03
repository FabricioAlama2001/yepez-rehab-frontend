import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { forkJoin, finalize } from 'rxjs';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';

import { PatientsService } from '../../../../core/services/patients.service';
import { AppointmentsService } from '../../../../core/services/appointments.service';
import { Appointment } from '../../../../models/appointment.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardModule, MessageModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly patientsService = inject(PatientsService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  errorMessage = '';

  totalPatients = 0;
  todayAppointments = 0;
  cancelledAppointments = 0;
  attendedAppointments = 0;

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    const today = new Date().toISOString().slice(0, 10);

    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    forkJoin({
      patients: this.patientsService.getPatients(),
      appointments: this.appointmentsService.getAppointments(today)
    })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: ({ patients, appointments }) => {
          this.totalPatients = patients.length;
          this.todayAppointments = appointments.length;
          this.cancelledAppointments = this.countByStatus(appointments, 'CANCELLED');
          this.attendedAppointments = this.countByStatus(appointments, 'ATTENDED');
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'No se pudo cargar el resumen del dashboard.';
          this.cdr.markForCheck();
        }
      });
  }

  private countByStatus(appointments: Appointment[], status: string): number {
    return appointments.filter((appointment) => String(appointment.status).toUpperCase() === status).length;
  }
}

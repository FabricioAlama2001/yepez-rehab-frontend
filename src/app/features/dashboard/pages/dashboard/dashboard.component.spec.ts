import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { PatientsService } from '../../../../core/services/patients.service';
import { AppointmentsService } from '../../../../core/services/appointments.service';
import { Patient } from '../../../../models/patient.model';
import { Appointment } from '../../../../models/appointment.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  const patientsServiceMock = {
    getPatients: vi.fn()
  };

  const appointmentsServiceMock = {
    getAppointments: vi.fn()
  };

  const patients: Patient[] = [
    { id: 'patient-1', firstName: 'Ana', lastName: 'Pérez' } as Patient,
    { id: 'patient-2', firstName: 'Luis', lastName: 'Mora' } as Patient
  ];

  const appointments: Appointment[] = [
    {
      id: 'appointment-1',
      appointmentDate: '2026-07-13',
      startTime: '08:00',
      status: 'SCHEDULED'
    } as Appointment,
    {
      id: 'appointment-2',
      appointmentDate: '2026-07-13',
      startTime: '09:00',
      status: 'CANCELLED'
    } as Appointment,
    {
      id: 'appointment-3',
      appointmentDate: '2026-07-13',
      startTime: '10:00',
      status: 'ATTENDED'
    } as Appointment,
    {
      id: 'appointment-4',
      appointmentDate: '2026-07-13',
      startTime: '11:00',
      status: 'attended' as never
    } as Appointment
  ];

  beforeEach(async () => {
    vi.clearAllMocks();

    patientsServiceMock.getPatients.mockReturnValue(of(patients));
    appointmentsServiceMock.getAppointments.mockReturnValue(of(appointments));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        {
          provide: PatientsService,
          useValue: patientsServiceMock
        },
        {
          provide: AppointmentsService,
          useValue: appointmentsServiceMock
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create the dashboard component', () => {
    expect(component).toBeTruthy();
  });

  it('should load dashboard summary data', () => {
    component.loadDashboard();

    expect(patientsServiceMock.getPatients).toHaveBeenCalled();
    expect(appointmentsServiceMock.getAppointments).toHaveBeenCalled();

    expect(component.totalPatients).toBe(2);
    expect(component.todayAppointments).toBe(4);
    expect(component.cancelledAppointments).toBe(1);
    expect(component.attendedAppointments).toBe(2);
    expect(component.loading).toBe(false);
  });

  it('should show error message when dashboard data cannot be loaded', () => {
    patientsServiceMock.getPatients.mockReturnValue(throwError(() => new Error('Backend error')));

    component.loadDashboard();

    expect(component.errorMessage).toBe('No se pudo cargar el resumen del dashboard.');
    expect(component.loading).toBe(false);
  });
});

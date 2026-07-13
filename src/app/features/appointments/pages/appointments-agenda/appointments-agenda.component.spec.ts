import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { of } from 'rxjs';

import { AppointmentsAgendaComponent } from './appointments-agenda.component';
import { AppointmentsService } from '../../../../core/services/appointments.service';
import { PatientsService } from '../../../../core/services/patients.service';
import { UsersService } from '../../../../core/services/users.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Appointment } from '../../../../models/appointment.model';

describe('AppointmentsAgendaComponent', () => {
  let component: AppointmentsAgendaComponent;
  let fixture: ComponentFixture<AppointmentsAgendaComponent>;

  const appointmentsServiceMock = {
    getAppointments: vi.fn().mockReturnValue(of([])),
    createAppointment: vi.fn(),
    cancelAppointment: vi.fn(),
    rescheduleAppointment: vi.fn(),
    markAsAttended: vi.fn()
  };

  const patientsServiceMock = {
    getPatients: vi.fn().mockReturnValue(of([]))
  };

  const usersServiceMock = {
    getUsers: vi.fn().mockReturnValue(of([]))
  };

  const authServiceMock = {
    isAdmin: vi.fn().mockReturnValue(true),
    getCurrentUser: vi.fn().mockReturnValue({
      id: 'physio-1',
      firstName: 'Ana',
      lastName: 'Fisio',
      email: 'ana@test.com',
      role: 'PHYSIOTHERAPIST',
      isActive: true
    })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentsAgendaComponent],
      providers: [
        {
          provide: AppointmentsService,
          useValue: appointmentsServiceMock
        },
        {
          provide: PatientsService,
          useValue: patientsServiceMock
        },
        {
          provide: UsersService,
          useValue: usersServiceMock
        },
        {
          provide: AuthService,
          useValue: authServiceMock
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentsAgendaComponent);
    component = fixture.componentInstance;
  });

  it('should create the appointments agenda component', () => {
    expect(component).toBeTruthy();
  });

  it('should block an occupied time slot for the same date and physiotherapist', () => {
    component.form.appointmentDate = '2026-07-13';
    component.form.physiotherapistId = 'physio-1';

    component.appointments = [
      {
        id: 'appointment-1',
        appointmentDate: '2026-07-13T12:00:00.000Z',
        startTime: '08:00',
        status: 'SCHEDULED',
        physiotherapistId: 'physio-1'
      } as Appointment
    ];

    const availableSlots = component.getAvailableTimeSlotsForCreate();

    expect(availableSlots).not.toContain('08:00');
  });

  it('should keep a cancelled appointment slot available', () => {
    component.form.appointmentDate = '2026-07-13';
    component.form.physiotherapistId = 'physio-1';

    component.appointments = [
      {
        id: 'appointment-1',
        appointmentDate: '2026-07-13T12:00:00.000Z',
        startTime: '08:00',
        status: 'CANCELLED',
        physiotherapistId: 'physio-1'
      } as Appointment
    ];

    const availableSlots = component.getAvailableTimeSlotsForCreate();

    expect(availableSlots).toContain('08:00');
  });

  it('should not block the same time slot for a different physiotherapist', () => {
    component.form.appointmentDate = '2026-07-13';
    component.form.physiotherapistId = 'physio-2';

    component.appointments = [
      {
        id: 'appointment-1',
        appointmentDate: '2026-07-13T12:00:00.000Z',
        startTime: '08:00',
        status: 'SCHEDULED',
        physiotherapistId: 'physio-1'
      } as Appointment
    ];

    const availableSlots = component.getAvailableTimeSlotsForCreate();

    expect(availableSlots).toContain('08:00');
  });

  it('should return readable appointment status labels', () => {
    expect(component.getStatusLabel('SCHEDULED')).toBe('Programada');
    expect(component.getStatusLabel('CANCELLED')).toBe('Cancelada');
    expect(component.getStatusLabel('RESCHEDULED')).toBe('Reprogramada');
    expect(component.getStatusLabel('ATTENDED')).toBe('Atendida');
  });

  it('should prevent cancelling attended appointments', () => {
    const appointment = {
      id: 'appointment-1',
      appointmentDate: '2026-07-13T12:00:00.000Z',
      startTime: '08:00',
      status: 'ATTENDED',
      physiotherapistId: 'physio-1'
    } as Appointment;

    expect(component.canCancel(appointment)).toBe(false);
  });
});

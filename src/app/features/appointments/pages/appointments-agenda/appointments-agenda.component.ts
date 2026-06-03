import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';

import { AppointmentsService } from '../../../../core/services/appointments.service';
import { PatientsService } from '../../../../core/services/patients.service';
import { UsersService } from '../../../../core/services/users.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Appointment, AppointmentStatus } from '../../../../models/appointment.model';
import { CreateAppointmentRequest } from '../../../../models/create-appointment-request.model';
import { Patient } from '../../../../models/patient.model';
import { User } from '../../../../models/user.model';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
  selector: 'app-appointments-agenda',
  standalone: true,
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    TagModule
  ],
  templateUrl: './appointments-agenda.component.html',
  styleUrl: './appointments-agenda.component.scss'
})
export class AppointmentsAgendaComponent implements OnInit {
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly patientsService = inject(PatientsService);
  private readonly usersService = inject(UsersService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  appointments: Appointment[] = [];
  patients: Patient[] = [];
  physiotherapists: User[] = [];

  selectedDate = this.getToday();
  selectedAppointment: Appointment | null = null;

  loading = false;
  saving = false;
  actionLoadingId = '';

  appointmentDialogVisible = false;
  rescheduleDialogVisible = false;
  submitted = false;

  pageErrorMessage = '';
  dialogErrorMessage = '';
  successMessage = '';

  timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'];

  form: CreateAppointmentRequest = this.createEmptyForm();

  rescheduleForm = {
    appointmentDate: this.getToday(),
    startTime: ''
  };

  get isAdminUser(): boolean {
    return this.authService.isAdmin();
  }

  get isPhysiotherapistUser(): boolean {
    return this.authService.getCurrentUser()?.role === 'PHYSIOTHERAPIST';
  }

  ngOnInit(): void {
    this.loadCatalogs();
    this.loadAppointments();
  }

  loadCatalogs(): void {
    this.loadPatients();
    this.loadPhysiotherapists();
  }

  loadPatients(): void {
    this.patientsService.getPatients().subscribe({
      next: (patients) => {
        this.patients = [...patients];
        this.cdr.markForCheck();
      },
      error: () => {
        this.pageErrorMessage = 'No se pudo cargar el catálogo de pacientes.';
        this.cdr.markForCheck();
      }
    });
  }

  loadPhysiotherapists(): void {
    const currentUser = this.authService.getCurrentUser();

    if (!this.isAdminUser) {
      this.physiotherapists = currentUser?.role === 'PHYSIOTHERAPIST' ? [currentUser] : [];
      this.cdr.markForCheck();
      return;
    }

    this.usersService.getUsers().subscribe({
      next: (users) => {
        this.physiotherapists = users.filter((user) => user.role === 'PHYSIOTHERAPIST');
        this.cdr.markForCheck();
      },
      error: () => {
        this.pageErrorMessage = 'No se pudo cargar el catálogo de fisioterapeutas.';
        this.cdr.markForCheck();
      }
    });
  }

  loadAppointments(): void {
    this.loading = true;
    this.pageErrorMessage = '';
    this.cdr.markForCheck();

    this.appointmentsService.getAppointments(this.selectedDate)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (appointments) => {
          this.appointments = [...appointments];
          this.cdr.markForCheck();
        },
        error: () => {
          this.pageErrorMessage = 'No se pudo cargar la agenda de citas.';
          this.cdr.markForCheck();
        }
      });
  }

  onDateChange(): void {
    this.loadAppointments();
  }

  openCreateDialog(): void {
    const currentUser = this.authService.getCurrentUser();

    this.form = {
      ...this.createEmptyForm(),
      appointmentDate: this.selectedDate,
      physiotherapistId: currentUser?.role === 'PHYSIOTHERAPIST' ? currentUser.id : ''
    };

    this.submitted = false;
    this.dialogErrorMessage = '';
    this.successMessage = '';
    this.appointmentDialogVisible = true;
    this.cdr.markForCheck();
  }

  closeCreateDialog(): void {
    if (this.saving) {
      return;
    }

    this.appointmentDialogVisible = false;
    this.submitted = false;
    this.dialogErrorMessage = '';
  }

  onCreateScheduleContextChange(): void {
    const availableSlots = this.getAvailableTimeSlotsForCreate();

    if (this.form.startTime && !availableSlots.includes(this.form.startTime)) {
      this.form.startTime = '';
    }
  }

  saveAppointment(): void {
    this.submitted = true;
    this.dialogErrorMessage = '';
    this.successMessage = '';

    if (this.isAppointmentFormInvalid()) {
      this.dialogErrorMessage = 'Complete todos los campos obligatorios antes de guardar.';
      this.cdr.markForCheck();
      return;
    }

    if (!this.getAvailableTimeSlotsForCreate().includes(this.form.startTime)) {
      this.dialogErrorMessage = 'El horario seleccionado ya no está disponible.';
      this.form.startTime = '';
      this.cdr.markForCheck();
      return;
    }

    const payload: CreateAppointmentRequest = {
      patientId: this.form.patientId,
      physiotherapistId: this.form.physiotherapistId,
      appointmentDate: this.toIsoDate(this.form.appointmentDate),
      startTime: this.form.startTime,
      notes: this.form.notes?.trim()
    };

    this.saving = true;
    this.cdr.markForCheck();

    this.appointmentsService.createAppointment(payload)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (createdAppointment) => {
          this.appointments = [createdAppointment, ...this.appointments];
          this.appointmentDialogVisible = false;
          this.submitted = false;
          this.form = this.createEmptyForm();
          this.successMessage = 'Cita registrada correctamente.';
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.dialogErrorMessage = this.getBackendErrorMessage(error, 'No se pudo registrar la cita.');
          this.cdr.markForCheck();
        }
      });
  }

  openRescheduleDialog(appointment: Appointment): void {
    this.selectedAppointment = appointment;

    this.rescheduleForm = {
      appointmentDate: this.getAppointmentDateInput(appointment),
      startTime: this.normalizeTime(appointment.startTime)
    };

    this.dialogErrorMessage = '';
    this.successMessage = '';
    this.rescheduleDialogVisible = true;
    this.cdr.markForCheck();
  }

  closeRescheduleDialog(): void {
    if (this.saving) {
      return;
    }

    this.rescheduleDialogVisible = false;
    this.selectedAppointment = null;
    this.dialogErrorMessage = '';
  }

  onRescheduleContextChange(): void {
    const availableSlots = this.getAvailableTimeSlotsForReschedule();

    if (this.rescheduleForm.startTime && !availableSlots.includes(this.rescheduleForm.startTime)) {
      this.rescheduleForm.startTime = '';
    }
  }

  rescheduleAppointment(): void {
    this.dialogErrorMessage = '';
    this.successMessage = '';

    if (!this.selectedAppointment || !this.rescheduleForm.appointmentDate || !this.rescheduleForm.startTime) {
      this.dialogErrorMessage = 'Seleccione nueva fecha y hora.';
      this.cdr.markForCheck();
      return;
    }

    const physiotherapistId = this.getAppointmentPhysiotherapistId(this.selectedAppointment);

    if (!physiotherapistId) {
      this.dialogErrorMessage = 'No se pudo identificar el fisioterapeuta de la cita.';
      this.cdr.markForCheck();
      return;
    }

    if (!this.getAvailableTimeSlotsForReschedule().includes(this.rescheduleForm.startTime)) {
      this.dialogErrorMessage = 'El horario seleccionado ya no está disponible.';
      this.rescheduleForm.startTime = '';
      this.cdr.markForCheck();
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();

    this.appointmentsService.rescheduleAppointment(this.selectedAppointment.id, {
      appointmentDate: this.toIsoDate(this.rescheduleForm.appointmentDate),
      startTime: this.rescheduleForm.startTime,
      physiotherapistId
    })
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (updatedAppointment) => {
          if (this.getAppointmentDateInput(updatedAppointment) === this.selectedDate) {
            this.appointments = this.appointments.map((appointment) =>
              appointment.id === updatedAppointment.id ? updatedAppointment : appointment
            );
          } else {
            this.appointments = this.appointments.filter((appointment) => appointment.id !== updatedAppointment.id);
          }

          this.rescheduleDialogVisible = false;
          this.selectedAppointment = null;
          this.successMessage = 'Cita reprogramada correctamente.';
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.dialogErrorMessage = this.getBackendErrorMessage(error, 'No se pudo reprogramar la cita.');
          this.cdr.markForCheck();
        }
      });
  }

  cancelAppointment(appointment: Appointment): void {
    this.actionLoadingId = appointment.id;
    this.pageErrorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    this.appointmentsService.cancelAppointment(appointment.id)
      .pipe(
        finalize(() => {
          this.actionLoadingId = '';
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (updatedAppointment) => {
          this.appointments = this.appointments.map((item) =>
            item.id === updatedAppointment.id ? updatedAppointment : item
          );
          this.successMessage = 'Cita cancelada correctamente. El horario queda disponible.';
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.pageErrorMessage = this.getBackendErrorMessage(error, 'No se pudo cancelar la cita.');
          this.cdr.markForCheck();
        }
      });
  }

  markAsAttended(appointment: Appointment): void {
    this.actionLoadingId = appointment.id;
    this.pageErrorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    this.appointmentsService.markAsAttended(appointment.id)
      .pipe(
        finalize(() => {
          this.actionLoadingId = '';
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (updatedAppointment) => {
          this.appointments = this.appointments.map((item) =>
            item.id === updatedAppointment.id ? updatedAppointment : item
          );
          this.successMessage = 'Cita marcada como atendida.';
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.pageErrorMessage = this.getBackendErrorMessage(error, 'No se pudo marcar la cita como atendida.');
          this.cdr.markForCheck();
        }
      });
  }

  getAvailableTimeSlotsForCreate(): string[] {
    return this.getAvailableTimeSlots(this.form.appointmentDate, this.form.physiotherapistId);
  }

  getAvailableTimeSlotsForReschedule(): string[] {
    if (!this.selectedAppointment) {
      return [...this.timeSlots];
    }

    const physiotherapistId = this.getAppointmentPhysiotherapistId(this.selectedAppointment);

    return this.getAvailableTimeSlots(
      this.rescheduleForm.appointmentDate,
      physiotherapistId,
      this.selectedAppointment.id
    );
  }

  isFieldInvalid(field: keyof CreateAppointmentRequest): boolean {
    const value = this.form[field];
    return this.submitted && !String(value ?? '').trim();
  }

  getAppointmentTime(appointment: Appointment): string {
    return this.normalizeTime(appointment.startTime);
  }

  getAppointmentDateInput(appointment: Appointment): string {
    return appointment.appointmentDate ? appointment.appointmentDate.slice(0, 10) : this.selectedDate;
  }

  getPatientName(appointment: Appointment): string {
    if (appointment.patient) {
      return `${appointment.patient.firstName ?? ''} ${appointment.patient.lastName ?? ''}`.trim();
    }

    return appointment.patientId ?? 'No registrado';
  }

  getPhysiotherapistName(appointment: Appointment): string {
    const user = appointment.physiotherapist;

    if (user) {
      return user.fullName || user.name || user.email;
    }

    return appointment.physiotherapistId ?? 'No registrado';
  }

  getStatusLabel(status: AppointmentStatus): string {
    const normalizedStatus = String(status).toUpperCase();

    if (normalizedStatus === 'SCHEDULED') return 'Programada';
    if (normalizedStatus === 'CANCELLED') return 'Cancelada';
    if (normalizedStatus === 'RESCHEDULED') return 'Reprogramada';
    if (normalizedStatus === 'ATTENDED') return 'Atendida';

    return status;
  }

  getStatusSeverity(status: AppointmentStatus): TagSeverity {
    const normalizedStatus = String(status).toUpperCase();

    if (normalizedStatus === 'SCHEDULED') return 'info';
    if (normalizedStatus === 'CANCELLED') return 'danger';
    if (normalizedStatus === 'RESCHEDULED') return 'warn';
    if (normalizedStatus === 'ATTENDED') return 'success';

    return 'secondary';
  }

  canCancel(appointment: Appointment): boolean {
    const status = String(appointment.status).toUpperCase();
    return status !== 'CANCELLED' && status !== 'ATTENDED';
  }

  canAttend(appointment: Appointment): boolean {
    const status = String(appointment.status).toUpperCase();
    return status !== 'CANCELLED' && status !== 'ATTENDED';
  }

  private getAvailableTimeSlots(date: string, physiotherapistId: string, excludedAppointmentId?: string): string[] {
    if (!date || !physiotherapistId) {
      return [...this.timeSlots];
    }

    const dateKey = date.slice(0, 10);

    const occupiedSlots = new Set(
      this.appointments
        .filter((appointment) => appointment.id !== excludedAppointmentId)
        .filter((appointment) => this.isSlotBlockingStatus(appointment.status))
        .filter((appointment) => this.getAppointmentDateInput(appointment) === dateKey)
        .filter((appointment) => this.getAppointmentPhysiotherapistId(appointment) === physiotherapistId)
        .map((appointment) => this.normalizeTime(appointment.startTime))
    );

    return this.timeSlots.filter((slot) => !occupiedSlots.has(slot));
  }

  private getAppointmentPhysiotherapistId(appointment: Appointment): string {
    if (appointment.physiotherapist?.id) {
      return appointment.physiotherapist.id;
    }

    if (appointment.physiotherapistId) {
      return appointment.physiotherapistId;
    }

    const currentUser = this.authService.getCurrentUser();

    if (currentUser?.role === 'PHYSIOTHERAPIST') {
      return currentUser.id;
    }

    return '';
  }

  private isSlotBlockingStatus(status: AppointmentStatus): boolean {
    return String(status).toUpperCase() !== 'CANCELLED';
  }

  private isAppointmentFormInvalid(): boolean {
    return (
      !this.form.patientId ||
      !this.form.physiotherapistId ||
      !this.form.appointmentDate ||
      !this.form.startTime
    );
  }

  private normalizeTime(time?: string): string {
    if (!time) {
      return '';
    }

    return time.slice(0, 5);
  }

  private toIsoDate(date: string): string {
    return `${date.slice(0, 10)}T12:00:00.000Z`;
  }

  private getBackendErrorMessage(error: HttpErrorResponse, fallbackMessage: string): string {
    const backendMessage = error.error?.message;

    if (Array.isArray(backendMessage)) {
      return backendMessage.join(', ');
    }

    if (typeof backendMessage === 'string') {
      return backendMessage;
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el backend.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para realizar esta acción.';
    }

    return fallbackMessage;
  }

  private createEmptyForm(): CreateAppointmentRequest {
    return {
      patientId: '',
      physiotherapistId: '',
      appointmentDate: this.selectedDate,
      startTime: '',
      notes: ''
    };
  }

  private getToday(): string {
    return new Date().toISOString().slice(0, 10);
  }
}

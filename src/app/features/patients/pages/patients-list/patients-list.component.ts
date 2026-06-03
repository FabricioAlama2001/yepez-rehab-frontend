import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';

import { PatientsService } from '../../../../core/services/patients.service';
import { Patient } from '../../../../models/patient.model';
import { CreatePatientRequest } from '../../../../models/create-patient-request.model';

@Component({
  selector: 'app-patients-list',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    TagModule
  ],
  templateUrl: './patients-list.component.html',
  styleUrl: './patients-list.component.scss'
})
export class PatientsListComponent implements OnInit {
  private readonly patientsService = inject(PatientsService);
  private readonly cdr = inject(ChangeDetectorRef);

  patients: Patient[] = [];
  selectedPatient: Patient | null = null;

  loading = false;
  saving = false;
  dialogVisible = false;
  submitted = false;

  pageErrorMessage = '';
  dialogErrorMessage = '';
  successMessage = '';

  form: CreatePatientRequest = this.createEmptyForm();

  get isEditMode(): boolean {
    return !!this.selectedPatient;
  }

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.loading = true;
    this.pageErrorMessage = '';
    this.cdr.markForCheck();

    this.patientsService.getPatients()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (patients) => {
          this.patients = [...patients];
          this.cdr.markForCheck();
        },
        error: () => {
          this.pageErrorMessage = 'No se pudo cargar el listado de pacientes.';
          this.cdr.markForCheck();
        }
      });
  }

  openCreateDialog(): void {
    this.selectedPatient = null;
    this.form = this.createEmptyForm();
    this.resetDialogState();
    this.dialogVisible = true;
  }

  openEditDialog(patient: Patient): void {
    this.selectedPatient = patient;
    this.form = {
      firstName: patient.firstName ?? '',
      lastName: patient.lastName ?? '',
      identification: patient.identification ?? '',
      phone: patient.phone ?? '',
      email: patient.email ?? '',
      birthDate: patient.birthDate ?? ''
    };

    this.resetDialogState();
    this.dialogVisible = true;
  }

  closeDialog(): void {
    if (this.saving) {
      return;
    }

    this.dialogVisible = false;
    this.submitted = false;
    this.dialogErrorMessage = '';
  }

  savePatient(): void {
    this.submitted = true;
    this.dialogErrorMessage = '';
    this.successMessage = '';

    if (this.isFormInvalid()) {
      this.dialogErrorMessage = 'Complete todos los campos obligatorios antes de guardar.';
      this.cdr.markForCheck();
      return;
    }

    const payload = this.buildPayload();

    this.saving = true;
    this.cdr.markForCheck();

    const request$ = this.isEditMode && this.selectedPatient
      ? this.patientsService.updatePatient(this.selectedPatient.id, payload)
      : this.patientsService.createPatient(payload);

    request$
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (savedPatient) => {
          if (this.isEditMode) {
            this.patients = this.patients.map((patient) =>
              patient.id === savedPatient.id ? savedPatient : patient
            );
            this.successMessage = 'Paciente actualizado correctamente.';
          } else {
            this.patients = [savedPatient, ...this.patients];
            this.successMessage = 'Paciente registrado correctamente.';
          }

          this.dialogVisible = false;
          this.submitted = false;
          this.selectedPatient = null;
          this.form = this.createEmptyForm();
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.dialogErrorMessage = this.getBackendErrorMessage(error);
          this.cdr.markForCheck();
        }
      });
  }

  isFieldInvalid(field: keyof CreatePatientRequest): boolean {
    const value = this.form[field];
    return this.submitted && !String(value ?? '').trim();
  }

  getFullName(patient: Patient): string {
    return `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim();
  }

  private resetDialogState(): void {
    this.submitted = false;
    this.pageErrorMessage = '';
    this.dialogErrorMessage = '';
    this.successMessage = '';
  }

  private buildPayload(): CreatePatientRequest {
    return {
      firstName: this.form.firstName.trim(),
      lastName: this.form.lastName.trim(),
      identification: this.form.identification?.trim(),
      phone: this.form.phone?.trim(),
      email: this.form.email?.trim(),
      birthDate: this.form.birthDate
    };
  }

  private isFormInvalid(): boolean {
    return (
      !this.form.firstName?.trim() ||
      !this.form.lastName?.trim() ||
      !this.form.identification?.trim() ||
      !this.form.phone?.trim() ||
      !this.form.email?.trim() ||
      !this.form.birthDate?.trim()
    );
  }

  private getBackendErrorMessage(error: HttpErrorResponse): string {
    const backendMessage = error.error?.message;

    if (Array.isArray(backendMessage)) {
      return backendMessage.join(', ');
    }

    if (typeof backendMessage === 'string') {
      return backendMessage;
    }

    if (error.status === 409) {
      return 'Ya existe un paciente con esos datos.';
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el backend.';
    }

    return this.isEditMode
      ? 'No se pudo actualizar el paciente.'
      : 'No se pudo registrar el paciente. Revise los datos ingresados.';
  }

  private createEmptyForm(): CreatePatientRequest {
    return {
      firstName: '',
      lastName: '',
      identification: '',
      phone: '',
      email: '',
      birthDate: ''
    };
  }
}

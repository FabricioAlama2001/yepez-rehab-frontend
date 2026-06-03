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

import { PatientsService } from '../../../../core/services/patients.service';
import { Patient } from '../../../../models/patient.model';
import { CreatePatientRequest } from '../../../../models/create-patient-request.model';

@Component({
  selector: 'app-patients-list',
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
  templateUrl: './patients-list.component.html',
  styleUrl: './patients-list.component.scss'
})
export class PatientsListComponent implements OnInit {
  private readonly patientsService = inject(PatientsService);
  private readonly cdr = inject(ChangeDetectorRef);

  patients: Patient[] = [];
  loading = false;
  saving = false;

  dialogVisible = false;
  submitted = false;

  pageErrorMessage = '';
  dialogErrorMessage = '';
  successMessage = '';

  form: CreatePatientRequest = this.createEmptyForm();

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
    this.form = this.createEmptyForm();
    this.submitted = false;
    this.pageErrorMessage = '';
    this.dialogErrorMessage = '';
    this.successMessage = '';
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

    const payload: CreatePatientRequest = {
      firstName: this.form.firstName.trim(),
      lastName: this.form.lastName.trim(),
      identification: this.form.identification?.trim(),
      phone: this.form.phone?.trim(),
      email: this.form.email?.trim(),
      birthDate: this.form.birthDate
    };

    this.saving = true;
    this.cdr.markForCheck();

    this.patientsService.createPatient(payload)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (createdPatient) => {
          this.patients = [createdPatient, ...this.patients];
          this.dialogVisible = false;
          this.submitted = false;
          this.form = this.createEmptyForm();
          this.successMessage = 'Paciente registrado correctamente.';
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

    return 'No se pudo registrar el paciente. Revise los datos ingresados.';
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

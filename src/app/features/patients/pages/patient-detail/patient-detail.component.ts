import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';

import { PatientsService } from '../../../../core/services/patients.service';
import { Patient } from '../../../../models/patient.model';
import { InitialRecord } from '../../../../models/initial-record.model';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, ButtonModule, MessageModule, TagModule],
  templateUrl: './patient-detail.component.html',
  styleUrl: './patient-detail.component.scss'
})
export class PatientDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly patientsService = inject(PatientsService);
  private readonly cdr = inject(ChangeDetectorRef);

  patientId = '';
  patient: Patient | null = null;

  loadingPatient = false;
  loadingRecord = false;
  savingRecord = false;

  hasInitialRecord = false;

  pageErrorMessage = '';
  recordErrorMessage = '';
  successMessage = '';

  recordForm: InitialRecord = this.createEmptyRecord();

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id') ?? '';

    if (!this.patientId) {
      this.pageErrorMessage = 'No se encontró el identificador del paciente.';
      return;
    }

    this.loadPatient();
    this.loadInitialRecord();
  }

  loadPatient(): void {
    this.loadingPatient = true;
    this.pageErrorMessage = '';
    this.cdr.markForCheck();

    this.patientsService.getPatientById(this.patientId)
      .pipe(
        finalize(() => {
          this.loadingPatient = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (patient) => {
          this.patient = patient;
          this.cdr.markForCheck();
        },
        error: () => {
          this.pageErrorMessage = 'No se pudo cargar la información del paciente.';
          this.cdr.markForCheck();
        }
      });
  }

  loadInitialRecord(): void {
    this.loadingRecord = true;
    this.recordErrorMessage = '';
    this.cdr.markForCheck();

    this.patientsService.getInitialRecord(this.patientId)
      .pipe(
        finalize(() => {
          this.loadingRecord = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (record) => {
          this.hasInitialRecord = true;
          this.recordForm = {
            ...this.createEmptyRecord(),
            ...record
          };
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.hasInitialRecord = false;
          this.recordForm = this.createEmptyRecord();

          if (error.status !== 404) {
            this.recordErrorMessage = 'No se pudo cargar la ficha inicial.';
          }

          this.cdr.markForCheck();
        }
      });
  }

  saveInitialRecord(): void {
    this.recordErrorMessage = '';
    this.successMessage = '';

    if (!this.recordForm.painDescription?.trim()) {
      this.recordErrorMessage = 'La descripción del dolor es obligatoria.';
      this.cdr.markForCheck();
      return;
    }

    const payload: InitialRecord = {
      painDescription: this.recordForm.painDescription?.trim(),
      medicalHistory: this.recordForm.medicalHistory?.trim(),
      allergies: this.recordForm.allergies?.trim(),
      currentMedication: this.recordForm.currentMedication?.trim(),
      previousTherapy: this.recordForm.previousTherapy?.trim()
    };

    this.savingRecord = true;
    this.cdr.markForCheck();

    const request$ = this.hasInitialRecord
      ? this.patientsService.updateInitialRecord(this.patientId, payload)
      : this.patientsService.createInitialRecord(this.patientId, payload);

    request$
      .pipe(
        finalize(() => {
          this.savingRecord = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (record) => {
          this.hasInitialRecord = true;
          this.recordForm = {
            ...this.createEmptyRecord(),
            ...record
          };
          this.successMessage = 'Ficha inicial guardada correctamente.';
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.recordErrorMessage = this.getBackendErrorMessage(error);
          this.cdr.markForCheck();
        }
      });
  }

  getFullName(): string {
    if (!this.patient) {
      return '';
    }

    return `${this.patient.firstName ?? ''} ${this.patient.lastName ?? ''}`.trim();
  }

  private getBackendErrorMessage(error: HttpErrorResponse): string {
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

    return 'No se pudo guardar la ficha inicial.';
  }

  private createEmptyRecord(): InitialRecord {
    return {
      painDescription: '',
      medicalHistory: '',
      allergies: '',
      currentMedication: '',
      previousTherapy: ''
    };
  }
}

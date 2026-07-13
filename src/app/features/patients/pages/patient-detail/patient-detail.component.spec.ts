import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { PatientDetailComponent } from './patient-detail.component';
import { PatientsService } from '../../../../core/services/patients.service';
import { Patient } from '../../../../models/patient.model';
import { InitialRecord } from '../../../../models/initial-record.model';

describe('PatientDetailComponent', () => {
  let component: PatientDetailComponent;
  let fixture: ComponentFixture<PatientDetailComponent>;

  const patientsServiceMock = {
    getPatientById: vi.fn(),
    getInitialRecord: vi.fn(),
    createInitialRecord: vi.fn(),
    updateInitialRecord: vi.fn()
  };

  const patient: Patient = {
    id: 'patient-1',
    firstName: 'María',
    lastName: 'López',
    identification: '1102030405',
    phone: '0988888888',
    email: 'maria@test.com',
    birthDate: '1995-05-10'
  } as Patient;

  const initialRecord: InitialRecord = {
    painDescription: 'Dolor lumbar',
    medicalHistory: 'Sin antecedentes',
    allergies: 'Ninguna',
    currentMedication: 'Ninguna',
    previousTherapy: 'No'
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    patientsServiceMock.getPatientById.mockReturnValue(of(patient));
    patientsServiceMock.getInitialRecord.mockReturnValue(of(initialRecord));
    patientsServiceMock.createInitialRecord.mockReturnValue(of(initialRecord));
    patientsServiceMock.updateInitialRecord.mockReturnValue(of(initialRecord));

    await TestBed.configureTestingModule({
      imports: [PatientDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({
                id: 'patient-1'
              })
            }
          }
        },
        {
          provide: PatientsService,
          useValue: patientsServiceMock
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PatientDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create the patient detail component', () => {
    expect(component).toBeTruthy();
  });

  it('should load patient id from route and request patient data on init', () => {
    component.ngOnInit();

    expect(component.patientId).toBe('patient-1');
    expect(patientsServiceMock.getPatientById).toHaveBeenCalledWith('patient-1');
    expect(patientsServiceMock.getInitialRecord).toHaveBeenCalledWith('patient-1');
  });

  it('should return empty full name when patient is not loaded', () => {
    component.patient = null;

    expect(component.getFullName()).toBe('');
  });

  it('should return patient full name when patient is loaded', () => {
    component.patient = patient;

    expect(component.getFullName()).toBe('María López');
  });

  it('should show validation error when pain description is empty', () => {
    component.recordForm = {
      painDescription: '',
      medicalHistory: '',
      allergies: '',
      currentMedication: '',
      previousTherapy: ''
    };

    component.saveInitialRecord();

    expect(component.recordErrorMessage).toBe('La descripción del dolor es obligatoria.');
    expect(patientsServiceMock.createInitialRecord).not.toHaveBeenCalled();
  });

  it('should create initial record when patient does not have one', () => {
    component.patientId = 'patient-1';
    component.hasInitialRecord = false;
    component.recordForm = {
      painDescription: ' Dolor de rodilla ',
      medicalHistory: ' Lesión previa ',
      allergies: ' Ninguna ',
      currentMedication: ' Ibuprofeno ',
      previousTherapy: ' Sí '
    };

    component.saveInitialRecord();

    expect(patientsServiceMock.createInitialRecord).toHaveBeenCalledWith('patient-1', {
      painDescription: 'Dolor de rodilla',
      medicalHistory: 'Lesión previa',
      allergies: 'Ninguna',
      currentMedication: 'Ibuprofeno',
      previousTherapy: 'Sí'
    });
    expect(component.successMessage).toBe('Ficha inicial guardada correctamente.');
  });

  it('should update initial record when patient already has one', () => {
    component.patientId = 'patient-1';
    component.hasInitialRecord = true;
    component.recordForm = {
      painDescription: ' Dolor cervical ',
      medicalHistory: '',
      allergies: '',
      currentMedication: '',
      previousTherapy: ''
    };

    component.saveInitialRecord();

    expect(patientsServiceMock.updateInitialRecord).toHaveBeenCalledWith('patient-1', {
      painDescription: 'Dolor cervical',
      medicalHistory: '',
      allergies: '',
      currentMedication: '',
      previousTherapy: ''
    });
  });

  it('should ignore 404 error when initial record does not exist', () => {
    const notFoundError = new HttpErrorResponse({
      status: 404
    });

    patientsServiceMock.getInitialRecord.mockReturnValue(throwError(() => notFoundError));

    component.patientId = 'patient-1';
    component.loadInitialRecord();

    expect(component.hasInitialRecord).toBe(false);
    expect(component.recordErrorMessage).toBe('');
  });

  it('should show backend connection error when saving record fails with status 0', () => {
    const connectionError = new HttpErrorResponse({
      status: 0
    });

    patientsServiceMock.createInitialRecord.mockReturnValue(throwError(() => connectionError));

    component.patientId = 'patient-1';
    component.hasInitialRecord = false;
    component.recordForm = {
      painDescription: 'Dolor lumbar',
      medicalHistory: '',
      allergies: '',
      currentMedication: '',
      previousTherapy: ''
    };

    component.saveInitialRecord();

    expect(component.recordErrorMessage).toBe('No se pudo conectar con el backend.');
  });
});

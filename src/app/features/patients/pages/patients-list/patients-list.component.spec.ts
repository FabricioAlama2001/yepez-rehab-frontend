import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { PatientsListComponent } from './patients-list.component';
import { PatientsService } from '../../../../core/services/patients.service';
import { Patient } from '../../../../models/patient.model';

describe('PatientsListComponent', () => {
  let component: PatientsListComponent;
  let fixture: ComponentFixture<PatientsListComponent>;

  const patientsServiceMock = {
    getPatients: vi.fn(),
    createPatient: vi.fn(),
    updatePatient: vi.fn()
  };

  const patient: Patient = {
    id: 'patient-1',
    firstName: 'Carlos',
    lastName: 'Yépez',
    identification: '0102030405',
    phone: '0999999999',
    email: 'carlos@test.com',
    birthDate: '1990-01-01'
  } as Patient;

  beforeEach(async () => {
    vi.clearAllMocks();

    patientsServiceMock.getPatients.mockReturnValue(of([]));
    patientsServiceMock.createPatient.mockReturnValue(of(patient));
    patientsServiceMock.updatePatient.mockReturnValue(of(patient));

    await TestBed.configureTestingModule({
      imports: [PatientsListComponent],
      providers: [
        provideRouter([]),
        {
          provide: PatientsService,
          useValue: patientsServiceMock
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PatientsListComponent);
    component = fixture.componentInstance;
  });

  it('should create the patients list component', () => {
    expect(component).toBeTruthy();
  });

  it('should load patients from service', () => {
    patientsServiceMock.getPatients.mockReturnValue(of([patient]));

    component.loadPatients();

    expect(patientsServiceMock.getPatients).toHaveBeenCalled();
    expect(component.patients.length).toBe(1);
    expect(component.patients[0].firstName).toBe('Carlos');
  });

  it('should show error message when patients cannot be loaded', () => {
    patientsServiceMock.getPatients.mockReturnValue(throwError(() => new Error('Backend error')));

    component.loadPatients();

    expect(component.pageErrorMessage).toBe('No se pudo cargar el listado de pacientes.');
  });

  it('should open create dialog with empty form', () => {
    component.openCreateDialog();

    expect(component.dialogVisible).toBe(true);
    expect(component.selectedPatient).toBeNull();
    expect(component.form.firstName).toBe('');
    expect(component.form.lastName).toBe('');
  });

  it('should open edit dialog with patient data', () => {
    component.openEditDialog(patient);

    expect(component.dialogVisible).toBe(true);
    expect(component.selectedPatient?.id).toBe('patient-1');
    expect(component.form.firstName).toBe('Carlos');
    expect(component.form.lastName).toBe('Yépez');
    expect(component.form.identification).toBe('0102030405');
  });

  it('should detect invalid required field after submit', () => {
    component.submitted = true;
    component.form.firstName = '';

    expect(component.isFieldInvalid('firstName')).toBe(true);
  });

  it('should return patient full name', () => {
    expect(component.getFullName(patient)).toBe('Carlos Yépez');
  });

  it('should not save patient when form is invalid', () => {
    component.form = {
      firstName: '',
      lastName: '',
      identification: '',
      phone: '',
      email: '',
      birthDate: ''
    };

    component.savePatient();

    expect(component.dialogErrorMessage).toBe('Complete todos los campos obligatorios antes de guardar.');
    expect(patientsServiceMock.createPatient).not.toHaveBeenCalled();
  });

  it('should create patient when form is valid and not in edit mode', () => {
    component.form = {
      firstName: ' Carlos ',
      lastName: ' Yépez ',
      identification: ' 0102030405 ',
      phone: ' 0999999999 ',
      email: ' carlos@test.com ',
      birthDate: '1990-01-01'
    };

    component.savePatient();

    expect(patientsServiceMock.createPatient).toHaveBeenCalledWith({
      firstName: 'Carlos',
      lastName: 'Yépez',
      identification: '0102030405',
      phone: '0999999999',
      email: 'carlos@test.com',
      birthDate: '1990-01-01'
    });
    expect(component.successMessage).toBe('Paciente registrado correctamente.');
  });

  it('should show duplicated patient message when backend returns conflict', () => {
    const conflictError = new HttpErrorResponse({
      status: 409,
      error: {}
    });

    patientsServiceMock.createPatient.mockReturnValue(throwError(() => conflictError));

    component.form = {
      firstName: 'Carlos',
      lastName: 'Yépez',
      identification: '0102030405',
      phone: '0999999999',
      email: 'carlos@test.com',
      birthDate: '1990-01-01'
    };

    component.savePatient();

    expect(component.dialogErrorMessage).toBe('Ya existe un paciente con esos datos.');
  });
});

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Patient } from '../../models/patient.model';
import { CreatePatientRequest } from '../../models/create-patient-request.model';
import { InitialRecord } from '../../models/initial-record.model';

@Injectable({
  providedIn: 'root'
})
export class PatientsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/patients`;

  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.apiUrl);
  }

  getPatientById(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/${id}`);
  }

  createPatient(payload: CreatePatientRequest): Observable<Patient> {
    return this.http.post<Patient>(this.apiUrl, payload);
  }

  updatePatient(id: number, payload: Partial<CreatePatientRequest>): Observable<Patient> {
    return this.http.put<Patient>(`${this.apiUrl}/${id}`, payload);
  }

  createInitialRecord(patientId: number, payload: InitialRecord): Observable<InitialRecord> {
    return this.http.post<InitialRecord>(`${this.apiUrl}/${patientId}/initial-record`, payload);
  }

  getInitialRecord(patientId: number): Observable<InitialRecord> {
    return this.http.get<InitialRecord>(`${this.apiUrl}/${patientId}/initial-record`);
  }

  updateInitialRecord(patientId: number, payload: InitialRecord): Observable<InitialRecord> {
    return this.http.put<InitialRecord>(`${this.apiUrl}/${patientId}/initial-record`, payload);
  }
}

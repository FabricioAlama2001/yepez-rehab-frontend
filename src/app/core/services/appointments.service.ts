import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Appointment } from '../../models/appointment.model';
import { CreateAppointmentRequest } from '../../models/create-appointment-request.model';

export interface RescheduleAppointmentRequest {
  appointmentDate: string;
  startTime: string;
  physiotherapistId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/appointments`;

  getAppointments(date?: string): Observable<Appointment[]> {
    let params = new HttpParams();

    if (date) {
      params = params.set('date', date);
    }

    return this.http.get<Appointment[]>(this.apiUrl, { params });
  }

  getAppointmentById(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/${id}`);
  }

  createAppointment(payload: CreateAppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, payload);
  }

  cancelAppointment(id: string): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/${id}/cancel`, {});
  }

  rescheduleAppointment(id: string, payload: RescheduleAppointmentRequest): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/${id}/reschedule`, payload);
  }

  markAsAttended(id: string): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/${id}/attended`, {});
  }
}

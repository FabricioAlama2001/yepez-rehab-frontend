import { Patient } from './patient.model';
import { User } from './user.model';

export type AppointmentStatus = 'SCHEDULED' | 'CANCELLED' | 'RESCHEDULED' | 'ATTENDED';

export interface Appointment {
  id: string;
  appointmentDate: string;
  startTime: string;
  status: AppointmentStatus;
  patient?: Patient;
  patientId?: string;
  physiotherapist?: User;
  physiotherapistId?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

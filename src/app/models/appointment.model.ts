import { Patient } from './patient.model';
import { User } from './user.model';

export type AppointmentStatus = 'SCHEDULED' | 'CANCELLED' | 'RESCHEDULED' | 'ATTENDED';

export interface Appointment {
  id: number;
  date: string;
  time: string;
  status: AppointmentStatus;
  patient?: Patient;
  patientId?: number;
  physiotherapist?: User;
  physiotherapistId?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAppointmentRequest {
  patientId: number;
  physiotherapistId: number;
  date: string;
  time: string;
  notes?: string;
}

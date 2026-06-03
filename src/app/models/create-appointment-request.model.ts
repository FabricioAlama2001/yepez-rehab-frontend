export interface CreateAppointmentRequest {
  patientId: string;
  physiotherapistId: string;
  appointmentDate: string;
  startTime: string;
  notes?: string;
}

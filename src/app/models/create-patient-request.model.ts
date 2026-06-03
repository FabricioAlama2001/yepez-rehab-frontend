export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  identification?: string;
  phone?: string;
  email?: string;
  birthDate?: string;
}

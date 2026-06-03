export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  identification?: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

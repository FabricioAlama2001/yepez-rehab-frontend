export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  identification?: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

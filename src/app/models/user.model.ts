export type UserRole = 'ADMIN' | 'PHYSIOTHERAPIST';

export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  fullName?: string;
  email: string;
  role: UserRole | string;
  isActive?: boolean;
}

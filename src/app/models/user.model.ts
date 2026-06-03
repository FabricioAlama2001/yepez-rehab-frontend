export type UserRole = 'ADMIN' | 'PHYSIOTHERAPIST';

export interface User {
  id: string;
  name?: string;
  fullName?: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
}

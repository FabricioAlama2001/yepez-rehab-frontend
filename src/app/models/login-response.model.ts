import { User } from './user.model';

export interface LoginResponse {
  access_token?: string;
  accessToken?: string;
  token?: string;
  user: User;
}

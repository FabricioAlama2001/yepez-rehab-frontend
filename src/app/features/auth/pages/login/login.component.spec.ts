import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../../../core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  const authServiceMock = {
    login: vi.fn()
  };

  const routerMock = {
    navigate: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock
        },
        {
          provide: Router,
          useValue: routerMock
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should create the login component', () => {
    expect(component).toBeTruthy();
  });

  it('should show validation error when email and password are empty', () => {
    component.email = '';
    component.password = '';

    component.login();

    expect(component.submitted).toBe(true);
    expect(component.errorMessage).toBe('Ingrese email y contraseña.');
    expect(authServiceMock.login).not.toHaveBeenCalled();
  });

  it('should mark email as invalid after submit when email is empty', () => {
    component.submitted = true;
    component.email = '   ';

    expect(component.isEmailInvalid()).toBe(true);
  });

  it('should mark password as invalid after submit when password is empty', () => {
    component.submitted = true;
    component.password = '   ';

    expect(component.isPasswordInvalid()).toBe(true);
  });

  it('should login and navigate to dashboard when credentials are valid', () => {
    authServiceMock.login.mockReturnValue(of({}));

    component.email = 'admin@test.com ';
    component.password = ' 123456 ';

    component.login();

    expect(authServiceMock.login).toHaveBeenCalledWith('admin@test.com', '123456');
    expect(component.loading).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should show error message when login fails', () => {
    authServiceMock.login.mockReturnValue(throwError(() => new Error('Invalid credentials')));

    component.email = 'admin@test.com';
    component.password = 'wrong-password';

    component.login();

    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBe('Credenciales inválidas o backend no disponible.');
  });
});

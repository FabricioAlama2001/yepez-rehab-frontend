import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { of } from 'rxjs';

import { UsersListComponent } from './users-list.component';
import { UsersService } from '../../../../core/services/users.service';
import { User } from '../../../../models/user.model';

describe('UsersListComponent', () => {
  let component: UsersListComponent;
  let fixture: ComponentFixture<UsersListComponent>;

  const usersServiceMock = {
    getUsers: vi.fn().mockReturnValue(of([])),
    createUser: vi.fn()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersListComponent],
      providers: [
        {
          provide: UsersService,
          useValue: usersServiceMock
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UsersListComponent);
    component = fixture.componentInstance;
  });

  it('should create the users list component', () => {
    expect(component).toBeTruthy();
  });

  it('should display full name when firstName and lastName are available', () => {
    const user: User = {
      id: '1',
      firstName: 'Steven',
      lastName: 'Alama',
      email: 'steven@test.com',
      role: 'ADMIN',
      isActive: true
    };

    expect(component.getDisplayName(user)).toBe('Steven Alama');
  });

  it('should use email as display name when name fields are missing', () => {
    const user: User = {
      id: '1',
      email: 'fisio@test.com',
      role: 'PHYSIOTHERAPIST',
      isActive: true
    };

    expect(component.getDisplayName(user)).toBe('fisio@test.com');
  });

  it('should label ADMIN role as Administrador', () => {
    expect(component.getRoleLabel('ADMIN')).toBe('Administrador');
    expect(component.getRoleSeverity('ADMIN')).toBe('success');
  });

  it('should label PHYSIOTHERAPIST role as Fisioterapeuta', () => {
    expect(component.getRoleLabel('PHYSIOTHERAPIST')).toBe('Fisioterapeuta');
    expect(component.getRoleSeverity('PHYSIOTHERAPIST')).toBe('info');
  });
});

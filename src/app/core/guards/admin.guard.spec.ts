import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';

import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';

describe('adminGuard', () => {
  const authServiceMock = {
    isAdmin: vi.fn()
  };

  const routerMock = {
    createUrlTree: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
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
    });
  });

  it('should allow access when user is admin', () => {
    authServiceMock.isAdmin.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));

    expect(result).toBe(true);
  });

  it('should redirect to dashboard when user is not admin', () => {
    const dashboardTree = { redirectTo: '/dashboard' };

    authServiceMock.isAdmin.mockReturnValue(false);
    routerMock.createUrlTree.mockReturnValue(dashboardTree);

    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));

    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    expect(result).toBe(dashboardTree);
  });
});

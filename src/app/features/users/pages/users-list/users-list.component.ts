import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';

import { UsersService } from '../../../../core/services/users.service';
import { User, UserRole } from '../../../../models/user.model';
import { CreateUserRequest } from '../../../../models/create-user-request.model';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    TagModule
  ],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss'
})
export class UsersListComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly cdr = inject(ChangeDetectorRef);

  users: User[] = [];

  loading = false;
  saving = false;
  dialogVisible = false;
  submitted = false;

  pageErrorMessage = '';
  dialogErrorMessage = '';
  successMessage = '';

  roles: UserRole[] = ['ADMIN', 'PHYSIOTHERAPIST'];

  form: CreateUserRequest = this.createEmptyForm();

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.pageErrorMessage = '';
    this.cdr.markForCheck();

    this.usersService.getUsers()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (users) => {
          this.users = [...users];
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.pageErrorMessage = this.getBackendErrorMessage(error, 'No se pudo cargar el listado de usuarios.');
          this.cdr.markForCheck();
        }
      });
  }

  openCreateDialog(): void {
    this.form = this.createEmptyForm();
    this.submitted = false;
    this.pageErrorMessage = '';
    this.dialogErrorMessage = '';
    this.successMessage = '';
    this.dialogVisible = true;
  }

  closeDialog(): void {
    if (this.saving) {
      return;
    }

    this.dialogVisible = false;
    this.submitted = false;
    this.dialogErrorMessage = '';
  }

  saveUser(): void {
    this.submitted = true;
    this.dialogErrorMessage = '';
    this.successMessage = '';

    if (this.isFormInvalid()) {
      this.dialogErrorMessage = 'Complete todos los campos obligatorios antes de guardar.';
      this.cdr.markForCheck();
      return;
    }

    const payload: CreateUserRequest = {
      firstName: this.form.firstName.trim(),
      lastName: this.form.lastName.trim(),
      email: this.form.email.trim(),
      password: this.form.password.trim(),
      role: this.form.role
    };

    this.saving = true;
    this.cdr.markForCheck();

    this.usersService.createUser(payload)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (createdUser) => {
          this.users = [createdUser, ...this.users];
          this.dialogVisible = false;
          this.submitted = false;
          this.form = this.createEmptyForm();
          this.successMessage = 'Usuario registrado correctamente.';
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.dialogErrorMessage = this.getBackendErrorMessage(error, 'No se pudo registrar el usuario.');
          this.cdr.markForCheck();
        }
      });
  }

  isFieldInvalid(field: keyof CreateUserRequest): boolean {
    const value = this.form[field];
    return this.submitted && !String(value ?? '').trim();
  }

  getDisplayName(user: User): string {
    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();

    return fullName || user.fullName || user.name || user.email;
  }

  getRoleLabel(role: unknown): string {
    const normalizedRole = this.normalizeRole(role);

    if (normalizedRole.includes('ADMIN')) {
      return 'Administrador';
    }

    if (normalizedRole.includes('PHYSIO') || normalizedRole.includes('FISIO')) {
      return 'Fisioterapeuta';
    }

    return 'Sin rol';
  }

  getRoleSeverity(role: unknown): 'success' | 'info' | 'secondary' {
    const normalizedRole = this.normalizeRole(role);

    if (normalizedRole.includes('ADMIN')) {
      return 'success';
    }

    if (normalizedRole.includes('PHYSIO') || normalizedRole.includes('FISIO')) {
      return 'info';
    }

    return 'secondary';
  }

  private normalizeRole(role: unknown): string {
    if (typeof role === 'string') {
      return role.trim().toUpperCase();
    }

    if (role && typeof role === 'object') {
      const roleObject = role as { name?: string; code?: string; value?: string; role?: string };
      return String(roleObject.name ?? roleObject.code ?? roleObject.value ?? roleObject.role ?? '').trim().toUpperCase();
    }

    return '';
  }

  private isFormInvalid(): boolean {
    return (
      !this.form.firstName?.trim() ||
      !this.form.lastName?.trim() ||
      !this.form.email?.trim() ||
      !this.form.password?.trim() ||
      !this.form.role
    );
  }

  private getBackendErrorMessage(error: HttpErrorResponse, fallbackMessage: string): string {
    const backendMessage = error.error?.message;

    if (Array.isArray(backendMessage)) {
      return backendMessage.join(', ');
    }

    if (typeof backendMessage === 'string') {
      return backendMessage;
    }

    if (error.status === 403) {
      return 'No tiene permisos para realizar esta acción.';
    }

    if (error.status === 409) {
      return 'Ya existe un usuario con esos datos.';
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el backend.';
    }

    return fallbackMessage;
  }

  private createEmptyForm(): CreateUserRequest {
    return {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'PHYSIOTHERAPIST'
    };
  }
}

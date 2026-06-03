import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule, PasswordModule, MessageModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  loading = false;
  submitted = false;
  errorMessage = '';

  login(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (!this.email.trim() || !this.password.trim()) {
      this.errorMessage = 'Ingrese email y contraseña.';
      return;
    }

    this.loading = true;

    this.authService.login(this.email.trim(), this.password.trim()).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Credenciales inválidas o backend no disponible.';
      }
    });
  }

  isEmailInvalid(): boolean {
    return this.submitted && !this.email.trim();
  }

  isPasswordInvalid(): boolean {
    return this.submitted && !this.password.trim();
  }
}

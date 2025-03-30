import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { APP_ROUTES } from '../../app-routes.config';
import { AuthService } from '../../services/auth.service';
import { CredentialsDto } from '../../DTO/credentials.dto';
import { LoginResponseEnseignantDto } from '../../DTO/login-response-enseignant.dto';
import { LoginResponseAdminDto } from '../../DTO/login-response-admin.dto';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-boxed-login',
  standalone: true,
  imports: [
    MatNativeDateModule ,
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './login.component.html',
})
export class AppBoxedLoginComponent {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private router: Router, 
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.snackBar.open('Veuillez remplir tous les champs correctement', 'Fermer', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const credentials: CredentialsDto = {
      email: this.loginForm.value.email!,
      password: this.loginForm.value.password!
    };

    this.authService.login(credentials).subscribe({
      next: (response: LoginResponseAdminDto | LoginResponseEnseignantDto) => {
        this.isLoading = false;
        
        // Redirection basée sur le rôle
        if (response.role === 'ROLE_ADMIN') {
          this.router.navigate([APP_ROUTES.adminDashboard]);
        } else if (response.role === 'ROLE_ENSEIGNANT') {
          this.router.navigate([APP_ROUTES.enseignantDashboard]);
        }
        
        this.snackBar.open('Connexion réussie', 'Fermer', { duration: 3000 });
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.status === 401 
          ? 'Email ou mot de passe incorrect' 
          : 'Une erreur est survenue';
        this.snackBar.open(this.errorMessage, 'Fermer', { duration: 3000 });
      }
    });
  }
}
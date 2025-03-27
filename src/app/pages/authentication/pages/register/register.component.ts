import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { APP_ROUTES } from '../../app-routes.config';
import { RegisterAdminDto, RegisterEnseignantDto } from '../../DTO/register.dto';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-boxed-register',
  standalone: true,
  imports: [
    RouterModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './register.component.html',
})
export class AppBoxedRegisterComponent {
  currentForm: 'admin' | 'enseignant' = 'enseignant';
  isLoading = false;
  errorMessage: string | null = null;

  adminForm = new FormGroup({
    nom: new FormControl('', [Validators.required]),
    prenom: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    motDePasse: new FormControl('', [Validators.required, Validators.minLength(8)]),
    telephone: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[0-9]{8}$/)
    ]),
    fonction: new FormControl('', [Validators.required])
  });

  enseignantForm = new FormGroup({
    nom: new FormControl('', [Validators.required]),
    prenom: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    motDePasse: new FormControl('', [Validators.required, Validators.minLength(8)]),
    telephone: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[0-9]{8}$/)
    ]),
    grade: new FormControl('', [Validators.required]),
    departement: new FormControl('', [Validators.required])
  });

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  toggleFormType(): void {
    this.currentForm = this.currentForm === 'admin' ? 'enseignant' : 'admin';
    this.errorMessage = null; // Reset error message when switching forms
  }

  submitAdmin(): void {
    if (this.adminForm.invalid) {
      this.markAllAsTouched(this.adminForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    
    const data: RegisterAdminDto = {
      nom: this.adminForm.value.nom!,
      prenom: this.adminForm.value.prenom!,
      email: this.adminForm.value.email!,
      motDePasse: this.adminForm.value.motDePasse!,
      telephone: this.adminForm.value.telephone!,
      fonction: this.adminForm.value.fonction!
    };

    this.authService.registerAdmin(data).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Administrateur enregistré avec succès', 'Fermer', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.router.navigate([APP_ROUTES.login]);
      },
      error: (error) => {
        this.isLoading = false;
        if (error.error?.code === 'EMAIL_EXISTS') {
          this.errorMessage = error.error.message;
        } else {
          this.snackBar.open('Une erreur est survenue', 'Fermer', { 
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      }
    });
  }

  submitEnseignant(): void {
    if (this.enseignantForm.invalid) {
      this.markAllAsTouched(this.enseignantForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const data: RegisterEnseignantDto = {
      nom: this.enseignantForm.value.nom!,
      prenom: this.enseignantForm.value.prenom!,
      email: this.enseignantForm.value.email!,
      motDePasse: this.enseignantForm.value.motDePasse!,
      telephone: this.enseignantForm.value.telephone!,
      grade: this.enseignantForm.value.grade!,
      departement: this.enseignantForm.value.departement!
    };

    this.authService.registerEnseignant(data).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Enseignant enregistré avec succès', 'Fermer', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.router.navigate([APP_ROUTES.login]);
      },
      error: (error) => {
        this.isLoading = false;
        if (error.error?.code === 'EMAIL_EXISTS') {
          this.errorMessage = error.error.message;
        } else {
          this.snackBar.open('Une erreur est survenue', 'Fermer', { 
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      }
    });
  }

  private markAllAsTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markAllAsTouched(control);
      }
    });
  }
}
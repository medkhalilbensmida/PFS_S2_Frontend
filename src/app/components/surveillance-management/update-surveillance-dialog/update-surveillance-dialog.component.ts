import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SurveillanceService, Surveillance } from '../../../services/surveillance.service';
import { MaterialModule } from '../../../material.module';
import { catchError, finalize, throwError } from 'rxjs';

interface UpdateSurveillanceData {
  id: number;
  dateDebut: Date;
  dateFin: Date;
  statut: string;
  salleId?: number;
  matiereId?: number;
  sessionExamenId: number;
}

@Component({
  selector: 'app-update-surveillance-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    MatDialogModule
  ],
  templateUrl: './update-surveillance-dialog.component.html',
  styleUrl: './update-surveillance-dialog.component.scss'
})
export class UpdateSurveillanceDialogComponent implements OnInit {
  surveillanceForm: FormGroup;
  loading = false;
  statutOptions = ['PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'];
  salles: any[] = [];
  matieres: any[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UpdateSurveillanceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UpdateSurveillanceData,
    private snackBar: MatSnackBar,
    private surveillanceService: SurveillanceService
  ) {
    // Convert Date objects to ISO strings for the form inputs
    const dateDebut = new Date(data.dateDebut);
    const dateFin = new Date(data.dateFin);
    
    const dateDebutISOString = this.formatDateForInput(dateDebut);
    const dateFinISOString = this.formatDateForInput(dateFin);

    this.surveillanceForm = this.fb.group({
      dateDebut: [dateDebutISOString, Validators.required],
      dateFin: [dateFinISOString, Validators.required],
      statut: [data.statut, Validators.required],
      salleId: [data.salleId],
      matiereId: [data.matiereId]
    });
  }

  ngOnInit(): void {
    this.loadSalles();
    this.loadMatieres();
  }

  loadSalles(): void {
    this.surveillanceService.getAllSalles()
      .pipe(
        catchError(error => {
          console.error('Error loading salles:', error);
          this.showError('Erreur lors du chargement des salles. Continuer la mise à jour sans cette information.');
          return [];
        })
      )
      .subscribe(salles => {
        this.salles = salles;
      });
  }

  loadMatieres(): void {
    this.surveillanceService.getAllMatieres()
      .pipe(
        catchError(error => {
          console.error('Error loading matieres:', error);
          this.showError('Erreur lors du chargement des matières. Continuer la mise à jour sans cette information.');
          return [];
        })
      )
      .subscribe(matieres => {
        this.matieres = matieres;
      });
  }

  formatDateForInput(date: Date): string {
    // Format date as YYYY-MM-DDThh:mm (format required by datetime-local input)
    const localISOTime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
      .toISOString()
      .slice(0, 16);
    return localISOTime;
  }

  onSubmit(): void {
    if (this.surveillanceForm.invalid) {
      this.surveillanceForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    const formValue = this.surveillanceForm.value;
    
    // Convert form string dates to ISO format for backend
    const dateDebut = new Date(formValue.dateDebut).toISOString();
    const dateFin = new Date(formValue.dateFin).toISOString();
    
    // Create payload with the updated values
    const payload = {
      id: this.data.id,
      dateDebut: dateDebut,
      dateFin: dateFin,
      statut: formValue.statut,
      salleId: formValue.salleId,
      matiereId: formValue.matiereId,
      sessionExamenId: this.data.sessionExamenId
    };

    this.surveillanceService.updateSurveillance(this.data.id, payload)
      .pipe(
        catchError((error) => {
          let errorMsg = 'Erreur lors de la mise à jour de la surveillance.';
          if (error.error && typeof error.error === 'string') {
            errorMsg = error.error;
          } else if (error.message) {
            errorMsg = error.message;
          }
          this.showError(errorMsg);
          return throwError(() => error);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((_) => {
        this.showSuccess('Surveillance mise à jour avec succès');
        this.dialogRef.close(true);
      });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  showSuccess(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}

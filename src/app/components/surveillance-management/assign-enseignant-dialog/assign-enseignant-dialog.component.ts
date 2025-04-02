import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SurveillanceService, Enseignant, DisponibiliteEnseignantDTO } from '../../../services/surveillance.service';
import { MaterialModule } from '../../../material.module';
import { CommonModule } from '@angular/common';
import { catchError, throwError, map } from 'rxjs';

interface DisponibiliteResponseItem extends DisponibiliteEnseignantDTO {
  enseignantNom?: string;
  enseignantPrenom?: string;
}

interface DialogData {
  surveillanceId: number;
  currentPrincipalId?: number;
  currentSecondaireId?: number;
  dateDebut: Date;
  dateFin: Date;
}

@Component({
  selector: 'app-assign-enseignant-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MaterialModule
  ],
  templateUrl: './assign-enseignant-dialog.component.html',
  styleUrls: ['./assign-enseignant-dialog.component.scss']
})
export class AssignEnseignantDialogComponent implements OnInit {
  assignForm: FormGroup;
  loading = false;
  enseignantDetails: { id: number, nom: string, prenom: string }[] = [];
  availableEnseignants: Enseignant[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AssignEnseignantDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private surveillanceService: SurveillanceService,
    private snackBar: MatSnackBar
  ) {
    this.assignForm = this.fb.group({
      enseignantPrincipalId: [data.currentPrincipalId || null],
      enseignantSecondaireId: [data.currentSecondaireId || null]
    });
  }

  ngOnInit(): void {
    this.loadAndFilterEnseignants();
  }

  loadAndFilterEnseignants(): void {
    this.loading = true;
    this.surveillanceService.getEnseignantDisponibilites(this.data.surveillanceId)
      .pipe(
        catchError(error => {
          this.loading = false;
          this.showError('Impossible de charger les disponibilités des enseignants.');
          console.error('Error loading teacher availability data:', error);
          return throwError(() => error);
        }),
        map((disponibilites: DisponibiliteResponseItem[]) => {
          console.log('Raw Disponibilites:', disponibilites);
          console.log('Current IDs:', this.data.currentPrincipalId, this.data.currentSecondaireId);
          this.enseignantDetails = disponibilites
             .filter(disp => disp.enseignantId != null && disp.enseignantNom != null && disp.enseignantPrenom != null)
             .map(disp => ({
                id: disp.enseignantId!,
                nom: disp.enseignantNom || 'N/A',
                prenom: disp.enseignantPrenom || ''
             }));

          const currentPrincipalId = this.data.currentPrincipalId;
          const currentSecondaireId = this.data.currentSecondaireId;

          return disponibilites.filter(disp =>
            disp.enseignantId &&
            (disp.estDisponible ||
             disp.enseignantId === currentPrincipalId ||
             disp.enseignantId === currentSecondaireId)
          );
        })
      )
      .subscribe(filteredDisponibilites => {
        console.log('Filtered Disponibilites (before map to availableEnseignants):', filteredDisponibilites);
        this.availableEnseignants = filteredDisponibilites.map(disp => ({
          id: disp.enseignantId!,
          nom: disp.enseignantNom || 'N/A',
          prenom: disp.enseignantPrenom || '',
          email: '',
          telephone: '',
          grade: '',
          departement: ''
        }));
        console.log('Final availableEnseignants for dropdown:', this.availableEnseignants);
        this.loading = false;
      });
  }

  onSubmit(): void {
    if (this.assignForm.invalid) {
      return;
    }

    this.loading = true;
    const formValue = this.assignForm.value;
    
    const request = {
      enseignantPrincipalId: formValue.enseignantPrincipalId || undefined,
      enseignantSecondaireId: formValue.enseignantSecondaireId || undefined
    };

    this.surveillanceService.assignEnseignants(this.data.surveillanceId, request)
      .pipe(
        catchError(error => {
          this.loading = false;
          
          console.log(error); 

          let errorMessage = 'Erreur lors de l\'affectation des enseignants';
          if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error?.message) {
          
            errorMessage = error.error.message;
          }
          this.showError(errorMessage);
          return throwError(() => error);
        })
      )
      .subscribe(() => {
        this.dialogRef.close(true);
        this.showSuccess('Enseignants affectés avec succès');
        this.loading = false;
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

  getEnseignantFullName(id: number | undefined): string {
    if (id === undefined || id === null) {
      return 'Non assigné';
    }
    const enseignant = this.enseignantDetails.find(e => e.id === id);
    if (enseignant) {
      return `${enseignant.prenom} ${enseignant.nom}`;
    }
    console.warn(`Teacher details not found for ID: ${id}`);
    return `Enseignant ID: ${id}`;
  }
} 
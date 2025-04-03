import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SurveillanceService, Surveillance } from '../../../services/surveillance.service';
import { MaterialModule } from '../../../material.module';
import { CommonModule } from '@angular/common';
import { catchError, throwError } from 'rxjs';

interface DialogData {
  sessionId: number;
}

// Type for the payload sent to the API
// Reflects string dates and required statut
interface CreateSurveillancePayload {
  dateDebut: string;
  dateFin: string;
  statut: string;
  salleId?: number | null;
  matiereId?: number | null;
  sessionExamenId: number;
  // Include other optional fields from Surveillance if they can be sent on creation
  enseignantPrincipalId?: number | null;
  enseignantSecondaireId?: number | null;
}

// Helper function to format Date object or string to YYYY-MM-DDTHH:mm:ssZ (UTC ISO 8601 format)
function formatISOUTC(date: Date | string | null): string | null {
  if (!date) return null;
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      console.error("Invalid date value for formatting:", date);
      return null; 
    }
    // Use toISOString() directly which returns YYYY-MM-DDTHH:mm:ss.sssZ format
    // The backend likely handles the milliseconds part, or we can truncate if needed.
    // Let's keep the milliseconds for now as the example showed them.
    return dateObj.toISOString(); 

  } catch (e) {
    console.error("Error formatting date to UTC ISO:", date, e);
    return null; 
  }
}

@Component({
  selector: 'app-add-surveillance-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MaterialModule
  ],
  templateUrl: './add-surveillance-dialog.component.html',
  styleUrls: ['./add-surveillance-dialog.component.scss']
})
export class AddSurveillanceDialogComponent implements OnInit {
  surveillanceForm: FormGroup;
  loading = false;
  salles: any[] = []; // This would normally be loaded from a service
  matieres: any[] = []; // This would normally be loaded from a service
  statutOptions: string[] = ['PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddSurveillanceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private surveillanceService: SurveillanceService,
    private snackBar: MatSnackBar
  ) {
    this.surveillanceForm = this.fb.group({
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      statut: ['PLANIFIEE', Validators.required],
      salleId: [''],
      matiereId: ['']
    });
  }

  ngOnInit(): void {
    // Load salles and matières (this would be from an actual service)
    // For now we'll use placeholder data
    this.salles = [
      { id: 1, nom: 'Salle A1' },
      { id: 2, nom: 'Salle A2' },
      { id: 3, nom: 'Salle B1' }
    ];
    
    this.matieres = [
      { id: 1, nom: 'Mathématiques' },
      { id: 2, nom: 'Physique' },
      { id: 3, nom: 'Informatique' }
    ];
  }
  
  getSalleName(): string | undefined {
    const salleId = this.surveillanceForm.get('salleId')?.value;
    if (!salleId) return undefined;
    const salle = this.salles.find(s => s.id === salleId);
    return salle ? salle.nom : undefined;
  }
  
  getMatiereName(): string | undefined {
    const matiereId = this.surveillanceForm.get('matiereId')?.value;
    if (!matiereId) return undefined;
    const matiere = this.matieres.find(m => m.id === matiereId);
    return matiere ? matiere.nom : undefined;
  }

  onSubmit(): void {
    if (this.surveillanceForm.invalid) {
      // Optionally mark fields as touched to show validation errors
      this.surveillanceForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.surveillanceForm.value;

    // Format dates to UTC ISO format before sending
    const formattedDateDebut = formatISOUTC(formValue.dateDebut);
    const formattedDateFin = formatISOUTC(formValue.dateFin);

    // Check if formatting failed (e.g., invalid date input)
    if (!formattedDateDebut || !formattedDateFin) {
        this.showError('Format de date invalide.');
        this.loading = false;
        return;
    }

    // Construct the payload with formatted dates and statut from form
    const surveillance: CreateSurveillancePayload = {
      salleId: formValue.salleId || null, 
      matiereId: formValue.matiereId || null, 
      dateDebut: formattedDateDebut!, // Use non-null assertion as we checked above
      dateFin: formattedDateFin!,     // Use non-null assertion as we checked above
      sessionExamenId: this.data.sessionId,
      statut: formValue.statut
    };

    // Call the service
    this.surveillanceService.createSurveillance(surveillance)
      .pipe(
        catchError(error => {
          // Log the detailed error from the backend
          console.error('Backend error:', error);
          let errorMsg = 'Erreur lors de la création de la surveillance.';
          
          // Handle both old and new error response formats
          if (error.error) {
            if (typeof error.error === 'object' && error.error.message) {
              // New error format with ErrorResponse object
              errorMsg = error.error.message;
              if (errorMsg === "Il existe deja une surveillance dans cette salle pendant cette periode.") {
                errorMsg = "Il existe déjà une surveillance dans cette salle pendant cette période.";
              }
            } else if (typeof error.error === 'string') {
              // Old error format (string)
              errorMsg = error.error;
              // Handle the non-accented version if received
              if (errorMsg === "Il existe deja une surveillance dans cette salle pendant cette periode.") {
                errorMsg = "Il existe déjà une surveillance dans cette salle pendant cette période.";
              }
            }
          } else if (error.message) {
            errorMsg = error.message;
          }
          
          this.showError(errorMsg);
          this.loading = false;
          return throwError(() => new Error(errorMsg));
        })
      )
      .subscribe(() => {
        this.dialogRef.close(true);
        this.showSuccess('Surveillance créée avec succès');
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
} 
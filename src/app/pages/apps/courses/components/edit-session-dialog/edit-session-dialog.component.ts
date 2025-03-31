import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { SessionExamen } from '../../models/session.model';
import { SessionExamenService } from '../../services/session.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-edit-session-dialog',
  templateUrl: './edit-session-dialog.component.html',
  styleUrls: ['./edit-session-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatNativeDateModule,
    MatSlideToggleModule
  ]
})
export class EditSessionDialogComponent implements OnInit {
  sessionForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private sessionService: SessionExamenService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<EditSessionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { session: SessionExamen }
  ) {
    this.sessionForm = this.fb.group({
      dateDebut: [new Date(data.session.dateDebut), Validators.required],
      dateFin: [new Date(data.session.dateFin), Validators.required],
      type: [data.session.type, Validators.required],
      estActive: [data.session.estActive, Validators.required],
      numSemestre: [data.session.numSemestre, Validators.required]
    });
  }

  ngOnInit(): void {
    this.sessionForm.valueChanges.subscribe(() => {
      // Validation supplémentaire si nécessaire
    });
  }

  onSubmit(): void {
    if (this.sessionForm.valid) {
      this.isLoading = true;
      const updatedSession: SessionExamen = {
        ...this.data.session,
        ...this.sessionForm.value
      };

      this.sessionService.updateSession(this.data.session.id, updatedSession).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.snackBar.open('Session mise à jour avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Erreur:', error);
          this.snackBar.open(
            error.error?.message || 'Erreur lors de la mise à jour de la session',
            'Fermer',
            { duration: 5000, panelClass: ['error-snackbar'] }
          );
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
  
  onStatusChange(): void {
    console.log('Statut changé:', this.sessionForm.get('estActive')?.value);
  }
}
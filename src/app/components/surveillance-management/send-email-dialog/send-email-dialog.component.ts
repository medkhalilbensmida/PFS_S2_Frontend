import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EnseignantDTO, SurveillanceService } from '../../../services/surveillance.service';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { finalize } from 'rxjs';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule
  ],
  selector: 'app-send-email-dialog',
  templateUrl: './send-email-dialog.component.html',
  styleUrls: ['./send-email-dialog.component.scss']
})
export class SendEmailDialogComponent implements OnInit {
  emailForm: FormGroup;
  loading = false;
  professors: EnseignantDTO[] = [];
   isLoading = false; 
  emailTemplates = [
    { value: 'confirmation', label: 'Confirmation de surveillance' },
    { value: 'rappel', label: 'Rappel avant examen' },
    { value: 'custom', label: 'Message personnalisé' }
  ];
  loadError: string | null = null;


  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SendEmailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { sessionId: number },
    private surveillanceService: SurveillanceService,
    private snackBar: MatSnackBar
  ) {
    this.emailForm = this.fb.group({
      template: ['confirmation', Validators.required],
      customMessage: [''],
      sendToAll: [false],
      selectedProfessors: [[]]
    });
  }

  ngOnInit(): void {
    this.loadProfessors();
  }

  loadProfessors(): void {
    this.isLoading = true;
    this.loadError = null;
    
    this.surveillanceService.getEnseignantsForSession(this.data.sessionId)
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (professors) => {
          this.professors = professors;
        },
        error: (err) => {
          console.error('Failed to load professors', err);
          this.loadError = 'Failed to load professors';
          this.snackBar.open(this.loadError, 'Close', { duration: 5000 });
        }
      });
  }

  get professorOptions() {
    return this.professors.map(p => ({
      value: p.id,
      label: `${p.nom} ${p.prenom} (${p.email})`
    }));
  }

  onSubmit(): void {
    if (this.emailForm.invalid) {
      return;
    }

    this.loading = true;
    const formData = this.emailForm.value;

    const payload = {
      sessionId: this.data.sessionId,
      template: formData.template,
      customMessage: formData.customMessage,
      professorIds: formData.sendToAll 
        ? this.professors.map(p => p.id) 
        : formData.selectedProfessors
    };

    this.surveillanceService.sendEmails(payload)
      .subscribe({
        next: () => {
          this.snackBar.open('Emails envoyés avec succès', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.snackBar.open('Erreur lors de l\'envoi des emails', 'Fermer', { duration: 5000 });
          console.error(err);
          this.loading = false;
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
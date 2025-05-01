// send-email-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SurveillanceService } from '../../../services/surveillance.service';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';


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
  professors: any[] = [];
  selectedSurveillances: any[] = [];
  emailTemplates = [
    { value: 'confirmation', label: 'Confirmation de surveillance' },
    { value: 'rappel', label: 'Rappel avant examen' },
    { value: 'custom', label: 'Message personnalisé' }
  ];

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
      selectedProfessors: [[]],
      selectedSurveillances: [[]]
    });
  }

  ngOnInit(): void {
    // this.loadProfessors();
    this.loadSurveillances();
  }

  // loadProfessors(): void {
  //   this.surveillanceService.getEnseignantsForSession(this.data.sessionId)
  //     .subscribe((professors:any) => {
  //       this.professors = professors;
  //     });
  // }

  loadSurveillances(): void {
    this.surveillanceService.getSurveillancesBySessionId(this.data.sessionId)
      .subscribe(surveillances => {
        this.selectedSurveillances = surveillances;
      });
  }

  get professorOptions() {
    return this.professors.map(p => ({
      value: p.id,
      label: `${p.nom} ${p.prenom} (${p.email})`
    }));
  }

  get surveillanceOptions() {
    return this.selectedSurveillances.map(s => ({
      value: s.id,
      label: `${this.formatDate(s.dateDebut)} - ${s.matiereName || 'Matière non spécifiée'} (${s.salleName || 'Salle non spécifiée'})`
    }));
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
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
        : formData.selectedProfessors,
      surveillanceIds: formData.selectedSurveillances
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
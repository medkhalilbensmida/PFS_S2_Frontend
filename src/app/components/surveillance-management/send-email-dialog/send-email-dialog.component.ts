import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EnseignantDTO, NotificationEmailDTO, SurveillanceService } from '../../../services/surveillance.service';
import { finalize } from 'rxjs/operators';
import { MaterialModule } from '../../../material.module';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-send-email-dialog',
  templateUrl: './send-email-dialog.component.html',
  styleUrls: ['./send-email-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MaterialModule
  ]
})
export class SendEmailDialogComponent implements OnInit {
  emailForm: FormGroup;
  professors: EnseignantDTO[] = [];
  isLoading = false;
  isSending = false;
  loadError: string | null = null;
  sendError: string | null = null;

  emailTemplates = [
    { value: 'confirmation', label: 'Confirmation de surveillance' },
    { value: 'rappel', label: 'Rappel avant examen' },
    { value: 'surveillance-assignment', label: 'Affectation de surveillance' },
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
          // Initialize selected professors if not sending to all
          if (!this.emailForm.get('sendToAll')?.value) {
            this.emailForm.get('selectedProfessors')?.setValue(
              professors.map(p => p.id)
            );
          }
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

  async sendEmail(): Promise<void> {
    if (this.emailForm.invalid) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }
  
    this.isSending = true;
    this.sendError = null;
  
    try {
      const formData = this.emailForm.value;
      const professorsToEmail = formData.sendToAll 
        ? this.professors 
        : this.professors.filter(p => formData.selectedProfessors.includes(p.id));
  
      if (professorsToEmail.length === 0) {
        this.snackBar.open('No professors selected', 'Close', { duration: 3000 });
        return;
      }
  
      let successCount = 0;
      
      for (const prof of professorsToEmail) {
        try {
          const request: NotificationEmailDTO = {
            toEmail: prof.email,
            subject: this.getEmailSubject(formData.template),
            message: formData.template === 'custom' 
              ? formData.customMessage 
              : "",
            date: new Date(),
            template: formData.template,
            session: this.data.sessionId
          };
  
          const response = await this.surveillanceService.sendEmailDTO(request).toPromise();
          
          // Check if response contains success message
          if (response && response.includes('Email sent successfully')) {
            successCount++;
          } else {
            console.error('Unexpected response:', response);
            throw new Error('Unexpected response from server');
          }
        } catch (error) {
          console.error(`Failed to send email to ${prof.email}:`, error);
        }
      }
  
      if (successCount === professorsToEmail.length) {
        this.snackBar.open('All emails sent successfully!', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      } else {
        this.sendError = `Sent ${successCount} of ${professorsToEmail.length} emails`;
        this.snackBar.open(this.sendError, 'Close', { duration: 5000 });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      this.sendError = 'Unexpected error occurred';
      this.snackBar.open(this.sendError, 'Close', { duration: 5000 });
    } finally {
      this.isSending = false;
    }
  }

  private getEmailSubject(template: string): string {
    switch (template) {
      case 'confirmation': return 'Confirmation de surveillance';
      case 'rappel': return 'Rappel de surveillance d\'examen';
      case 'surveillance-assignment': return 'Nouvelle affectation de surveillance';
      case 'custom': return 'Message important';
      default: return 'Notification de surveillance';
    }
  }

  private getTemplateMessage(template: string, professor: EnseignantDTO): string {
    switch (template) {
      case 'confirmation':
        return `Confirmation pour ${professor.prenom} ${professor.nom}`;
      case 'rappel':
        return `Rappel pour ${professor.prenom} ${professor.nom}`;
      case 'surveillance-assignment':
        return `Nouvelle affectation pour ${professor.prenom}`;
      case 'exam-reminder':
        return `Rappel d'examen pour ${professor.prenom}`;
      default:
        return `Notification pour ${professor.prenom}`;
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
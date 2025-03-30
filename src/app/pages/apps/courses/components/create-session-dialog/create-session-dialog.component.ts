import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SessionExamenService } from '../../services/session.service';
import { AddSessionExamenDTO, AnneeUniversitaire } from '../../models/session.model';
import { CommonModule, DatePipe } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-create-session-dialog',
  templateUrl: './create-session-dialog.component.html',
  styleUrls: ['./create-session-dialog.component.scss'],
  standalone: true,
  imports: [
    MatProgressSpinnerModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatDialogModule
  ],
  providers: [DatePipe]
})
export class CreateSessionDialogComponent implements OnInit {
  sessionData: AddSessionExamenDTO = {
    dateDebut: this.formatDate(new Date()), // Format initial JJ/MM/AAAA
    dateFin: this.formatDate(new Date()),   // Format initial JJ/MM/AAAA
    type: 'DS',
    estActive: true,
    anneeUniversitaireId: 0,
    numSemestre: 'S1'
  };

  anneesUniversitaires: AnneeUniversitaire[] = [];
  semestres = ['S1', 'S2'];
  typesSession = ['DS', 'PRINCIPALE', 'RATTRAPAGE'];
  isLoading = false;

  constructor(
    public dialogRef: MatDialogRef<CreateSessionDialogComponent>,
    private sessionService: SessionExamenService,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.loadAnneesUniversitaires();
  }

  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private parseDate(dateString: string): Date | null {
    if (!dateString) return null;
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    return date;
  }

  loadAnneesUniversitaires(): void {
    this.isLoading = true;
    this.sessionService.getAnneesUniversitaires().subscribe({
      next: (annees) => {
        this.anneesUniversitaires = annees;
        if (annees.length > 0) {
          this.sessionData.anneeUniversitaireId = annees[0].id;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.snackBar.open(
          error.message || 'Erreur lors du chargement des années universitaires', 
          'Fermer', 
          { duration: 5000 }
        );
        this.isLoading = false;
      }
    });
  }

  formatAnnee(annee: AnneeUniversitaire): string {
    if (!annee) return 'Année non définie';
    return annee.annee || `Année ${new Date(annee.dateDebut).getFullYear()}-${new Date(annee.dateFin).getFullYear()}`;
  }

  onSubmit(): void {
    // Conversion des dates en format ISO
    const dateDebut = this.parseDate(this.sessionData.dateDebut as string);
    const dateFin = this.parseDate(this.sessionData.dateFin as string);
    
    if (!dateDebut || !dateFin) {
      this.snackBar.open('Veuillez entrer des dates valides (JJ/MM/AAAA)', 'Fermer', { duration: 5000 });
      return;
    }

    const payload = {
      ...this.sessionData,
      dateDebut: dateDebut.toISOString(),
      dateFin: dateFin.toISOString()
    };

    this.sessionService.createSession(payload).subscribe({
      next: (response) => {
        this.snackBar.open('Session créée avec succès', 'Fermer', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.snackBar.open(
          error.error?.message || error.message || 'Erreur lors de la création de la session',
          'Fermer',
          { duration: 5000 }
        );
      }
    });
  }
}
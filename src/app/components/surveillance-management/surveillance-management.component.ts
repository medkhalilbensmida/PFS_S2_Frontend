import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { SurveillanceService, Surveillance, Enseignant } from '../../services/surveillance.service';
import { MaterialModule } from '../../material.module';
import { CommonModule } from '@angular/common';
import { AddSurveillanceDialogComponent } from './add-surveillance-dialog/add-surveillance-dialog.component';
import { AssignEnseignantDialogComponent } from './assign-enseignant-dialog/assign-enseignant-dialog.component';
import { UpdateSurveillanceDialogComponent } from './update-surveillance-dialog/update-surveillance-dialog.component';
import { SendEmailDialogComponent } from './send-email-dialog/send-email-dialog.component';
import { AuthService } from '../../pages/authentication/services/auth.service';

@Component({
  selector: 'app-surveillance-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule
  ],
  templateUrl: './surveillance-management.component.html',
  styleUrls: ['./surveillance-management.component.scss']
})
export class SurveillanceManagementComponent implements OnInit {

  surveillances: Surveillance[] = [];
  enseignants: Enseignant[] = [];
  availableEnseignants: Enseignant[] = [];
  sessionId: number | null = null;
  loading = false;
  isAdmin: boolean = false;
  
  // Ajout de la colonne statut
  displayedColumns: string[] = ['statut', 'dateDebut', 'dateFin', 'salle', 'matiere', 'enseignantPrincipal', 'enseignantSecondaire', 'actions'];
  
  constructor(
    private surveillanceService: SurveillanceService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    
    // Filter columns based on role
    if (!this.isAdmin) {
      this.displayedColumns = this.displayedColumns.filter(col => col !== 'actions');
    }
    
    this.route.paramMap.subscribe(params => {
      const id = params.get('sessionId');
      this.sessionId = id ? +id : null;
      if (this.sessionId) {
        this.loadSurveillances();
      } else {
        this.showError('ID de session non valide');
      }
    });

    this.loadEnseignants();
  }

  // Nouvelle méthode pour obtenir la classe CSS en fonction du statut
  getStatusClass(statut: string): string {
    switch (statut) {
      case 'PLANIFIEE':
        return 'status-planned';
      case 'EN_COURS':
        return 'status-in-progress';
      case 'TERMINEE':
        return 'status-completed';
      case 'ANNULEE':
        return 'status-cancelled';
      default:
        return '';
    }
  }
  
  // Nouvelle méthode pour obtenir la classe CSS de la ligne en fonction du statut
  getRowClass(statut: string): string {
    switch (statut) {
      case 'PLANIFIEE':
        return 'row-planned';
      case 'EN_COURS':
        return 'row-in-progress';
      case 'TERMINEE':
        return 'row-completed';
      case 'ANNULEE':
        return 'row-cancelled';
      default:
        return '';
    }
  }

  loadSurveillances(): void {
    this.loading = true;
    if (!this.sessionId) {
      this.loading = false;
      return;
    }
    
    this.surveillanceService.getSurveillancesBySessionId(this.sessionId)
      .pipe(
        catchError(error => {
          this.showError(`Impossible de charger les surveillances pour la session ${this.sessionId}`);
          this.loading = false;
          return throwError(() => error);
        })
      )
      .subscribe(data => {
        this.surveillances = data;
        this.loading = false;
      });
  }

  loadEnseignants(): void {
    this.surveillanceService.getAllEnseignants()
      .pipe(
        catchError(error => {
          this.showError('Impossible de charger les enseignants');
          return throwError(() => error);
        })
      )
      .subscribe(data => {
        this.enseignants = data;
      });
  }

  openAddSurveillanceDialog(): void {
    if (!this.sessionId) return;
    
    const dialogRef = this.dialog.open(AddSurveillanceDialogComponent, {
      width: '600px',
      data: { sessionId: this.sessionId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSurveillances();
      }
    });
  }

  openSendEmailDialog(): void {
      if (!this.sessionId) return;
      
      const dialogRef = this.dialog.open(SendEmailDialogComponent, {
        width: '600px',
        data: { sessionId: this.sessionId }
      });
  
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.loadSurveillances();
        }
      });
    }

  openAssignEnseignantDialog(surveillance: Surveillance): void {
    const dialogRef = this.dialog.open(AssignEnseignantDialogComponent, {
      width: '600px',
      data: {
        surveillanceId: surveillance.id,
        currentPrincipalId: surveillance.enseignantPrincipalId,
        currentSecondaireId: surveillance.enseignantSecondaireId,
        dateDebut: surveillance.dateDebut,
        dateFin: surveillance.dateFin,
        salleName: surveillance.salleName,
        matiereName: surveillance.matiereName,
        statut: surveillance.statut,
        sessionId : this.sessionId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSurveillances();
      }
    });
  }

  openUpdateSurveillanceDialog(surveillance: Surveillance): void {
    const dialogRef = this.dialog.open(UpdateSurveillanceDialogComponent, {
      width: '600px',
      data: {
        id: surveillance.id,
        dateDebut: surveillance.dateDebut,
        dateFin: surveillance.dateFin,
        statut: surveillance.statut,
        salleId: surveillance.salleId,
        matiereId: surveillance.matiereId,
        sessionExamenId: this.sessionId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSurveillances();
      }
    });
  }


  deleteSurveillance(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette surveillance ?')) {
      this.loading = true;
      this.surveillanceService.deleteSurveillance(id)
        .pipe(
          catchError(error => {
            this.showError('Erreur lors de la suppression de la surveillance');
            this.loading = false;
            return throwError(() => error);
          })
        )
        .subscribe(() => {
          this.loadSurveillances();
          this.showSuccess('Surveillance supprimée avec succès');
        });
    }
  }

  getEnseignantFullName(id: number | undefined): string {
    return this.surveillanceService.getEnseignantFullName(id, this.enseignants);
  }

  formatDate(date: Date): string {
    return this.surveillanceService.formatDate(date);
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
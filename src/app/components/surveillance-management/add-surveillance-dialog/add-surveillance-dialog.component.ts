import { Component, Inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SurveillanceService, Surveillance, Salle, Matiere, Section } from '../../../services/surveillance.service';
import { MaterialModule } from '../../../material.module';
import { CommonModule } from '@angular/common';
import { catchError, forkJoin, map, throwError } from 'rxjs';

interface DialogData {
  sessionId: number;
}

interface CreateSurveillancePayload {
  dateDebut: string;
  dateFin: string;
  statut: string;
  salleId?: number | null;
  matiereId?: number | null;
  sessionExamenId: number;
  enseignantPrincipalId?: number | null;
  enseignantSecondaireId?: number | null;
}

function formatISOUTC(date: Date | string | null): string | null {
  if (!date) return null;
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      console.error("Invalid date value for formatting:", date);
      return null;
    }
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
  styleUrls: ['./add-surveillance-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddSurveillanceDialogComponent implements OnInit {
  surveillanceForm: FormGroup;
  loading = false;
  salles: Salle[] = [];
  matieres: Matiere[] = [];
  filteredMatieres: Matiere[] = [];
  availableSections: Section[] = [];
  statutOptions: string[] = ['PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'];

  selectedSalleCapacity: number | null = null;
  selectedSectionStudentNumber: number | null = null;
  showCapacityWarning = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddSurveillanceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private surveillanceService: SurveillanceService,
    private snackBar: MatSnackBar,
    private cdRef: ChangeDetectorRef
  ) {
    this.surveillanceForm = this.fb.group({
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      statut: ['PLANIFIEE', Validators.required],
      salleId: [''],
      sectionName: [''],
      matiereId: ['']
    });
  }

  ngOnInit(): void {
    this.loadDropdownData();
    this.subscribeToSelectionChanges();
  }

  loadDropdownData(): void {
    this.loading = true;
    forkJoin({
      salles: this.surveillanceService.getAllSalles(),
      matieres: this.surveillanceService.getAllMatieres()
    }).pipe(
      catchError(error => {
        console.error('Error loading dropdown data:', error);
        this.showError('Erreur lors du chargement des données pour les menus déroulants.');
        this.loading = false;
        this.cdRef.markForCheck();
        return throwError(() => new Error('Failed to load dropdown data'));
      })
    ).subscribe(({ salles, matieres }) => {
      this.salles = salles;
      this.matieres = matieres;
      
      // Extraire les sections uniques à partir des matières
      const sectionsMap = new Map<string, Section>();
      matieres.forEach(matiere => {
        if (matiere.section) {
          sectionsMap.set(matiere.section.name, matiere.section);
        }
      });
      this.availableSections = Array.from(sectionsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      
      this.loading = false;
      this.cdRef.markForCheck();
    });
  }

  onSectionChange(): void {
    const selectedSectionName = this.surveillanceForm.get('sectionName')?.value;
    if (selectedSectionName) {
      this.filteredMatieres = this.matieres.filter(matiere => 
        matiere.section?.name === selectedSectionName
      );
      
      // Trouver le nombre d'étudiants pour la section sélectionnée
      const selectedSection = this.availableSections.find(s => s.name === selectedSectionName);
      this.selectedSectionStudentNumber = selectedSection?.studentNumber || null;
      
      // Réinitialiser la sélection de la matière
      this.surveillanceForm.get('matiereId')?.setValue(null);
    } else {
      this.filteredMatieres = [];
      this.selectedSectionStudentNumber = null;
    }
    this.checkCapacity();
    this.cdRef.markForCheck();
  }

  subscribeToSelectionChanges(): void {
    this.surveillanceForm.get('salleId')?.valueChanges.subscribe(salleId => {
      this.updateSalleCapacity(salleId);
      this.checkCapacity();
    });
  }

  updateSalleCapacity(salleId: number | string | null): void {
    if (!salleId) {
      this.selectedSalleCapacity = null;
      return;
    }
    const selectedSalle = this.salles.find(s => s.id === Number(salleId));
    this.selectedSalleCapacity = selectedSalle?.capacite ?? null;
  }

  checkCapacity(): void {
    if (this.selectedSalleCapacity !== null && this.selectedSectionStudentNumber !== null) {
      this.showCapacityWarning = this.selectedSectionStudentNumber > this.selectedSalleCapacity;
    } else {
      this.showCapacityWarning = false;
    }
    this.cdRef.markForCheck();
  }

  getSalleName(): string | undefined {
    const salleId = this.surveillanceForm.get('salleId')?.value;
    if (!salleId) return undefined;
    const salle = this.salles.find(s => s.id === Number(salleId));
    return salle?.numero;
  }

  getMatiereName(): string | undefined {
    const matiereId = this.surveillanceForm.get('matiereId')?.value;
    if (!matiereId) return undefined;
    const selectedMatiere = this.matieres.find(m => m.id === Number(matiereId));
    return selectedMatiere?.nom;
  }

  onSubmit(): void {
    if (this.surveillanceForm.invalid) {
      this.surveillanceForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.surveillanceForm.value;

    const formattedDateDebut = formatISOUTC(formValue.dateDebut);
    const formattedDateFin = formatISOUTC(formValue.dateFin);

    if (!formattedDateDebut || !formattedDateFin) {
      this.showError('Format de date invalide.');
      this.loading = false;
      return;
    }

    const surveillance: CreateSurveillancePayload = {
      salleId: formValue.salleId || null,
      matiereId: formValue.matiereId || null,
      dateDebut: formattedDateDebut!,
      dateFin: formattedDateFin!,
      sessionExamenId: this.data.sessionId,
      statut: formValue.statut
    };

    this.surveillanceService.createSurveillance(surveillance)
      .pipe(
        catchError(error => {
          console.error('Backend error:', error);
          let errorMsg = 'Erreur lors de la création de la surveillance.';

          if (error.error) {
            if (typeof error.error === 'object' && error.error.message) {
              errorMsg = error.error.message;
              if (errorMsg === "Il existe deja une surveillance dans cette salle pendant cette periode.") {
                errorMsg = "Il existe déjà une surveillance dans cette salle pendant cette période.";
              }
            } else if (typeof error.error === 'string') {
              errorMsg = error.error;
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
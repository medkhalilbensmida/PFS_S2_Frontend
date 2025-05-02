import { Component, Inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SurveillanceService, Surveillance, Salle, Matiere } from '../../../services/surveillance.service';
import { MaterialModule } from '../../../material.module';
import { CommonModule } from '@angular/common';
import { catchError, forkJoin, map, throwError } from 'rxjs';

// Remove explicit DTO imports if types come from service
// import { SalleDTO } from '../../../models/salle.dto';
// import { MatiereDTO } from '../../../models/matiere.dto';
// import { SectionDTO } from '../../../models/section.dto';

interface DialogData {
  sessionId: number;
}

// Interface for grouped matieres for the template
// Use the Matiere type defined in surveillance.service.ts
interface MatiereGroup {
  sectionName: string;
  matieres: Matiere[]; // Use Matiere type from service
}

// Interface for the payload sent to the API
// Reflects string dates and required statut
interface CreateSurveillancePayload {
  dateDebut: string;
  dateFin: string;
  statut: string;
  salleId?: number | null;
  // Assuming Matiere type from service has an 'id' property
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
  salles: Salle[] = []; // Use Salle type from service
  // Updated matieres property to hold grouped data
  matiereGroups: MatiereGroup[] = [];
  statutOptions: string[] = ['PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'];

  // Properties to display additional info
  selectedSalleCapacity: number | null = null;
  selectedMatiereStudentNumber: number | null = null;
  showCapacityWarning = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddSurveillanceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private surveillanceService: SurveillanceService,
    private snackBar: MatSnackBar,
    private cdRef: ChangeDetectorRef // Inject ChangeDetectorRef
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
    this.loadDropdownData();
    this.subscribeToSelectionChanges();
  }

  loadDropdownData(): void {
    this.loading = true;
    forkJoin({
      salles: this.surveillanceService.getAllSalles(),
      // Assuming getAllMatieres returns Matiere[] (from service type)
      matieres: this.surveillanceService.getAllMatieres()
    }).pipe(
      map(({ salles, matieres }) => {
        // Group matieres by section name
        // Use Matiere type from service
        const groups: { [key: string]: Matiere[] } = {};
        const ungroupedSectionName = 'Non classé'; // Name for matieres without section

        matieres.forEach(matiere => {
          // Access section assuming it exists on the Matiere type from service
          const sectionName = matiere.section ? matiere.section.name : ungroupedSectionName;
          if (!groups[sectionName]) {
            groups[sectionName] = [];
          }
          groups[sectionName].push(matiere);
        });

        // Convert grouped object into array for template, sorting if desired
        const matiereGroups = Object.keys(groups)
                                    .sort((a, b) => a === ungroupedSectionName ? 1 : b === ungroupedSectionName ? -1 : a.localeCompare(b)) // Put ungrouped last
                                    .map(sectionName => ({ sectionName, matieres: groups[sectionName] }));

        return { salles, matiereGroups };
      }),
      catchError(error => {
        console.error('Error loading dropdown data:', error);
        this.showError('Erreur lors du chargement des données pour les menus déroulants.');
        this.loading = false;
        this.cdRef.markForCheck(); // Trigger change detection on error
        return throwError(() => new Error('Failed to load dropdown data'));
      })
    ).subscribe(({ salles, matiereGroups }) => {
      this.salles = salles;
      this.matiereGroups = matiereGroups;
      this.loading = false;
      this.cdRef.markForCheck(); // Trigger change detection after loading
    });
  }

  subscribeToSelectionChanges(): void {
    this.surveillanceForm.get('salleId')?.valueChanges.subscribe(salleId => {
      this.updateSalleCapacity(salleId);
      this.checkCapacity();
    });

    this.surveillanceForm.get('matiereId')?.valueChanges.subscribe(matiereId => {
      this.updateMatiereStudentNumber(matiereId);
      this.checkCapacity();
    });
  }

  updateSalleCapacity(salleId: number | string | null): void {
    if (!salleId) {
      this.selectedSalleCapacity = null;
      return;
    }
    // Use Salle type from service (assuming it has capacite)
    const selectedSalle = this.salles.find(s => s.id === Number(salleId));
    this.selectedSalleCapacity = selectedSalle?.capacite ?? null;
  }

  updateMatiereStudentNumber(matiereId: number | string | null): void {
     if (!matiereId) {
        this.selectedMatiereStudentNumber = null;
        return;
     }
     // Need to search through the groups
     // Use Matiere type from service
     let selectedMatiere: Matiere | undefined;
     for (const group of this.matiereGroups) {
        selectedMatiere = group.matieres.find(m => m.id === Number(matiereId));
        if (selectedMatiere) break;
     }
     // Access studentNumber assuming it exists on section property of Matiere type
     this.selectedMatiereStudentNumber = selectedMatiere?.section?.studentNumber ?? null;
  }

  checkCapacity(): void {
    if (this.selectedSalleCapacity !== null && this.selectedMatiereStudentNumber !== null) {
      this.showCapacityWarning = this.selectedMatiereStudentNumber > this.selectedSalleCapacity;
    } else {
      // Hide warning if either salle or matiere (or its section) is not selected
      this.showCapacityWarning = false;
    }
    this.cdRef.markForCheck(); // Trigger change detection
  }

  getSalleName(): string | undefined {
      const salleId = this.surveillanceForm.get('salleId')?.value;
      if (!salleId) return undefined;
      const salle = this.salles.find(s => s.id === Number(salleId));
      return salle?.numero; // Use optional chaining, assuming 'numero' exists
  }

  getMatiereName(): string | undefined {
      const matiereId = this.surveillanceForm.get('matiereId')?.value;
      if (!matiereId) return undefined;
      let selectedMatiere: Matiere | undefined;
      for (const group of this.matiereGroups) {
          selectedMatiere = group.matieres.find(m => m.id === Number(matiereId));
          if (selectedMatiere) break;
      }
      return selectedMatiere?.nom; // Use optional chaining, assuming 'nom' exists
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
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { SurveillanceService, Surveillance, Enseignant, AssignmentRequest } from '../../services/surveillance.service';
import { MaterialModule } from '../../material.module';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-surveillance-assignment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule
  ],
  templateUrl: './surveillance-assignment.component.html',
  styleUrls: ['./surveillance-assignment.component.scss']
})
export class SurveillanceAssignmentComponent implements OnInit {
  surveillances: Surveillance[] = [];
  enseignants: Enseignant[] = [];
  assignForm: FormGroup;
  selectedSurveillanceId: number | null = null;
  loading = false;
  sessionId: number | null = null;
  
  constructor(
    private surveillanceService: SurveillanceService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) {
    this.assignForm = this.fb.group({
      surveillanceId: ['', Validators.required],
      enseignantPrincipalId: [''],
      enseignantSecondaireId: ['']
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('sessionId');
      this.sessionId = id ? +id : null;
      this.loadSurveillances();
    });

    this.loadEnseignants();

    this.assignForm.get('surveillanceId')?.valueChanges.subscribe(value => {
      if (value) {
        this.selectedSurveillanceId = value;
        const surveillance = this.surveillances.find(s => s.id === value);
        if (surveillance) {
          this.assignForm.patchValue({
            enseignantPrincipalId: surveillance.enseignantPrincipalId || '',
            enseignantSecondaireId: surveillance.enseignantSecondaireId || ''
          });
        }
      }
    });
  }

  loadSurveillances(): void {
    this.loading = true;
    let surveillanceObservable: Observable<Surveillance[]>;

    if (this.sessionId !== null) {
      surveillanceObservable = this.surveillanceService.getSurveillancesBySessionId(this.sessionId);
    } else {
      surveillanceObservable = this.surveillanceService.getAllSurveillances();
    }

    surveillanceObservable.pipe(
      catchError(error => {
        const message = this.sessionId 
          ? `Impossible de charger les surveillances pour la session ${this.sessionId}`
          : 'Impossible de charger les surveillances';
        this.showError(message);
        this.loading = false;
        return throwError(() => error);
      })
    )
    .subscribe(data => {
      this.surveillances = data;
      this.loading = false;
      this.assignForm.reset();
      this.selectedSurveillanceId = null;
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

  onSubmit(): void {
    if (this.assignForm.invalid || !this.selectedSurveillanceId) {
      return;
    }

    const requestData: AssignmentRequest = {
      enseignantPrincipalId: this.assignForm.value.enseignantPrincipalId || null,
      enseignantSecondaireId: this.assignForm.value.enseignantSecondaireId || null
    };

    this.loading = true;
    this.surveillanceService.assignEnseignants(this.selectedSurveillanceId, requestData)
      .pipe(
        catchError(error => {
          const message = error.error || 'Une erreur est survenue lors de l\'affectation';
          this.showError(message);
          this.loading = false;
          return throwError(() => error);
        })
      )
      .subscribe(response => {
        this.showSuccess('Affectation réussie');
        this.loadSurveillances();
        this.loading = false;
      });
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
    return this.surveillanceService.getEnseignantFullName(id, this.enseignants);
  }

  formatDate(date: Date): string {
    return this.surveillanceService.formatDate(date);
  }
}

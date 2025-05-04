import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../material.module';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ReportService } from '../../services/report.service';
import { catchError, debounceTime, distinctUntilChanged, finalize, switchMap } from 'rxjs/operators';
import { forkJoin, of, throwError } from 'rxjs';
import { Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { SurveillanceService, Enseignant } from '../../services/surveillance.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';




export enum Semestre {
  S1 = 'S1',
  S2 = 'S2'
}

export enum TypeSession {
  DS = 'DS',
  PRINCIPALE = 'PRINCIPALE',
  RATTRAPAGE = 'RATTRAPAGE'
}

export interface AnneeUniversitaire {
  id: number;
  dateDebut: string;
  dateFin: string;
  estActive: boolean;
}

@Component({
  selector: 'app-report-generation',
  standalone: true,
  imports: [
    MaterialModule, 
    CommonModule, 
    ReactiveFormsModule,
    MatAutocompleteModule
  ],  templateUrl: './report-generation.component.html',
  styleUrls: ['./report-generation.component.scss']
})
export class ReportGenerationComponent implements OnInit {
  filterForm: FormGroup;
  loading = false;
  semestres = Object.values(Semestre);
  typeSessions = Object.values(TypeSession);
  matcher = new InstantErrorStateMatcher();
  filteredTeachers: Enseignant[] = [];
  loadingTeachers = false;
  teachers: Enseignant[] = [];
  anneesUniversitaires: AnneeUniversitaire[] = [];
  loadingAnnees = false;


  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private reportService: ReportService,
    private surveillanceService: SurveillanceService
  ) {
    this.filterForm = this.fb.group({
      anneeUniversitaire: [''],
      semestre: [''],
      typeSession: [''],
      enseignantId: ['']
    });
  }

  ngOnInit(): void {
    this.loadAnneesUniversitaires();
    this.setupTeacherFiltering();
  }


  private loadAnneesUniversitaires(): void {
    this.loadingAnnees = true;
    this.reportService.getAnneesUniversitaires().pipe(
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      }),
      finalize(() => this.loadingAnnees = false)
    ).subscribe({
      next: (annees) => {
        this.anneesUniversitaires = annees;
        // Optionally set the active year as default
        const activeYear = annees.find(a => a.estActive);
        if (activeYear) {
          this.filterForm.patchValue({
            anneeUniversitaire: `${activeYear.dateDebut.split('-')[0]}-${activeYear.dateFin.split('-')[0]}`
          });
        }
      },
      error: (error) => {
        console.error('Error loading academic years:', error);
      }
    });
  }

  private setupTeacherFiltering(): void {
    console.log("Setting up teacher filtering");
    
    // Initial load (optional)
    this.loadInitialTeachers();
  
    // Reactive filtering
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(() => {
        const params = this.getFilterParams();
        console.log("Filter params changed:", params);
        
        if (params['anneeUniversitaire'] || params['semestre'] || params['typeSession'] || true) {
          this.loadingTeachers = true;
          return this.reportService.getTeachersWithSurveillances(params).pipe(
            catchError(err => {
              console.error('Error loading teachers:', err);
              this.showError('Erreur lors du chargement des enseignants');
              return of([]);
            })
          );
        } else {
          this.filteredTeachers = [];
          return of([]);
        }
      })
    ).subscribe({
      next: (teachers) => {
        console.log("Teachers loaded:", teachers);
        this.teachers = teachers;
        this.filteredTeachers = [...teachers];
        this.loadingTeachers = false;
      },
      error: (error) => {
        console.error("Error in teacher filtering:", error);
        this.handleError(error);
        this.loadingTeachers = false;
      }
    });
  }
  
  private loadInitialTeachers(): void {
    const initialParams = this.getFilterParams();
    if (initialParams['anneeUniversitaire'] || initialParams['semestre'] || initialParams['typeSession'] || true) {
      this.loadingTeachers = true;
      this.reportService.getTeachersWithSurveillances(initialParams).subscribe({
        next: (teachers) => {
          this.teachers = teachers;
          this.filteredTeachers = [...teachers];
          this.loadingTeachers = false;
        },
        error: (err) => {
          console.error('Initial teacher load failed:', err);
          this.loadingTeachers = false;
        }
      });
    }
  }

  exportToExcel(): void {
    this.loading = true;
    const params = this.getFilterParams();
    
    this.reportService.exportToExcel(params)
      .pipe(
        catchError(error => {
          this.handleError(error);
          return throwError(() => error);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe(blob => {
        this.downloadFile(blob, 'surveillances.xlsx');
      });
  }

  exportToCsv(): void {
    this.loading = true;
    const params = this.getFilterParams();
    
    this.reportService.exportToCsv(params)
      .pipe(
        catchError(error => {
          this.handleError(error);
          return throwError(() => error);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe(blob => {
        this.downloadFile(blob, 'surveillances.csv');
      });
  }
  

  

  onEnseignantSelected(event: any): void {
    const enseignant = event.option.value;
    if (enseignant && enseignant.prenom && enseignant.nom) {
      this.filterForm.patchValue({
        enseignantId: enseignant.id,
        searchEnseignant: `${enseignant.prenom} ${enseignant.nom}`
      }, { emitEvent: false });
    }
  }

  filterEnseignants(event: any): void {
    const searchValue = typeof event === 'string' 
      ? event.toLowerCase()
      : event?.target?.value?.toLowerCase() || '';
      
    this.filteredEnseignants = this.enseignants.filter(enseignant =>
      enseignant.prenom && enseignant.nom && 
      `${enseignant.prenom} ${enseignant.nom}`.toLowerCase().includes(searchValue)
    );
  }

  displayEnseignant = (enseignant: Enseignant | string | null): string => {
    if (!enseignant) return '';
    if (typeof enseignant === 'string') return enseignant;
    return enseignant.prenom && enseignant.nom ? `${enseignant.prenom} ${enseignant.nom}` : '';
  }


  

  generateConvocation(): void {
    const { enseignantId, ...params } = this.filterForm.value;
    if (!enseignantId) {
      this.showError('Veuillez sélectionner un enseignant');
      return;
    }

    this.loading = true;
    
    this.reportService.generateConvocation(enseignantId, params)
      .pipe(
        catchError(error => {
          this.handleError(error);
          return throwError(() => error);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe(blob => {
        this.downloadFile(blob, 'convocation.pdf');
      });
  }


  generateAllConvocations(): void {
    this.loading = true;
    const params = this.getFilterParams();
    
    this.reportService.generateAllConvocations(params)
      .pipe(
        catchError(error => {
          this.handleError(error);
          return throwError(() => error);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe(blob => {
        this.downloadFile(blob, 'all_convocations.pdf');
      });
  }

  private getFilterParams() {
    const { enseignantId, ...params } = this.filterForm.value;
    return Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== null && value !== '')
    );
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
    this.showSuccess(`${filename} téléchargé avec succès`);
  }

  // Add these methods to your ReportGenerationComponent class
// Update sendEmailToSelectedTeacher
sendEmailToSelectedTeacher(): void {
  const enseignantId = this.filterForm.get('enseignantId')?.value;
  if (!enseignantId) {
    this.showError('Veuillez sélectionner un enseignant');
    return;
  }

  const selectedTeacher = this.teachers.find(t => t.id === enseignantId);
  if (!selectedTeacher) {
    this.showError('Enseignant non trouvé');
    return;
  }

  this.loading = true;
  const params = this.getFilterParams();

  const emailData = {
    toEmail: selectedTeacher.email,
    subject: 'Convocation pour surveillance d\'examen',
    template: 'convocation-email',
    enseignantId: selectedTeacher.id,
    professorName: `${selectedTeacher.prenom} ${selectedTeacher.nom}`,
    message: 'Veuillez trouver ci-joint votre convocation pour les surveillances d\'examen.',
    date: new Date(),
    anneeUniversitaire: params['anneeUniversitaire'],
    semestre: params['semestre'],
    typeSession: params['typeSession']
  };

  this.reportService.sendConvocationEmail(emailData).pipe(
    catchError(error => {
      this.handleError(error);
      return throwError(() => error);
    }),
    finalize(() => this.loading = false)
  ).subscribe({
    next: (response) => {
      console.log('Email sent response:', response);
      this.showSuccess(`Email envoyé à ${selectedTeacher.prenom} ${selectedTeacher.nom}`);
    }
  });
}

// Update sendEmailToAllFilteredTeachers
sendEmailToAllFilteredTeachers(): void {
  if (this.filteredTeachers.length === 0) {
    this.showError('Aucun enseignant à qui envoyer');
    return;
  }

  this.loading = true;
  const params = this.getFilterParams();
  const requests = this.filteredTeachers.map(teacher => {
    const emailData = {
      toEmail: teacher.email,
      subject: 'Convocation pour surveillance d\'examen',
      template: 'convocation-email',
      enseignantId: teacher.id,
      professorName: `${teacher.prenom} ${teacher.nom}`,
      message: 'Veuillez trouver ci-joint votre convocation pour les surveillances d\'examen.',
      date: new Date(),
      anneeUniversitaire: params['anneeUniversitaire'],
      semestre: params['semestre'],
      typeSession: params['typeSession']
    };
    return this.reportService.sendConvocationEmail(emailData).pipe(
      catchError(error => {
        // Continue with other requests even if one fails
        console.error(`Failed to send email to ${teacher.email}`, error);
        return of(`Failed to send to ${teacher.email}`);
      })
    );
  });

  forkJoin(requests).pipe(
    finalize(() => this.loading = false)
  ).subscribe({
    next: (responses) => {
      const successCount = responses.filter(r => typeof r === 'string' && r.startsWith('Convocation email sent successfully')).length;
      const failedCount = this.filteredTeachers.length - successCount;
      
      if (failedCount === 0) {
        this.showSuccess(`Emails envoyés avec succès à ${successCount} enseignants`);
      } else {
        this.showSuccess(`Emails envoyés: ${successCount} succès, ${failedCount} échecs`);
      }
    }
  });
}

  private handleError(error: any): void {
    console.error('Error:', error);
    let message = 'Une erreur est survenue';
    
    if (error.status === 401) {
      message = 'Session expirée. Veuillez vous reconnecter.';
    } else if (error.status === 403) {
      message = 'Vous n\'avez pas les permissions nécessaires.';
    } else if (error.error?.message) {
      message = error.error.message;
    }
    
    this.showError(message);
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  displayTeacherName(teacherId: number): string {
    if (!teacherId) return '';
    const teacher = this.teachers.find(t => t.id === teacherId);
    return teacher ? `${teacher.prenom} ${teacher.nom}` : '';
  }
}

export class InstantErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
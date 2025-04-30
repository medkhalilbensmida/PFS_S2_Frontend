import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../material.module';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ReportService } from '../../services/report.service';
import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';

export enum Semestre {
  S1 = 'S1',
  S2 = 'S2'
}

export enum TypeSession {
  DS = 'DS',
  EXAMEN = 'EXAMEN',
  RATTRAPAGE = 'RATTRAPAGE'
}

@Component({
  selector: 'app-report-generation',
  standalone: true,
  imports: [MaterialModule, CommonModule, ReactiveFormsModule],
  templateUrl: './report-generation.component.html',
  styleUrls: ['./report-generation.component.scss']
})
export class ReportGenerationComponent implements OnInit {
  filterForm: FormGroup;
  loading = false;
  semestres = Object.values(Semestre);
  typeSessions = Object.values(TypeSession);

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private reportService: ReportService
  ) {
    this.filterForm = this.fb.group({
      anneeUniversitaire: [''],
      semestre: [''],
      typeSession: [''],
      enseignantId: ['']
    });
  }

  ngOnInit(): void {}

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

  generateConvocation(): void {
    const { enseignantId, ...params } = this.filterForm.value;
    if (!enseignantId) {
      this.showError('Veuillez saisir l\'ID de l\'enseignant');
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
}
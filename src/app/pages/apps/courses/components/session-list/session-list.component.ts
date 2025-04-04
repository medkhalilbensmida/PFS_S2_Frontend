import { Component, OnInit, ViewChild } from '@angular/core';
import { SessionExamenService } from '../../services/session.service';
import { SessionExamen } from '../../models/session.model';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ColorService } from '../../services/color.service';
import { AuthService } from '../../../../authentication/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { CreateSessionDialogComponent } from '../create-session-dialog/create-session-dialog.component';
import { RouterModule } from '@angular/router';
import { EditSessionDialogComponent } from '../edit-session-dialog/edit-session-dialog.component';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-session-list',
  templateUrl: './session-list.component.html',
  styleUrls: ['./session-list.component.scss'],
  standalone: true,
  imports: [
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatDividerModule,
    TablerIconsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatChipsModule,
    MatCheckboxModule
  ],
})
export class SessionListComponent implements OnInit {
  sessions: SessionExamen[] = [];
  allSessions: SessionExamen[] = [];
  isLoading = false;
  error: string | null = null;
  searchText: string = '';
  filterActiveOnly: boolean = false;

  @ViewChild('searchInput') searchInput: any;

  constructor(
    private sessionService: SessionExamenService,
    public colorService: ColorService,
    public authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar 
  ) { }

  ngOnInit(): void {
    this.loadSessions();
  }

  openCreateSessionDialog(): void {
    const dialogRef = this.dialog.open(CreateSessionDialogComponent, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadSessions();
      }
    });
  }

  openEditSessionDialog(session: SessionExamen): void {
    const dialogRef = this.dialog.open(EditSessionDialogComponent, {
      width: '500px',
      data: { session: session }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadSessions();
      }
    });
  }

  loadSessions(): void {
    this.isLoading = true;
    this.error = null;

    this.sessionService.getSessions().subscribe({
      next: (data: SessionExamen[]) => {
        this.allSessions = data.sort((a, b) => 
          new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime()
        );
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error: any) => {
        this.error = error.status === 401 
          ? 'Authentification requise. Veuillez vous reconnecter.' 
          : 'Erreur lors du chargement des sessions.';
        this.isLoading = false;
        console.error('Erreur:', error);
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchText = filterValue;
    this.applyFilters();
  }

applyFilters(): void {
  let filteredSessions = [...this.allSessions];
  
  if (this.searchText?.trim()) {
    const searchTerm = this.searchText.toLowerCase().trim();
    filteredSessions = filteredSessions.filter(s => 
      s.type.toLowerCase().includes(searchTerm) || 
      s.numSemestre.toString().toLowerCase().includes(searchTerm)
    );
  }
  
  if (this.filterActiveOnly) {
    filteredSessions = filteredSessions.filter(s => s.estActive === true);
  }
  
  this.sessions = filteredSessions;
}

toggleActiveFilter(): void {
  this.filterActiveOnly = !this.filterActiveOnly;
  
  this.applyFilters();
  
  console.log('Filtre actif:', this.filterActiveOnly, 'Sessions:', this.sessions.length);
}


// Modifiez la méthode clearSearch :
clearSearch(): void {
  this.searchText = '';
  this.applyFilters();
}

  deleteSession(sessionId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
        this.sessionService.deleteSession(sessionId).subscribe({
            next: (response) => {
                this.allSessions = this.allSessions.filter(s => s.id !== sessionId);
                this.sessions = this.sessions.filter(s => s.id !== sessionId);
                if (this.searchInput?.nativeElement) {
                    this.searchInput.nativeElement.value = '';
                }
                this.snackBar.open(response?.message || 'Session supprimée avec succès', 'Fermer', { 
                    duration: 3000,
                    panelClass: ['success-snackbar']
                });
            },
            error: (error) => {
                console.error('Erreur détaillée:', error);
                const errorMessage = error?.error?.message || 
                                  error?.message || 
                                  'Erreur lors de la suppression';
                
                this.snackBar.open(errorMessage, 'Fermer', { 
                    duration: 5000,
                    panelClass: ['error-snackbar']
                });
            }
        });
    }
  }


  
  storeSessionInLocalStorage(session: SessionExamen): void {
    localStorage.setItem('currentSession', JSON.stringify(session));
  }

  getHeaderColor(type: string): string {
    const colors: { [key: string]: string } = {
      'DS': '#5c6bc0',
      'PRINCIPALE': '#6fa78a',
      'RATTRAPAGE': '#ffa726'
    };
    return colors[type] || '#3f51b5';
  }

  getSessionTypeLabel(type: string): string {
    const types: { [key: string]: string } = {
      'DS': 'Devoir Surveillé',
      'PRINCIPALE': 'Session Principale',
      'RATTRAPAGE': 'Session de Rattrapage'
    };
    return types[type] || type;
  }
}
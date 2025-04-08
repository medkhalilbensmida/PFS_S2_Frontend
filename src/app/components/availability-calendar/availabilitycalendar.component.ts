
import { map, catchError, finalize } from 'rxjs/operators';

import { forkJoin } from 'rxjs';
import { SurveillanceService, Surveillance, DisponibiliteEnseignantDTO } from '../../services/surveillance.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  Component,
  ChangeDetectionStrategy,
  Inject,
  TemplateRef,
  OnInit,
} from '@angular/core';
import { CommonModule, DOCUMENT, NgSwitch } from '@angular/common';
import {
  MatDialog,
  MatDialogRef,
  MatDialogConfig,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  UntypedFormGroup,
} from '@angular/forms';
import { FormControl, Validators } from '@angular/forms';
//import { CalendarFormDialogComponent } from './calendar-form-dialog/calendar-form-dialog.component';
import {
  startOfDay,
  endOfDay,
  subDays,
  addDays,
  endOfMonth,
  isSameDay,
  isSameMonth,
  addHours,
} from 'date-fns';
import { Subject } from 'rxjs';
import {
  CalendarDateFormatter,
  CalendarEvent,
  CalendarEventAction,
  CalendarEventTimesChangedEvent,
  CalendarModule,
  CalendarView,
} from 'angular-calendar';
import { MaterialModule } from 'src/app/material.module';
import {
  MatNativeDateModule,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Nl2brPipe } from 'src/app/pipe/nl2br.pipe';
import { AuthService } from 'src/app/pages/authentication/services/auth.service';

const colors: any = {
  red: {
    primary: '#fa896b',
    secondary: '#fdede8',
  },
  blue: {
    primary: '#5d87ff',
    secondary: '#ecf2ff',
  },
  yellow: {
    primary: '#ffae1f',
    secondary: '#fef5e5',
  },
  green: {
    primary: '#4CAF50',
    secondary: '#E8F5E9',
  },
  grey: {
    primary: '#9E9E9E',
    secondary: '#F5F5F5',
  },
  purple: {
    primary: '#9C27B0',
    secondary: '#F3E5F5',
  }
};

@Component({
  selector: 'app-calendar-dialog',
  templateUrl: './dialog.component.html',
  standalone: true,
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatNativeDateModule,
    MatDialogModule,
    MatDatepickerModule,
  ],
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarDialogComponent {
  options!: UntypedFormGroup;

  constructor(
    public dialogRef: MatDialogRef<CalendarDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }
}

@Component({
  selector: 'app-availabilitycalendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './availabilitycalendar.component.html',
  styleUrls: ['./availabilitycalendar.component.scss'],
  standalone: true,
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    NgSwitch,
    CalendarModule,
    CommonModule,
    MatDatepickerModule,
    MatDialogModule, MatFormFieldModule,
    Nl2brPipe
  ],
  providers: [provideNativeDateAdapter(), CalendarDateFormatter],
})
export class AppAvailabilitycalendarComponent implements OnInit {
[x: string]: any;
  dialogRef: MatDialogRef<CalendarDialogComponent> = Object.create(TemplateRef);
  //dialogRef2: MatDialogRef<CalendarFormDialogComponent> =Object.create(TemplateRef);

  lastCloseResult = '';
  actionsAlignment = '';

  config: MatDialogConfig = {
    disableClose: false,
    width: '',
    height: '',
    position: {
      top: '',
      bottom: '',
      left: '',
      right: '',
    },
    data: {
      action: '',
      event: [],
    },
  };
  numTemplateOpens = 0;

  view: any = 'month';
  viewDate: Date = new Date();

  actions: CalendarEventAction[] = [
    {
      label: '<span class="text-white link m-l-5">: Edit</span>',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.handleEvent('Edit', event);
      },
    },
    {
      label: '<span class="text-danger m-l-5">Delete</span>',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.events = this.events.filter((iEvent) => iEvent !== event);
        this.handleEvent('Deleted', event);
      },
    },
  ];

  refresh: Subject<any> = new Subject();

  events: CalendarEvent[] = [
    /*{
      start: subDays(startOfDay(new Date()), 1),
      end: addDays(new Date(), 1),
      title: 'A 3 day event',
      color: colors.red,
      actions: this.actions,
    },
    {
      start: startOfDay(new Date()),
      title: 'An event with no end date',
      color: colors.blue,
      actions: this.actions,
    },
    {
      start: subDays(endOfMonth(new Date()), 3),
      end: addDays(endOfMonth(new Date()), 3),
      title: 'A long event that spans 2 months',
      color: colors.blue,
    },
    {
      start: addHours(startOfDay(new Date()), 2),
      end: new Date(),
      title: 'A draggable and resizable event',
      color: colors.yellow,
      actions: this.actions,
      resizable: {
        beforeStart: true,
        afterEnd: true,
      },
      draggable: true,
    },*/
  ];

  activeDayIsOpen = false;
  surveillances: Surveillance[] = [];
  disponibilites: Map<number, boolean> = new Map();
  loading = false;

 

  constructor(
    private dialog: MatDialog,
    @Inject(DOCUMENT) private document: Document,
    private surveillanceService: SurveillanceService,
    private snackBar: MatSnackBar,
    private authService: AuthService // Add AuthService


  ) {}

    /*--------------*/
    ngOnInit() {
      // ...existing calendar init code...
      this.loadSurveillances();
    }
    /*--------------*/

    dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
      if (isSameMonth(date, this.viewDate)) {
        if (
          (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
          events.length === 0
        ) {
          this.activeDayIsOpen = false;
        } else if (events.length > 0) { // Only open if there are events
          this.activeDayIsOpen = true;
          this.viewDate = date;
        }
      }
    }
 

  eventTimesChanged({
    event,
    newStart,
    newEnd,
  }: CalendarEventTimesChangedEvent): void {
    this.events = this.events.map((iEvent) => {
      if (iEvent === event) {
        return {
          ...event,
          start: newStart,
          end: newEnd,
        };
      }
      return iEvent;
    });

    this.handleEvent('Dropped or resized', event);
  }

  handleEvent(action: string, event: CalendarEvent): void {
    if (event.meta?.surveillance && event.meta.canToggle) {
      this.toggleDisponibilite(event.meta.surveillance.id);
    } else if (event.meta?.surveillance) {
      // Show tooltip message for non-clickable events
      this.showError(this.getButtonTooltip(event.meta.surveillance));
    }
  }


  deleteEvent(eventToDelete: CalendarEvent): void {
    this.events = this.events.filter((event) => event !== eventToDelete);
  }

  setView(view: CalendarView): void {
    this.view = view;
  }
  closeOpenMonthViewDay() {
    this.activeDayIsOpen = false;
  }



  /*--------------*/
  loadSurveillances() {
    this.loading = true;
    const currentUser = this.authService.getUserData();
    
    forkJoin({
      all: this.surveillanceService.getAllSurveillances(),
      my: this.surveillanceService.getMyDisponibilites()
    })
    .pipe(
      finalize(() => this.loading = false)
    )
    .subscribe({
      next: ({ all, my }) => {
        // Check if user is an enseignant
        if (currentUser && currentUser.role === 'ROLE_ENSEIGNANT') {
          const currentEnseignantId = currentUser.id;
          
          // Filter surveillances
          this.surveillances = all.filter(surveillance => 
            // Show EN_COURS to everyone
            surveillance.statut === 'EN_COURS' ||
            // Show other statuses only if they are assigned as principal or secondairy teacher
            ((surveillance.enseignantPrincipalId === currentEnseignantId || surveillance.enseignantSecondaireId === currentEnseignantId) && 
             ['PLANIFIEE', 'TERMINEE', 'ANNULEE'].includes(surveillance.statut))
          );
        } else {
          // For admin or other roles, show all surveillances
          this.surveillances = all;
        }
        
        this.loadDisponibilites();
      },
      error: (error) => {
        console.error('Error loading surveillances:', error);
        this.showError('Erreur lors du chargement des surveillances');
      }
    });
}
// Add this method declaration
loadDisponibilites(): void {
  if (this.surveillances.length > 0) {
    console.log('Loading disponibilites...');
    this.surveillanceService.getMyDisponibilites()
      .subscribe({
        next: (disponibilites) => {
          console.log('Loaded disponibilites:', disponibilites);
          this.disponibilites = new Map(
            disponibilites.map(d => [d.surveillanceId!, d.estDisponible])
          );
          console.log('Updated disponibilites map:', Array.from(this.disponibilites.entries()));
          this.updateCalendarEvents();
        },
        error: (error) => {
          console.error('Error loading disponibilites:', error);
          this.showError('Erreur lors du chargement des disponibilités');
        }
      });
  }
}

// Add helper method to check if user is concerned teacher
isConcernedTeacher(surveillance: Surveillance): boolean {
  const currentUser = this.authService.getUserData();
  return currentUser?.role === 'ROLE_ENSEIGNANT' && 
         surveillance.enseignantPrincipalId === currentUser.id;
}
// Update button visibility logic
shouldShowButton(surveillance: Surveillance): boolean {
  const currentUser = this.authService.getUserData();
  return surveillance.statut === 'EN_COURS' && 
         currentUser?.role === 'ROLE_ENSEIGNANT';
}

// Update tooltip logic
getButtonTooltip(surveillance: Surveillance): string {
  const currentUser = this.authService.getUserData();
  
  if (currentUser?.role !== 'ROLE_ENSEIGNANT') {
    return 'Seuls les enseignants peuvent gérer les disponibilités';
  }
  
  if (surveillance.statut !== 'EN_COURS') {
    switch(surveillance.statut) {
      case 'PLANIFIEE':
        return 'Cette surveillance est déjà planifiée';
      case 'TERMINEE':
        return 'Cette surveillance est déjà terminée';
      case 'ANNULEE':
        return 'Cette surveillance a été annulée';
      default:
        return `Cette surveillance est ${surveillance.statut.toLowerCase()}`;
    }
  }
  
  return this.disponibilites.get(surveillance.id) 
    ? 'Cliquez pour annuler votre disponibilité' 
    : 'Cliquez pour marquer votre disponibilité';
}



  createEventTitle(surveillance: Surveillance): string {
    const dateDebut = this.surveillanceService.formatDate(surveillance.dateDebut);
    const dateFin = this.surveillanceService.formatDate(surveillance.dateFin);
    const salle = surveillance.salleName || (surveillance.salleId ? `Salle ${surveillance.salleId}` : 'Salle non définie');
    const matiere = surveillance.matiereName || (surveillance.matiereId ? `Matière ${surveillance.matiereId}` : 'Matière non définie');
    
    let title = `Début: ${dateDebut}
  Fin: ${dateFin}
  Salle: ${salle}
  Matière: ${matiere}
  Statut: ${surveillance.statut}`;
  
    // Only show disponibilité for EN_COURS and PLANIFIEE status
    if (!['TERMINEE', 'ANNULEE','PLANIFIEE'].includes(surveillance.statut)) {
      const status = this.disponibilites.get(surveillance.id) ? 'Disponible' : 'Non disponible';
      title += `\nDisponibilité: ${status}`;
    }
  
    return title;
  }

  updateCalendarEvents() {
    this.events = this.surveillances.map(surveillance => {
      const isDisponible = this.disponibilites.get(surveillance.id);
      let eventColor;
      let canToggle = false;
  
      // Determine color and toggleability based on status
      switch(surveillance.statut) {
        case 'EN_COURS':
          eventColor = isDisponible ? colors.green : colors.red;
          canToggle = true;
          break;
        case 'PLANIFIEE':
          eventColor = colors.blue;
          canToggle = false;
          break;
        case 'TERMINEE':
          eventColor = colors.purple;
          canToggle = false;
          break;
        case 'ANNULEE':
          eventColor = colors.grey;
          canToggle = false;
          break;
        default:
          eventColor = colors.yellow;
          canToggle = false;
      }
  
      return {
        id: surveillance.id,
        start: new Date(surveillance.dateDebut),
        end: new Date(surveillance.dateFin),
        title: this.createEventTitle(surveillance),
        color: eventColor,
        meta: {
          surveillance,
          isDisponible,
          canToggle
        }
      };
    });
    this.refresh.next(null);
  }

  // In availabilitycalendar.component.ts

toggleDisponibilite(surveillanceId: number): void {
  if (!surveillanceId) return;

  const currentUser = this.authService.getUserData();
  console.log('Current user:', currentUser);
  
  const isCurrentlyDisponible = this.disponibilites.get(surveillanceId);
  console.log(`Current disponibilite for surveillance ${surveillanceId}:`, isCurrentlyDisponible);
  console.log('User making request:', currentUser?.id);
  
  const action = isCurrentlyDisponible 
    ? this.surveillanceService.cancelDisponibilite(surveillanceId)
    : this.surveillanceService.markDisponibilite(surveillanceId);

  action
    .pipe(
      catchError((error: any) => {
        console.error('Error toggling disponibilite:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          user: currentUser
        });
        
        let message;
        if (error.status === 403) {
          message = 'Vous devez être connecté en tant qu\'enseignant pour effectuer cette action';
        } else if (error.status === 400) {
          message = 'Impossible de modifier la disponibilité. Vérifiez vos permissions.';
        } else {
          message = 'Erreur lors de la modification de la disponibilité';
        }
        this.showError(message);
        return throwError(() => error);
      })
    )
    .subscribe(
      (response: any) => {
        console.log('Toggle disponibilite response:', response);
        console.log('Response user ID:', response.enseignantId);
        console.log('Current user ID:', currentUser?.id);
        
        if (response && typeof response.estDisponible === 'boolean') {
          console.log(`Updating local state for surveillance ${surveillanceId} to:`, response.estDisponible);
          this.disponibilites.set(surveillanceId, response.estDisponible);
          this.updateCalendarEvents();
          
          const message = response.estDisponible 
            ? 'Vous êtes maintenant disponible pour cette surveillance'
            : 'Vous n\'êtes plus disponible pour cette surveillance';
          this.showSuccess(message);
        } else {
          console.error('Invalid response format:', response);
          this.showError('Réponse invalide du serveur');
          this.loadDisponibilites();
        }
      },
      error => {
        console.error('Error in subscription:', error);
      }
    );
}
  


  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

}
function throwError(arg0: () => any): any {
  throw new Error('Function not implemented.');
}




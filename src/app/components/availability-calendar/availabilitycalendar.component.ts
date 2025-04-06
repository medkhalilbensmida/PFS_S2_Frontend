
import { map, catchError, finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { SurveillanceService, Surveillance } from '../../services/surveillance.service';
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
    private snackBar: MatSnackBar
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
    if (event.meta?.surveillance) {
      this.toggleDisponibilite(event.meta.surveillance.id);
    }
  }
  

  /*addEvent(): void {
    this.dialogRef2 = this.dialog.open(CalendarFormDialogComponent, {
      panelClass: 'calendar-form-dialog',
      data: {
        action: 'add',
        date: new Date(),
      },
    });
    this.dialogRef2.afterClosed().subscribe((res) => {
      if (!res) {
        return;
      }
      const dialogAction = res.action;
      const responseEvent = res.event;
      responseEvent.actions = this.actions;
      this.events.push(responseEvent);
      this.dialogRef2 = Object.create(null);
      this.refresh.next(res);
    });
  }*/

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
    this.surveillanceService.getAllSurveillances()
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (surveillances) => {
          console.log('Loaded surveillances:', surveillances);
          this.surveillances = surveillances;
          this.loadDisponibilites();
        },
        error: (error) => {
          console.error('Error loading surveillances:', error);
          this.showError('Erreur lors du chargement des surveillances');
        }
      });
  }

  loadDisponibilites() {
    if (!this.surveillances.length) {
      return;
    }

    const disponibiliteChecks = this.surveillances.map(surveillance =>
      this.surveillanceService.checkDisponibilite(surveillance.id).pipe(
        map(isDisponible => ({ surveillanceId: surveillance.id, isDisponible }))
      )
    );

    forkJoin(disponibiliteChecks)
      .subscribe({
        next: (results) => {
          results.forEach(result => {
            this.disponibilites.set(result.surveillanceId, result.isDisponible);
          });
          this.updateCalendarEvents();
        },
        error: (error) => {
          console.error('Error checking disponibilites:', error);
          this.showError('Erreur lors de la vérification des disponibilités');
        }
      });
  }

  createEventTitle(surveillance: Surveillance): string {
    const dateDebut = this.surveillanceService.formatDate(surveillance.dateDebut);
    const dateFin = this.surveillanceService.formatDate(surveillance.dateFin);
    const salle = surveillance.salleName || (surveillance.salleId ? `Salle ${surveillance.salleId}` : 'Salle non définie');
    const matiere = surveillance.matiereName || (surveillance.matiereId ? `Matière ${surveillance.matiereId}` : 'Matière non définie');
    const status = this.disponibilites.get(surveillance.id) ? 'Disponible' : 'Non disponible';
  /*Surveillance #${surveillance.id}*/
    return `Début: ${dateDebut}
  Fin: ${dateFin}
  ${salle}
  ${matiere}
  Statut: ${surveillance.statut}
  Disponibilité: ${status}`;
  }

  updateCalendarEvents() {
    this.events = this.surveillances.map(surveillance => ({
      id: surveillance.id,
      start: new Date(surveillance.dateDebut),
      end: new Date(surveillance.dateFin),
      title: this.createEventTitle(surveillance),
      color: this.disponibilites.get(surveillance.id) ? colors.blue : colors.yellow,
      // Remove the actions array since we're using a custom template
      meta: {
        surveillance,
        isDisponible: this.disponibilites.get(surveillance.id)
      }
    }));
    this.refresh.next(null);
  }

  toggleDisponibilite(surveillanceId: number) {
    const isCurrentlyDisponible = this.disponibilites.get(surveillanceId);
    
    const action = isCurrentlyDisponible 
      ? this.surveillanceService.cancelDisponibilite(surveillanceId)
      : this.surveillanceService.markDisponibilite(surveillanceId);
  
    action.pipe(
      catchError(error => {
        console.error('Error toggling disponibilite:', error);
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
    ).subscribe({
      next: (response) => {
        this.disponibilites.set(surveillanceId, !isCurrentlyDisponible);
        this.updateCalendarEvents();
        this.showSuccess(isCurrentlyDisponible 
          ? 'Disponibilité annulée' 
          : 'Disponibilité marquée'
        );
      },
      error: () => {
        // Error already handled in catchError
      }
    });
  }

  /*handleEvent(action: string, { event }: { event: CalendarEvent }): void {
    if (event.meta?.surveillance) {
      this.toggleDisponibilite(event.meta.surveillance.id);
    }
  }*/

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




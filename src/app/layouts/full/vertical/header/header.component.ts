import {
  Component,
  Output,
  EventEmitter,
  Input,
  ViewEncapsulation,
  OnInit
} from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { MatDialog } from '@angular/material/dialog';
import { navItems } from '../sidebar/sidebar-data';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { AppSettings } from 'src/app/config';
import { AuthService } from 'src/app/pages/authentication/services/auth.service';
import { LoginResponseEnseignantDto } from 'src/app/pages/authentication/DTO/login-response-enseignant.dto';
import { LoginResponseAdminDto } from 'src/app/pages/authentication/DTO/login-response-admin.dto';

interface notifications {
  id: number;
  icon: string;
  color: string;
  title: string;
  time: string;
  subtitle: string;
}

interface profiledd {
  id: number;
  title: string;
  link?: string;
  new?: boolean;
  action?: () => void;
}

interface apps {
  id: number;
  icon: string;
  color: string;
  title: string;
  subtitle: string;
  link: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    NgScrollbarModule,
    TablerIconsModule,
    MaterialModule,
  ],
  templateUrl: './header.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent implements OnInit {
  
  @Input() showToggle = true;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  showFiller = false;
  userData: LoginResponseAdminDto | LoginResponseEnseignantDto | null = null;

  public selectedLanguage: any = {
    language: 'Français',
    code: 'fr',
    icon: '/assets/images/flag/icon-flag-fr.svg',
  };

  public languages: any[] = [
    {
      language: 'Français',
      code: 'fr',
      icon: '/assets/images/flag/icon-flag-fr.svg',
    }
  ];

  constructor(
    private settings: CoreService,
    private vsidenav: CoreService,
    public dialog: MatDialog,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.userData = user;
    });
  }
  options = this.settings.getOptions();
  
  setDark() {
    this.settings.toggleTheme();
  }

  openDialog() {
    const dialogRef = this.dialog.open(AppSearchDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }

  getAdminFonction(): string {
    if (this.userData && this.userData.role === 'ROLE_ADMIN') {
      return (this.userData as any).fonction;
    }
    return '';
  }
  
  getEnseignantGrade(): string {
    if (this.userData && this.userData.role === 'ROLE_ENSEIGNANT') {
      return (this.userData as any).grade;
    }
    return '';
  }
  
  getEnseignantDepartement(): string {
    if (this.userData && this.userData.role === 'ROLE_ENSEIGNANT') {
      return (this.userData as any).departement;
    }
    return '';
  }

  changeLanguage(lang: any): void {
    this.selectedLanguage = lang;
    console.log(`Language changed to ${lang.language}`);
  }

  getProfileIcon(id: number): string {
    switch(id) {
      case 1: return 'person_outline';
      case 2: return 'settings';
      case 3: return 'logout';
      default: return 'info';
    }
  }

  notifications: notifications[] = [
    {
      id: 1,
      icon: 'a-b-2',
      color: 'primary',
      time: '08:30',
      title: 'Nouvelle version',
      subtitle: 'Une nouvelle version est disponible',
    },
    {
      id: 2,
      icon: 'calendar',
      color: 'accent',
      time: '08:21',
      title: 'Événement aujourd\'hui',
      subtitle: 'Vous avez un événement prévu',
    },
    {
      id: 3,
      icon: 'settings',
      color: 'warning',
      time: '08:05',
      title: 'Paramètres',
      subtitle: 'Personnalisez votre interface',
    },
    {
      id: 4,
      icon: 'a-b-2',
      color: 'success',
      time: '07:30',
      title: 'Mise à jour',
      subtitle: 'Mise à jour des templates',
    },
    {
      id: 5,
      icon: 'exclamation-circle',
      color: 'error',
      time: '07:03',
      title: 'Événement demain',
      subtitle: 'Rappel pour votre événement',
    },
  ];

  profiledd: profiledd[] = [
    {
      id: 1,
      title: 'Mon Profil',
      link: '/profil',
    },
    {
      id: 2,
      title: 'Paramètres',
      link: '/parametres',
    },
    {
      id: 3,
      title: 'Déconnexion',
      action: () => this.authService.signOut()
    },
  ];

  apps: apps[] = [
    {
      id: 1,
      icon: 'solar:chat-line-line-duotone',
      color: 'primary',
      title: 'Messagerie',
      subtitle: 'Messages & Emails',
      link: '/apps/chat',
    },
    {
      id: 2,
      icon: 'solar:checklist-minimalistic-line-duotone',
      color: 'accent',
      title: 'Tâches',
      subtitle: 'Liste des tâches',
      link: '/apps/todo',
    },
    {
      id: 3,
      icon: 'solar:bill-list-line-duotone',
      color: 'success',
      title: 'Factures',
      subtitle: 'Gestion des factures',
      link: '/apps/invoice',
    },
    {
      id: 4,
      icon: 'solar:calendar-line-duotone',
      color: 'error',
      title: 'Calendrier',
      subtitle: 'Vos rendez-vous',
      link: '/apps/calendar',
    },
    {
      id: 5,
      icon: 'solar:smartphone-2-line-duotone',
      color: 'warning',
      title: 'Contacts',
      subtitle: 'Gestion des contacts',
      link: '/apps/contacts',
    },
    {
      id: 6,
      icon: 'solar:ticket-line-duotone',
      color: 'primary',
      title: 'Tickets',
      subtitle: 'Support technique',
      link: '/apps/tickets',
    },
    {
      id: 7,
      icon: 'solar:letter-line-duotone',
      color: 'accent',
      title: 'Emails',
      subtitle: 'Boîte de réception',
      link: '/apps/email/inbox',
    },
    {
      id: 8,
      icon: 'solar:book-2-line-duotone',
      color: 'warning',
      title: 'Sessions',
      subtitle: 'Gestion des sessions d`examen',
      link: '/apps/Sessions',
    },
  ];

  getUserRoleDisplay(): string {
    if (!this.userData) return '';
    return this.userData.role === 'ROLE_ADMIN' ? 'Administrateur' : 'Enseignant';
  }
}

@Component({
  selector: 'search-dialog',
  standalone: true,
  imports: [RouterModule, MaterialModule, TablerIconsModule, FormsModule],
  templateUrl: 'search-dialog.component.html',
})
export class AppSearchDialogComponent {
  searchText: string = '';
  navItems = navItems;

  navItemsData = navItems.filter((navitem) => navitem.displayName);
}
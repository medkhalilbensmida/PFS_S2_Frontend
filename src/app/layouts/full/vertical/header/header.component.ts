import { Component, Output, EventEmitter, Input, OnInit, OnDestroy, Inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { CoreService } from '../../../../services/core.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from 'src/app/pages/apps/account/services/profile.service';
import { AuthService } from 'src/app/pages/authentication/services/auth.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatDividerModule,
    TablerIconsModule,
    RouterModule
  ],
  templateUrl: './header.component.html',
  styleUrls: []
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() showToggle = true;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  userData: any;
  profileImage: string | null = null;
  isLoading: boolean = false;
  options: any;

  constructor(
    public authService: AuthService,
    private profileService: ProfileService,
    private http: HttpClient,
    private dialog: MatDialog,
    private settings: CoreService,
    private sanitizer: DomSanitizer
  ) {
    this.options = this.settings.getOptions();
  }

  private getDefaultUserData() {
    const user = this.authService.getUserData();
    return {
      nom: user?.nom || 'Utilisateur',
      prenom: user?.prenom || '',
      email: user?.email || '',
      role: user?.role || '',
      photoProfil: null,
    };
  }

  ngOnInit(): void {
    this.userData = this.getDefaultUserData();

    this.profileService.profileData$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (profileData) => {
        if (profileData) {
          this.userData = { ...this.userData, ...profileData };
        }
      },
      error: (err) => {
        console.error('Error in profile data subscription:', err);
        this.userData = this.getDefaultUserData();
      }
    });

    this.profileService.profileImage$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (imageUrl) => {
        if (imageUrl) {
          this.profileImage = imageUrl;
        } else {
          this.loadDefaultProfileImage();
        }
      },
      error: (err) => {
        console.error('Error in profile image subscription:', err);
        this.loadDefaultProfileImage();
      }
    });

    this.loadInitialProfile();
  }

  loadInitialProfile(): void {
    this.isLoading = true;
    this.profileService.getProfile().pipe(takeUntil(this.destroy$)).subscribe({
      next: (profileData) => {
        this.userData = { ...this.userData, ...profileData };
        this.updateProfileImage(profileData.photoProfil);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load profile:', err);
        this.loadDefaultProfileImage();
        this.isLoading = false;
      }
    });
  }

  updateProfileImage(photoProfil: string | null): void {
    if (photoProfil) {
      this.loadUserProfileImage(photoProfil);
    } else {
      this.loadDefaultProfileImage();
    }
  }

  loadUserProfileImage(filename: string): void {
    if (!filename) {
      this.loadDefaultProfileImage();
      return;
    }

    const cleanFilename = filename.split('/').pop() || filename;
    const imageUrl = this.profileService.getProfileImageUrl(cleanFilename);

    this.profileService.getAuthenticatedImage(imageUrl).pipe(takeUntil(this.destroy$)).subscribe({
      next: (imageUrl) => {
        if (!imageUrl.includes('default/profile')) {
          this.profileImage = imageUrl;
        }
      },
      error: (err) => {
        console.error('Failed to load profile image:', err);
        this.loadDefaultProfileImage();
      }
    });
  }

  loadDefaultProfileImage(): void {
    this.profileImage = this.profileService.getDefaultProfileImage();
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.classList.add('default-profile-img');
    img.src = this.profileService.getDefaultProfileImage();
    if (img.classList.contains('profile-menu-img')) {
      img.style.padding = '8px';
    } else {
      img.style.padding = '4px';
    }
  }

  getAdminFonction(): string {
    if (this.userData && this.userData.role === 'ROLE_ADMIN') {
      return this.userData.fonction || '';
    }
    return '';
  }

  getEnseignantGrade(): string {
    if (this.userData && this.userData.role === 'ROLE_ENSEIGNANT') {
      return this.userData.grade || '';
    }
    return '';
  }

  getEnseignantDepartement(): string {
    if (this.userData && this.userData.role === 'ROLE_ENSEIGNANT') {
      return this.userData.departement || '';
    }
    return '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  openDialog(): void {
    const dialogRef = this.dialog.open(AppSearchDialogComponent);
    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog result:', result);
    });
  }

  setDark(): void {
    this.settings.toggleTheme();
    this.options = this.settings.getOptions();
  }

  getUserRoleDisplay(): string {
    if (!this.userData) return '';
    return this.userData.role === 'ROLE_ADMIN' ? 'Administrateur' : 'Enseignant';
  }

  loadProfile(): void {
    this.profileService.getProfile().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (profileData) => {
        this.userData = profileData;
        this.updateProfileImage(profileData.photoProfil);
      },
      error: () => this.loadDefaultProfileImage()
    });
  }

}

@Component({
  selector: 'search-dialog',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule],
  template: `
    <div class="p-24">
      <mat-form-field appearance="outline" class="w-100">
        <input matInput placeholder="Rechercher...">
      </mat-form-field>
    </div>
  `
})
export class AppSearchDialogComponent {}
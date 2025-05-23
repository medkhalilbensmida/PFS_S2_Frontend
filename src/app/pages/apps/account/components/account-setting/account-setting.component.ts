import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../../../authentication/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DefaultImageDialogComponent } from '../default-images-dialog/default-images-dialog.component';

@Component({
  selector: 'app-account-setting',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    TablerIconsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    CommonModule
  ],
  templateUrl: './account-setting.component.html',
  styleUrls: ['./account-setting.component.scss']
})
export class AppAccountSettingComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  profileData: any;
  isLoading = false;
  originalEmail: string = '';
  profileImage: string | null = null;
  signatureImage: string | null = null;

  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private profileService: ProfileService,
    public authService: AuthService,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: [''],
      grade: [''],
      departement: [''],
      fonction: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.profileData = data;
        this.profileForm.patchValue(data);
        this.originalEmail = data.email;
        
        // Charger les images seulement si elles existent
        this.profileImage = data.photoProfil ? data.photoProfil : null;
        this.signatureImage = data.signature ? data.signature : null;
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.snackBar.open('Erreur lors du chargement du profil', 'Fermer', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: any, type: 'profile' | 'signature'): void {
    const file: File = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      
      let endpoint = '';
      if (type === 'profile') {
        formData.append('userId', this.profileData.id.toString());
        formData.append('userType', this.authService.isAdmin() ? 'ADMIN' : 'ENSEIGNANT');
        endpoint = '/api/files/upload-profile';
      } else {
        formData.append('adminId', this.profileData.id.toString());
        endpoint = '/api/files/upload-signature';
      }

      this.isLoading = true;
      this.http.post(endpoint, formData).subscribe({
        next: (response: any) => {
          if (type === 'profile') {
            this.profileImage = response.filePath;
            // Notifie le service du changement
            this.profileService.updateProfileImage(response.filePath);
          }else {
            this.signatureImage = response.filePath;
          }
          this.snackBar.open(type === 'profile' ? 'Photo mise à jour' : 'Signature mise à jour', 'Fermer', { duration: 3000 });
          this.isLoading = false;
        },
        error: (error) => {
          console.error(`Error uploading ${type} image:`, error);
          this.snackBar.open(`Erreur lors du téléchargement ${type === 'profile' ? 'de la photo' : 'de la signature'}`, 'Fermer', { duration: 3000 });
          this.isLoading = false;
        }
      });
    }
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Fallback to first default image
    img.src = 'assets/images/profile/user-1.jpg';
}

  handleSignatureError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/signatures/default-signature.png';
  }

  openDefaultImagesDialog(): void {
    this.http.get('/api/images/default-profiles').subscribe({
        next: (images: any) => {
            const dialogRef = this.dialog.open(DefaultImageDialogComponent, {
                data: { images }
            });

            dialogRef.afterClosed().subscribe(selectedImage => {
                if (selectedImage) {
                    this.selectDefaultImage(selectedImage);
                }
            });
        },
        error: (error) => {
            console.error('Error loading default images:', error);
            this.snackBar.open('Erreur lors du chargement des images par défaut', 'Fermer', { duration: 3000 });
        }
    });
}

selectDefaultImage(imageName: string): void {
  const userData = this.authService.getUserData();
  if (!userData) {
      console.error('User data is null');
      this.snackBar.open('Erreur : données utilisateur introuvables', 'Fermer', { duration: 3000 });
      return;
  }

  const request = {
      imageName: imageName,
      userId: userData.id,
      userType: this.authService.isAdmin() ? 'ADMIN' : 'ENSEIGNANT'
  };

  this.isLoading = true;
  this.http.post('/api/files/select-default-profile', request).subscribe({
      next: (response: any) => {
          const newImageUrl = response.filePath + '?t=' + new Date().getTime();
          this.profileImage = newImageUrl;
          // Notifier le service du changement d'image
          this.profileService.updateProfileImage(newImageUrl);
          this.snackBar.open('Photo de profil mise à jour avec succès', 'Fermer', { duration: 3000 });
          this.isLoading = false;
      },
      error: (error) => {
          console.error('Error selecting default image:', error);
          const newImageUrl = `/assets/images/profile/${imageName}`;
          this.profileImage = newImageUrl;
          // Notifier le service du changement d'image
          this.profileService.updateProfileImage(newImageUrl);
          this.snackBar.open('Image par défaut appliquée localement', 'Fermer', { duration: 3000 });
          this.isLoading = false;
      }
  });
}

onSubmit(): void {
  if (this.profileForm.valid && !this.isLoading) {
    this.isLoading = true;
    
    // Inclure la photo actuelle dans les données envoyées
    const formData = {
      ...this.profileForm.value,
      photoProfil: this.profileImage
    };

    this.profileService.updateProfile(formData).subscribe({
      next: (updatedData) => {
        this.snackBar.open('Profil mis à jour avec succès', 'Fermer', { duration: 3000 });
        this.profileData = updatedData;
        
        // Forcer le rafraîchissement de l'image si nécessaire
        if (updatedData.photoProfil) {
          this.profileImage = updatedData.photoProfil + '?t=' + new Date().getTime();
        }

        if (this.profileForm.value.email !== this.originalEmail) {
          this.snackBar.open('Veuillez vous reconnecter avec votre nouvel email', 'Fermer', { duration: 5000 });
          setTimeout(() => this.authService.signOut(), 3000);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.snackBar.open(error.error?.message || 'Erreur lors de la mise à jour', 'Fermer', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }
}

  onPasswordSubmit(): void {
    if (this.passwordForm.valid && !this.isLoading) {
      this.isLoading = true;
      const { currentPassword, newPassword } = this.passwordForm.value;
      
      const endpoint = this.authService.isAdmin() 
        ? '/api/administrateurs/change-password' 
        : '/api/enseignants/change-password';
      
      this.http.post(endpoint, { 
        currentPassword, 
        newPassword 
      }, {
        headers: {
          'Authorization': `Bearer ${this.authService.getToken()}`
        }
      }).subscribe({
        next: () => {
          this.snackBar.open('Mot de passe changé avec succès', 'Fermer', { duration: 3000 });
          this.passwordForm.reset();
          this.isLoading = false;
          
          // Déconnexion après changement de mot de passe
          this.snackBar.open('Vous allez être déconnecté pour appliquer les changements...', 'Fermer', { duration: 3000 });
          setTimeout(() => this.authService.signOut(), 3000);
        },
        error: (error) => {
          console.error('Error changing password:', error);
          const errorMsg = error.error?.message || error.error || 'Erreur lors du changement de mot de passe';
          this.snackBar.open(errorMsg, 'Fermer', { duration: 3000 });
          this.isLoading = false;
        }
      });
    }
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('newPassword')?.value === form.get('confirmPassword')?.value 
      ? null : { mismatch: true };
  }
}
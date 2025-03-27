import {
  Component,
  Output,
  EventEmitter,
  Input,
  ViewEncapsulation,
  OnInit,
} from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { MatDialog } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { AuthService } from 'src/app/pages/authentication/services/auth.service';

interface Profile {
  createdAt: string;
  updatedAt: string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  type: string;
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
  profile: Profile;

  constructor(
    private settings: CoreService,
    public dialog: MatDialog,
    private authService: AuthService
  ) { }
  ngOnInit(): void {
    const data = localStorage.getItem('user'); // Retrieve the item using its key
    if (data) {
      this.profile = JSON.parse(data); // Parse the JSON string to an object
    }
  }
  options = this.settings.getOptions();

  setDark() {
    this.settings.toggleTheme();
  }
  signOut() {
    this.authService.signOut()
    return
  }
}


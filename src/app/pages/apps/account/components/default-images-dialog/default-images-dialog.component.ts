import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-default-images-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  template: `
  <h2 mat-dialog-title>Sélectionner une image par défaut</h2>
  <mat-dialog-content>
    <div class="image-grid">
      <div *ngFor="let image of data.images" class="image-item">
        <img [src]="'/api/images/profile/' + image" (click)="selectImage(image)" class="thumbnail">
      </div>
    </div>
  </mat-dialog-content>
  <mat-dialog-actions>
    <button mat-button mat-dialog-close>Annuler</button>
  </mat-dialog-actions>
`,
styles: [`
  .image-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .image-item {
    cursor: pointer;
  }
  .thumbnail {
    width: 100%;
    height: auto;
    border: 2px solid transparent;
  }
  .thumbnail:hover {
    border-color: #3f51b5;
  }
`]
})
export class DefaultImageDialogComponent {
constructor(
  public dialogRef: MatDialogRef<DefaultImageDialogComponent>,
  @Inject(MAT_DIALOG_DATA) public data: { images: string[] }
) {}

selectImage(image: string): void {
  this.dialogRef.close(image);
}
}
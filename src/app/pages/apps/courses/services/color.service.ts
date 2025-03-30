import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ColorService {
  constructor() {}

  generateFancyDarkGradientFromId(id: number): string {
    const darkColors = [
      '#1A1A2E', '#16213E', '#0F3460', '#1F4068', '#2C3E50', '#34495E',
      '#2C3A47', '#1E272E', '#1B2631', '#1C2833', '#212F3D', '#1B2631',
    ];

    const vibrantColors = [
      '#FF6B6B', '#FFE66D', '#4ECDC4', '#45B7D3', '#A29BFE', '#6C5CE7',
      '#FF7675', '#FDCB6E', '#00B894', '#00CEC9', '#74B9FF', '#0984E3',
    ];

    const darkColor = darkColors[id % darkColors.length];
    const vibrantColor = vibrantColors[(id + 1) % vibrantColors.length];

    return `linear-gradient(135deg, ${darkColor}, ${vibrantColor})`;
  }
  generateColorFromString(str: string): string {
    const colors = [
      '#FF6B6B', '#FFE66D', '#4ECDC4', '#45B7D3', '#A29BFE', '#6C5CE7',
      '#FF7675', '#FDCB6E', '#00B894', '#00CEC9', '#74B9FF', '#0984E3',
    ];
    const hash = str.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colors[hash % colors.length];
  }
}
import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'customDate',
  standalone: true,
})
export class CustomDatePipe implements PipeTransform {
  transform(value: string | Date): string {
    if (!value) return '';

    const datePipe = new DatePipe('en-US');
    const formattedDate = datePipe.transform(value, 'MM/dd/yyyy hh:mm a');

    return formattedDate || '';
  }
}
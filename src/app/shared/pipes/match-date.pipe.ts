import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'matchDate', standalone: true, pure: true })
export class MatchDatePipe implements PipeTransform {
  private readonly DAYS   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  private readonly MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  transform(date: Date | string | null | undefined, format: 'short' | 'long' | 'time' | 'datetime' = 'datetime'): string {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    const day   = this.DAYS[d.getDay()];
    const num   = d.getDate();
    const month = this.MONTHS[d.getMonth()];
    const year  = d.getFullYear();
    const hh    = d.getHours().toString().padStart(2, '0');
    const mm    = d.getMinutes().toString().padStart(2, '0');
    switch (format) {
      case 'time':     return `${hh}:${mm}`;
      case 'short':    return `${num} ${month}`;
      case 'long':     return `${day} ${num} ${month}`;
      default:         return `${num}/${d.getMonth()+1} ${hh}:${mm}`;
    }
  }
}

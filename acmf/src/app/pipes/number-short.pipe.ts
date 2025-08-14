import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numberShort',
  standalone: true,
})
export class NumberShortPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (!value) return '0';
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
    if (value >= 1_000) return (value / 1_000).toFixed(1) + 'K';
    return value.toString();
  }
}

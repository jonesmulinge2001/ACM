import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface FundingOpportunity {
  title: string;
  provider: string;
  locationType: 'County' | 'Constituency' | 'Ward';
  locationName: string;
  description: string;
  deadline: string;
  link: string;
}

@Component({
  imports: [CommonModule, RouterModule, FormsModule],
  standalone: true,
  selector: 'app-fund-me',
  templateUrl: './fund-me.component.html'
})
export class FundMeComponent {
  // Full list
  opportunities: FundingOpportunity[] = [
    {
      title: 'HELB Undergraduate Loan',
      provider: 'HELB',
      locationType: 'County',
      locationName: 'National',
      description: 'Loan support for undergraduate students in recognized institutions.',
      deadline: 'March 30, 2025',
      link: '#'
    },
    {
      title: 'Nairobi County Bursary',
      provider: 'Nairobi County Government',
      locationType: 'County',
      locationName: 'Nairobi',
      description: 'Bursary for needy students residing within Nairobi County.',
      deadline: 'February 10, 2025',
      link: '#'
    },
    {
      title: 'Makueni County Scholarship',
      provider: 'Makueni County',
      locationType: 'County',
      locationName: 'Makueni',
      description: 'Merit-based scholarship for students from Makueni County.',
      deadline: 'April 5, 2025',
      link: '#'
    },
    {
      title: 'Kandara Constituency Bursary',
      provider: 'NGCDF Kandara',
      locationType: 'Constituency',
      locationName: 'Kandara',
      description: 'Bursary support for students from Kandara Constituency.',
      deadline: 'March 15, 2025',
      link: '#'
    },
    {
      title: 'Lang’ata Constituency Bursary',
      provider: 'NGCDF Lang’ata',
      locationType: 'Constituency',
      locationName: 'Lang’ata',
      description: 'Financial aid for students residing in Lang’ata Constituency.',
      deadline: 'February 28, 2025',
      link: '#'
    },
    {
      title: 'Rware Ward Bursary',
      provider: 'Nyeri Central Sub-county',
      locationType: 'Ward',
      locationName: 'Rware Ward',
      description: 'Ward-level bursary to support needy students in Rware Ward.',
      deadline: 'March 12, 2025',
      link: '#'
    }
  ];

  // Filtered list (displayed)
  filtered = [...this.opportunities];

  // Filters
  selectedType = '';
  selectedName = '';

  get locationNames(): string[] {
    if (!this.selectedType) return [];
    return [
      ...new Set(
        this.opportunities
          .filter(o => o.locationType === this.selectedType)
          .map(o => o.locationName)
      )
    ];
  }

  applyFilter() {
    this.filtered = this.opportunities.filter(o => {
      const typeMatch = this.selectedType ? o.locationType === this.selectedType : true;
      const nameMatch = this.selectedName ? o.locationName === this.selectedName : true;
      return typeMatch && nameMatch;
    });
  }

  resetFilter() {
    this.selectedType = '';
    this.selectedName = '';
    this.filtered = [...this.opportunities];
  }
}

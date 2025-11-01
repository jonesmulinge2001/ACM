import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-opportunities',
  imports: [CommonModule],
  templateUrl: './opportunities.component.html',
  styleUrl: './opportunities.component.css'
})
export class OpportunitiesComponent {
  opportunities = [
    {
      title: 'Software Engineering Internship',
      location: 'Remote',
      deadline: 'Nov 20',
      type: 'Internship',
      color: 'from-blue-500 to-indigo-500',
    },
    {
      title: 'Scholarship for Tech Innovators',
      location: 'Kenya',
      deadline: 'Dec 5',
      type: 'Scholarship',
      color: 'from-green-500 to-teal-500',
    },
  ];
  
}

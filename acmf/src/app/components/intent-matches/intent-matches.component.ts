import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IntentService } from '../../services/intent.service';
import { IntentMatch } from '../../interfaces';

@Component({
  selector: 'app-intent-matches',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './intent-matches.component.html',
})
export class IntentMatchesComponent implements OnInit {
  matches: IntentMatch[] = [];
  loading = true;

  constructor(private intentService: IntentService) {}

  ngOnInit(): void {
    this.loadMatches();
  }

  loadMatches(): void {
    this.intentService.getIntentMatches().subscribe({
      next: (data) => {
        this.matches = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  getIntentLabel(type: string): string {
    const map: Record<string, string> = {
      STUDY_PARTNER: 'Looking for a study partner',
      BUILD_PROJECT: 'Looking to build a project',
      FIND_COFOUNDER: 'Looking for a cofounder',
      INTERNSHIP: 'Looking for internship opportunities',
      HACKATHON_TEAM: 'Looking for a hackathon team',
      SKILL_EXCHANGE: 'Looking for skill exchange',
      MENTORSHIP: 'Looking for mentorship',
      RESEARCH_COLLAB: 'Looking for research collaboration',
      ACCOUNTABILITY_PARTNER: 'Looking for accountability partner',
      STARTUP: 'Looking to start something big',
    };
    return map[type] || type;
  }

  getAvatar(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  getAvatarGradient(name: string): string {
    const gradients = [
      'bg-gradient-to-br from-indigo-500 to-purple-500',
      'bg-gradient-to-br from-pink-500 to-rose-500',
      'bg-gradient-to-br from-violet-500 to-indigo-500',
      'bg-gradient-to-br from-purple-500 to-pink-500',
      'bg-gradient-to-br from-fuchsia-500 to-violet-500',
    ];
    const index = name.charCodeAt(0) % gradients.length;
    return gradients[index];
  }
}
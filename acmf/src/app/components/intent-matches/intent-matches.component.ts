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

  // ── Intent label ─────────────────────────────────────────────
  getIntentLabel(type: string): string {
    const map: Record<string, string> = {
      STUDY_PARTNER:          'Study partner',
      BUILD_PROJECT:          'Build a project together',
      FIND_COFOUNDER:         'Find a co-founder',
      INTERNSHIP:             'Internship opportunities',
      HACKATHON_TEAM:         'Hackathon team',
      SKILL_EXCHANGE:         'Skill exchange',
      MENTORSHIP:             'Mentorship',
      RESEARCH_COLLAB:        'Research collaboration',
      ACCOUNTABILITY_PARTNER: 'Accountability partner',
      STARTUP:                'Start something big',
    };
    return map[type] || type;
  }

  // ── Intent icon ───────────────────────────────────────────────
  getIntentIcon(type: string): string {
    const map: Record<string, string> = {
      STUDY_PARTNER:          'menu_book',
      BUILD_PROJECT:          'build',
      FIND_COFOUNDER:         'handshake',
      INTERNSHIP:             'work_outline',
      HACKATHON_TEAM:         'emoji_events',
      SKILL_EXCHANGE:         'swap_horiz',
      MENTORSHIP:             'psychology',
      RESEARCH_COLLAB:        'biotech',
      ACCOUNTABILITY_PARTNER: 'track_changes',
      STARTUP:                'rocket_launch',
    };
    return map[type] || 'rocket_launch';
  }

  // ── Per-intent colour theming ─────────────────────────────────

  /** Top accent bar colour */
  getIntentAccent(type: string): string {
    const map: Record<string, string> = {
      STUDY_PARTNER:          'bg-blue-500',
      BUILD_PROJECT:          'bg-emerald-500',
      FIND_COFOUNDER:         'bg-violet-500',
      INTERNSHIP:             'bg-amber-500',
      HACKATHON_TEAM:         'bg-orange-500',
      SKILL_EXCHANGE:         'bg-cyan-500',
      MENTORSHIP:             'bg-indigo-500',
      RESEARCH_COLLAB:        'bg-teal-500',
      ACCOUNTABILITY_PARTNER: 'bg-rose-500',
      STARTUP:                'bg-purple-600',
    };
    return map[type] || 'bg-gray-400';
  }

  /** Intent box border + background */
  getIntentBoxStyle(type: string): string {
    const map: Record<string, string> = {
      STUDY_PARTNER:          'bg-blue-50 border-blue-200',
      BUILD_PROJECT:          'bg-emerald-50 border-emerald-200',
      FIND_COFOUNDER:         'bg-violet-50 border-violet-200',
      INTERNSHIP:             'bg-amber-50 border-amber-200',
      HACKATHON_TEAM:         'bg-orange-50 border-orange-200',
      SKILL_EXCHANGE:         'bg-cyan-50 border-cyan-200',
      MENTORSHIP:             'bg-indigo-50 border-indigo-200',
      RESEARCH_COLLAB:        'bg-teal-50 border-teal-200',
      ACCOUNTABILITY_PARTNER: 'bg-rose-50 border-rose-200',
      STARTUP:                'bg-purple-50 border-purple-200',
    };
    return map[type] || 'bg-gray-50 border-gray-200';
  }

  /** Icon tile background */
  getIntentIconBg(type: string): string {
    const map: Record<string, string> = {
      STUDY_PARTNER:          'bg-blue-100',
      BUILD_PROJECT:          'bg-emerald-100',
      FIND_COFOUNDER:         'bg-violet-100',
      INTERNSHIP:             'bg-amber-100',
      HACKATHON_TEAM:         'bg-orange-100',
      SKILL_EXCHANGE:         'bg-cyan-100',
      MENTORSHIP:             'bg-indigo-100',
      RESEARCH_COLLAB:        'bg-teal-100',
      ACCOUNTABILITY_PARTNER: 'bg-rose-100',
      STARTUP:                'bg-purple-100',
    };
    return map[type] || 'bg-gray-100';
  }

  /** Icon colour */
  getIntentIconColor(type: string): string {
    const map: Record<string, string> = {
      STUDY_PARTNER:          'text-blue-600',
      BUILD_PROJECT:          'text-emerald-600',
      FIND_COFOUNDER:         'text-violet-600',
      INTERNSHIP:             'text-amber-600',
      HACKATHON_TEAM:         'text-orange-600',
      SKILL_EXCHANGE:         'text-cyan-600',
      MENTORSHIP:             'text-indigo-600',
      RESEARCH_COLLAB:        'text-teal-600',
      ACCOUNTABILITY_PARTNER: 'text-rose-600',
      STARTUP:                'text-purple-600',
    };
    return map[type] || 'text-gray-600';
  }

  /** "Looking For" label colour */
  getIntentLabelColor(type: string): string {
    const map: Record<string, string> = {
      STUDY_PARTNER:          'text-blue-500',
      BUILD_PROJECT:          'text-emerald-500',
      FIND_COFOUNDER:         'text-violet-500',
      INTERNSHIP:             'text-amber-500',
      HACKATHON_TEAM:         'text-orange-500',
      SKILL_EXCHANGE:         'text-cyan-500',
      MENTORSHIP:             'text-indigo-500',
      RESEARCH_COLLAB:        'text-teal-500',
      ACCOUNTABILITY_PARTNER: 'text-rose-500',
      STARTUP:                'text-purple-500',
    };
    return map[type] || 'text-gray-500';
  }

  /** Explore button (hub icon) bg + icon colour */
  getExploreButtonStyle(type: string): string {
    const map: Record<string, string> = {
      STUDY_PARTNER:          'bg-blue-50 text-blue-600 hover:bg-blue-100',
      BUILD_PROJECT:          'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
      FIND_COFOUNDER:         'bg-violet-50 text-violet-600 hover:bg-violet-100',
      INTERNSHIP:             'bg-amber-50 text-amber-600 hover:bg-amber-100',
      HACKATHON_TEAM:         'bg-orange-50 text-orange-600 hover:bg-orange-100',
      SKILL_EXCHANGE:         'bg-cyan-50 text-cyan-600 hover:bg-cyan-100',
      MENTORSHIP:             'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
      RESEARCH_COLLAB:        'bg-teal-50 text-teal-600 hover:bg-teal-100',
      ACCOUNTABILITY_PARTNER: 'bg-rose-50 text-rose-600 hover:bg-rose-100',
      STARTUP:                'bg-purple-50 text-purple-600 hover:bg-purple-100',
    };
    return map[type] || 'bg-gray-100 text-gray-600 hover:bg-gray-200';
  }

  // ── Avatar helpers ────────────────────────────────────────────
  getAvatar(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  /** Flat tinted background (no gradient) for avatar fallback */
  getAvatarBg(name: string): string {
    const palettes = [
      'bg-blue-100',
      'bg-emerald-100',
      'bg-violet-100',
      'bg-amber-100',
      'bg-rose-100',
    ];
    return palettes[name.charCodeAt(0) % palettes.length];
  }

  /** Matching text colour for avatar initials */
  getAvatarText(name: string): string {
    const palettes = [
      'text-blue-700',
      'text-emerald-700',
      'text-violet-700',
      'text-amber-700',
      'text-rose-700',
    ];
    return palettes[name.charCodeAt(0) % palettes.length];
  }
}
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GlobalSearchService } from '../../services/global-search.service';
import { GlobalSearchResult } from '../../interfaces';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css']
})
export class SearchResultsComponent implements OnInit {
  query = '';
  results: GlobalSearchResult = { profiles: [], posts: [], resources: [] };
  loading = false;
  error = '';
  activeTab: 'all' | 'profiles' | 'posts' | 'resources' = 'all';

  constructor(
    private route: ActivatedRoute,
    private searchService: GlobalSearchService
  ) {}

  ngOnInit(): void {
    // Get search query from URL
    this.route.queryParams.subscribe(params => {
      this.query = params['q'] || '';
      if (this.query.trim()) {
        this.performSearch();
      }
    });
  }

  performSearch(): void {
    if (!this.query.trim()) {
      this.results = { profiles: [], posts: [], resources: [] };
      return;
    }

    this.loading = true;
    this.error = '';
    
    this.searchService.search(this.query).subscribe({
      next: (res) => {
        this.results = {
          profiles: res.profiles || [],
          posts: res.posts || [],
          resources: res.resources || []
        };
        this.loading = false;
      },
      error: (err) => {
        console.error('Search error:', err);
        this.error = 'Failed to load search results. Please try again.';
        this.loading = false;
        this.results = { profiles: [], posts: [], resources: [] };
      }
    });
  }

  setActiveTab(tab: 'all' | 'profiles' | 'posts' | 'resources'): void {
    this.activeTab = tab;
  }

  getFilteredResults() {
    switch (this.activeTab) {
      case 'profiles':
        return { profiles: this.results.profiles, posts: [], resources: [] };
      case 'posts':
        return { profiles: [], posts: this.results.posts, resources: [] };
      case 'resources':
        return { profiles: [], posts: [], resources: this.results.resources };
      default:
        return this.results;
    }
  }

  searchOnEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.performSearch();
    }
  }

  get totalResults(): number {
    return (
      this.results.profiles.length +
      this.results.posts.length +
      this.results.resources.length
    );
  }
}
import { 
  Component, 
  EventEmitter, 
  Output, 
  HostListener, 
  OnInit, 
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  signal,
  ChangeDetectorRef 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { ProfileComponent } from '../profile/profile.component';
import { NotificationPreferencesComponent } from '../notification-preferences/notification-preferences.component';
import { ThemeComponent } from '../theme/theme.component';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [
    CommonModule,
    ThemeComponent,
    ProfileComponent,
    NotificationPreferencesComponent,
  ],
  templateUrl: './settings-panel.component.html',
  animations: [
    trigger('panelAnimation', [
      transition(':enter', [
        style({ 
          opacity: 0,
          transform: '{{enterTransform}}',
        }),
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ 
            opacity: 1,
            transform: 'translate(0, 0) scale(1)'
          })
        )
      ], { params: { enterTransform: 'translateY(20px) scale(0.98)' } }),
      transition(':leave', [
        animate('150ms cubic-bezier(0.4, 0, 0.84, 1)', 
          style({ 
            opacity: 0,
            transform: '{{leaveTransform}}'
          })
        )
      ], { params: { leaveTransform: 'translateY(20px) scale(0.98)' } })
    ]),
    trigger('backdropAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('150ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('100ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class SettingsPanelComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  
  // Signals for reactive state
  isMobile = signal(false);
  panelAnimationParams = signal({ 
    enterTransform: 'translateY(20px) scale(0.98)',
    leaveTransform: 'translateY(20px) scale(0.98)'
  });
  isVisible = signal(false);
  
  private resizeObserver: ResizeObserver | null = null;
  private escapeListener = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.onClose();
    }
  };

  constructor(
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef,
    private settingsService: ThemeService
  ) {}

  ngOnInit(): void {
    this.checkViewport();
    this.setAnimationParams();
    document.addEventListener('keydown', this.escapeListener);
    
    // Mark as visible for animation
    setTimeout(() => {
      this.isVisible.set(true);
    }, 10);
  }

  ngAfterViewInit(): void {
    this.setupResizeObserver();
    this.focusFirstInteractiveElement();
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.escapeListener);
    this.resizeObserver?.disconnect();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.checkViewport();
    this.setAnimationParams();
  }

  private checkViewport(): void {
    const mobile = window.innerWidth < 640;
    if (this.isMobile() !== mobile) {
      this.isMobile.set(mobile);
      this.cdr.detectChanges();
    }
  }

  private setAnimationParams(): void {
    if (this.isMobile()) {
      this.panelAnimationParams.set({
        enterTransform: 'translateY(100%)',
        leaveTransform: 'translateY(100%)'
      });
    } else {
      this.panelAnimationParams.set({
        enterTransform: 'translateX(100%)',
        leaveTransform: 'translateX(20px)'
      });
    }
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width < 640 && !this.isMobile()) {
            this.isMobile.set(true);
            this.setAnimationParams();
          } else if (entry.contentRect.width >= 640 && this.isMobile()) {
            this.isMobile.set(false);
            this.setAnimationParams();
          }
        }
      });

      const panelElement = this.elementRef.nativeElement.querySelector('.settings-panel');
      if (panelElement) {
        this.resizeObserver.observe(panelElement);
      }
    }
  }

  private focusFirstInteractiveElement(): void {
    // Focus first interactive element for accessibility
    setTimeout(() => {
      const firstInteractive = this.elementRef.nativeElement.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstInteractive) {
        (firstInteractive as HTMLElement).focus();
      }
    }, 200);
  }

  onClose(): void {
    this.isVisible.set(false);
    // Allow animation to complete before emitting
    setTimeout(() => {
      this.close.emit();
    }, 150);
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.isMobile() && (event.target as HTMLElement).classList.contains('backdrop')) {
      this.onClose();
    }
  }

  onPanelClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  // resetToDefaults(): void {
  //   this.settingsService.resetToDefaults();
  //   // Optional: Show confirmation toast or message
  //   console.log('Settings reset to defaults');
  // }

  // saveAndClose(): void {
  //   // Save any pending changes
  //   this.settingsService.saveAllSettings();
  //   this.onClose();
  // }

  // Track by function for better performance if needed
  trackBySection(index: number, section: any): string {
    return section.id || index;
  }

  // Get animation params for template
  getAnimationParams(): any {
    return this.panelAnimationParams();
  }
}
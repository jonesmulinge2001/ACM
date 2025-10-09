import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { NumberShortPipe } from '../../pipes/number-short.pipe';


@Directive({
  selector: '[appCountUp]',
})
export class CountUpDirective implements OnInit, OnChanges {
  @Input('appCountUp') endVal: number = 0;
  @Input() duration: number = 1;

  private startVal = 0;
  private startTime: number | null = null;
  private animationFrame: any;

  constructor(private el: ElementRef, private numberShortPipe: NumberShortPipe) {}

  ngOnInit() {
    this.animateCount();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['endVal']) {
      this.animateCount();
    }
  }

  private animateCount() {
    this.startTime = null;
    cancelAnimationFrame(this.animationFrame);

    const step = (timestamp: number) => {
      if (!this.startTime) this.startTime = timestamp;
      const progress = Math.min((timestamp - this.startTime) / (this.duration * 1000), 1);
      const currentVal = this.startVal + (this.endVal - this.startVal) * progress;
      this.el.nativeElement.textContent = this.numberShortPipe.transform(currentVal);

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }
}

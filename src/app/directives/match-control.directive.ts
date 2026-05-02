import { Directive, Input, OnDestroy } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';
import { Subscription } from 'rxjs';

type MatchControlError = {
  matchControl: {
    matchTo: string;
  };
};

@Directive({
  selector: '[appMatchControl]',
  standalone: true,
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: MatchControlDirective,
      multi: true,
    },
  ],
})
export class MatchControlDirective implements Validator, OnDestroy {
  @Input('appMatchControl') matchToControlName = '';

  private otherValueSub?: Subscription;
  private onValidatorChange?: () => void;
  private lastOtherControl?: AbstractControl | null;

  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.matchToControlName) {
      return null;
    }

    const parent = control.parent;
    if (!parent) {
      return null;
    }

    const other = parent.get(this.matchToControlName);
    if (!other) {
      return null;
    }

    this.bindToOtherControl(other);

    const value = control.value;
    const otherValue = other.value;

    if (value === null || value === undefined || value === '') {
      return null;
    }

    return value === otherValue ? null : ({ matchControl: { matchTo: this.matchToControlName } } satisfies MatchControlError);
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  ngOnDestroy(): void {
    this.otherValueSub?.unsubscribe();
  }

  private bindToOtherControl(other: AbstractControl): void {
    if (this.lastOtherControl === other) {
      return;
    }

    this.otherValueSub?.unsubscribe();
    this.lastOtherControl = other;

    this.otherValueSub = other.valueChanges.subscribe(() => {
      this.onValidatorChange?.();
    });
  }
}


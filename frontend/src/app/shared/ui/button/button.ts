import { Component, input } from '@angular/core';

@Component({
  selector: 'a[appButton], button[appButton]',
  template: '<ng-content />',
  styleUrl: './button.css',
  host: {
    class: 'ui-button',
    '[class.is-secondary]': "variant() === 'secondary'",
    '[class.is-light]': "variant() === 'light'",
  },
})
export class Button {
  readonly variant = input<'primary' | 'secondary' | 'light'>('primary');
}

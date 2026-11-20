import { Component, computed, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';

@Component({
  selector: 'app-quote-input',
  imports: [FormField],
  template: `
    <label [for]="inputId()">{{ label() }}</label>
    <div class="input-shell" [class.has-error]="error()">
      @if (prefix()) {
        <span aria-hidden="true">{{ prefix() }}</span>
      }
      <input
        [id]="inputId()"
        type="text"
        [attr.inputmode]="inputMode()"
        autocomplete="off"
        [formField]="field()"
        [placeholder]="placeholder()"
        [attr.aria-invalid]="error() ? 'true' : null"
        [attr.aria-describedby]="inputId() + '-hint' + (error() ? ' ' + inputId() + '-error' : '')"
      />
      @if (suffix()) {
        <span aria-hidden="true">{{ suffix() }}</span>
      }
    </div>
    <p class="field-hint" [id]="inputId() + '-hint'">{{ hint() }}</p>
    @if (error(); as message) {
      <p class="field-error" [id]="inputId() + '-error'">{{ message }}</p>
    }
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    label {
      display: block;
      margin-bottom: calc(var(--spacing) * 2);
      font-size: var(--text-base);
      font-weight: 600;
    }
    .input-shell {
      display: flex;
      align-items: center;
      gap: calc(var(--spacing) * 3);
      min-height: 3.5rem;
      padding-inline: calc(var(--spacing) * 4);
      border: 1px solid var(--color-muted);
      border-radius: var(--radius-button);
      background: var(--color-paper);
    }
    .input-shell:focus-within {
      outline: 3px solid var(--color-coral-dark);
      outline-offset: 3px;
    }
    .input-shell.has-error {
      border-color: var(--color-coral-dark);
    }
    .input-shell span {
      flex: none;
      color: var(--color-muted);
      font-size: var(--text-base);
    }
    input {
      width: 100%;
      min-width: 0;
      min-height: 3.5rem;
      border: 0;
      outline: 0;
      background: transparent;
      color: var(--color-ink);
      font: inherit;
      font-size: var(--text-xl);
    }
    input::placeholder {
      color: var(--color-muted);
      opacity: 1;
    }
    .field-hint,
    .field-error {
      margin-top: calc(var(--spacing) * 2);
      font-size: var(--text-sm);
    }
    .field-hint {
      color: var(--color-muted);
    }
    .field-error {
      color: var(--color-coral-dark);
    }
  `,
})
export class QuoteInput {
  readonly field = input.required<FieldTree<string>>();
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly hint = input.required<string>();
  readonly prefix = input('');
  readonly suffix = input('');
  readonly placeholder = input('0');
  readonly inputMode = input<'decimal' | 'numeric' | 'text'>('decimal');
  protected readonly error = computed(() => {
    const state = this.field()();
    return state.invalid() && (state.dirty() || state.touched())
      ? state.errors()[0]?.message
      : undefined;
  });
}

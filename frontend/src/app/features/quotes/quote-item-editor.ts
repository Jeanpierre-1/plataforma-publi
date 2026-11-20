import { Component, computed, input, output } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { Button } from '../../shared/ui/button/button';
import { calculateQuote, formatMoney } from './quote-calculation';
import { QuoteItemDraft } from './quote-document';
import { QuoteInput } from './quote-input';

@Component({
  selector: 'app-quote-item-editor',
  imports: [Button, FormField, QuoteInput],
  templateUrl: './quote-item-editor.html',
  styleUrl: './quote-item-editor.css',
})
export class QuoteItemEditor {
  readonly field = input.required<FieldTree<QuoteItemDraft>>();
  readonly position = input.required<number>();
  readonly remove = output<string>();
  protected readonly itemId = computed(() => this.field()().value().id);
  protected readonly subtotal = computed(() => {
    const result = calculateQuote(this.field()().value());
    return result.valid ? formatMoney(result.breakdown.totalCents) : '—';
  });
}

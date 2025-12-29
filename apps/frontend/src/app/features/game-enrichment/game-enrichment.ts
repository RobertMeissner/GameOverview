import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EnrichmentService, EnrichmentBatchResult, ProviderInfo } from '../../services/enrichment.service';

@Component({
  selector: 'app-game-enrichment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-enrichment.html',
  styleUrl: './game-enrichment.scss'
})
export class GameEnrichmentComponent implements OnInit {
  private enrichmentService = inject(EnrichmentService);
  private destroyRef = inject(DestroyRef);

  enriching = signal(false);
  enrichmentResult = signal<EnrichmentBatchResult | null>(null);
  providers = signal<ProviderInfo[]>([]);
  showDetails = signal(false);

  ngOnInit(): void {
    this.loadProviders();
  }

  loadProviders(): void {
    this.enrichmentService.getProviders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: providers => {
          this.providers.set(providers);
        },
        error: err => {
          console.error('Failed to load providers:', err);
        }
      });
  }

  enrichAllGames(): void {
    this.enriching.set(true);
    this.enrichmentResult.set(null);

    this.enrichmentService.enrichAllGames()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.enriching.set(false);
          this.enrichmentResult.set(result);
        },
        error: err => {
          console.error('Enrichment failed:', err);
          this.enriching.set(false);
          this.enrichmentResult.set({
            enriched: 0,
            unchanged: 0,
            failed: 0,
            details: [],
            message: 'Enrichment failed: ' + (err.error?.message || err.message || 'Unknown error')
          });
        }
      });
  }

  toggleDetails(): void {
    this.showDetails.update(show => !show);
  }
}

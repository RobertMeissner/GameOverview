import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SteamService } from '../../services/steam.service';

@Component({
  selector: 'app-steam-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './steam-import.html',
  styleUrl: './steam-import.scss'
})
export class SteamImportComponent {
  private steamService = inject(SteamService);
  private destroyRef = inject(DestroyRef);

  steamId = signal('');
  importing = signal(false);
  steamEnabled = signal(false);
  importResult = signal<{
    success: boolean;
    created: number;
    updated: number;
    failed: number;
    message: string;
  } | null>(null);

  ngOnInit(): void {
    this.checkSteamStatus();
  }

  checkSteamStatus(): void {
    this.steamService.getStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: status => {
          this.steamEnabled.set(status.enabled);
        },
        error: err => {
          console.error('Failed to check Steam status:', err);
          this.steamEnabled.set(false);
        }
      });
  }

  importLibrary(): void {
    const steamIdValue = this.steamId().trim();
    if (!steamIdValue) {
      this.importResult.set({
        success: false,
        created: 0,
        updated: 0,
        failed: 0,
        message: 'Please enter a Steam ID'
      });
      return;
    }

    this.importing.set(true);
    this.importResult.set(null);

    this.steamService.importLibrary(steamIdValue)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.importing.set(false);
          this.importResult.set(result);
        },
        error: err => {
          console.error('Import failed:', err);
          this.importing.set(false);
          this.importResult.set({
            success: false,
            created: 0,
            updated: 0,
            failed: 0,
            message: 'Import failed: ' + (err.error?.message || err.message || 'Unknown error')
          });
        }
      });
  }
}

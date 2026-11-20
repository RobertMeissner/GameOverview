/**
 * Format a playtime given in hours to a human-readable string.
 * @param hours Playtime in hours (e.g. hltbMainHours)
 * @returns Formatted string like "45m", "5.2h"
 */
export function formatPlaytimeHours(hours: number | null | undefined): string {
  if (hours == null) return '?h';
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  return `${Math.round(hours * 10) / 10}h`;
}

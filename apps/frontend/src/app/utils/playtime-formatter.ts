/**
 * Format playtime in minutes to a human-readable string
 * @param minutes Playtime in minutes
 * @returns Formatted string like "5.2h" or "120h"
 */
export function formatPlaytime(minutes: number | null | undefined): string {
  if (minutes == null || minutes === 0) {
    return '';
  }

  const hours = minutes / 60;

  if (hours < 1) {
    return `${minutes}m`;
  } else if (hours < 10) {
    return `${hours.toFixed(1)}h`;
  } else {
    return `${Math.round(hours)}h`;
  }
}

/**
 * Format playtime in minutes to hours with one decimal
 * @param minutes Playtime in minutes
 * @returns Hours as number with one decimal
 */
export function minutesToHours(minutes: number | null | undefined): number {
  if (minutes == null) {
    return 0;
  }
  return Math.round((minutes / 60) * 10) / 10;
}

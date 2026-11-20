// Store search URLs for games without direct store links
export function steamSearchUrl(gameName: string): string {
  return `https://store.steampowered.com/search/?term=${encodeURIComponent(gameName)}`;
}

export function gogSearchUrl(gameName: string): string {
  return `https://www.gog.com/en/games?query=${encodeURIComponent(gameName)}&order=desc:score`;
}

export function epicSearchUrl(gameName: string): string {
  return `https://store.epicgames.com/browse?q=${encodeURIComponent(gameName)}`;
}

export function hltbSearchUrl(gameName: string): string {
  return `https://howlongtobeat.com/?q=${encodeURIComponent(gameName)}`;
}

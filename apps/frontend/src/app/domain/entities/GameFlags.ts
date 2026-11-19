export interface GameFlags {
  markedAsPlayed: boolean;
  markedAsHidden: boolean;
  markedForLater: boolean;
}

export function gameFlagsOf(game: GameFlags): GameFlags {
  return {
    markedAsPlayed: game.markedAsPlayed ?? false,
    markedAsHidden: game.markedAsHidden ?? false,
    markedForLater: game.markedForLater ?? false,
  };
}

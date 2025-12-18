import {Injectable} from '@angular/core';
import {Game} from '../domain/entities/game.model';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {CollectionEntry} from '../domain/entities/CollectionEntry';

@Injectable({providedIn: 'root'})
export class GamesService {
  private readonly apiUrl = environment.apiUrl
  private readonly userId = environment.userId

  constructor(private http: HttpClient) {
  }

  getAllGames(): Observable<CollectionEntry[]> {
    return this.http.get<CollectionEntry[]>(`${this.apiUrl}/collection`, {params: {"userId": this.userId}})
      .pipe(map(games => games.map(game => this.withCachedThumbnail(game))));
  }

  getTopGames(): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.apiUrl}/collection/top`, {params: {"userId": this.userId}})
      .pipe(map(games => games.map(game => this.withCachedThumbnail(game))));
  }

  updateGameFlags(gameId: string, flags: {
    markedAsPlayed: boolean;
    markedAsHidden: boolean;
    markedForLater: boolean;
  }): Observable<CollectionEntry> {
    return this.http.patch<CollectionEntry>(`${this.apiUrl}/collection/games/${gameId}`, flags, {params: {"userId": this.userId}})
      .pipe(map(game => this.withCachedThumbnail(game)));
  }

  private withCachedThumbnail<T extends { id: string; thumbnailUrl: string }>(game: T): T {
    return {
      ...game,
      thumbnailUrl: `${this.apiUrl}/thumbnails/${game.id}`
    };
  }
}

import {Injectable} from '@angular/core';
import {Game} from '../domain/entities/game.model';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {CollectionEntry} from '../domain/entities/CollectionEntry';
import {AdminGameEntry} from '../domain/entities/AdminGameEntry';
import {RescrapeRequest, RescrapeResult} from '../domain/entities/ScrapedGameInfo';

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

  getTopGames(): Observable<CollectionEntry[]> {
    return this.http.get<CollectionEntry[]>(`${this.apiUrl}/collection/top`, {params: {"userId": this.userId}})
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

  getAdminGames(): Observable<AdminGameEntry[]> {
    return this.http.get<AdminGameEntry[]>(`${this.apiUrl}/collection/admin`, {params: {"userId": this.userId}})
      .pipe(map(games => games.map(game => this.withCachedThumbnail(game))));
  }

  getBacklogGames(): Observable<CollectionEntry[]> {
    return this.http.get<CollectionEntry[]>(`${this.apiUrl}/collection/backlog`, {params: {"userId": this.userId}})
      .pipe(map(games => games.map(game => this.withCachedThumbnail(game))));
  }

  updateCatalogValues(gameId: string, values: {
    steamAppId: number | null;
    steamName: string | null;
    gogId: number | null;
    gogName: string | null;
    metacriticScore: number | null;
    metacriticName: string | null;
  }): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/catalog/games/${gameId}`, values);
  }

  mergeGames(targetId: string, sourceIds: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/catalog/games/${targetId}/merge`, {sourceIds});
  }

  rescrapeGame(gameId: string, request?: RescrapeRequest): Observable<RescrapeResult> {
    return this.http.post<RescrapeResult>(
      `${this.apiUrl}/catalog/games/${gameId}/rescrape`,
      request ?? {}
    );
  }

  private withCachedThumbnail<T extends { id: string; thumbnailUrl: string }>(game: T): T {
    return {
      ...game,
      thumbnailUrl: `${this.apiUrl}/thumbnails/${game.id}`
    };
  }
}

import {Injectable} from '@angular/core';
import {Game} from '../domain/entities/game.model';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {CollectionEntry} from '../domain/entities/CollectionEntry';

@Injectable({providedIn: 'root'})
export class GamesService {
  private readonly apiUrl = environment.apiUrl
  private readonly userId = environment.userId

  constructor(private http: HttpClient) {
  }

  getAllGames(): Observable<CollectionEntry[]> {
    return this.http.get<CollectionEntry[]>(`${this.apiUrl}/collection`, {params: {"userId": this.userId}});
  }

  getTopGames(): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.apiUrl}/collection/top`, {params: {"userId": this.userId}});
  }
}

import { ComponentFixture, TestBed } from '@angular/core/testing';
import {describe, beforeEach, it} from "vitest";
import { TopGames } from './top-games';

describe('TopGames', () => {
  let component: TopGames;
  let fixture: ComponentFixture<TopGames>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopGames]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopGames);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

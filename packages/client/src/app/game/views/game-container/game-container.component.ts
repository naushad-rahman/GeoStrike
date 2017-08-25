import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import { AuthorizationMiddleware } from '../../../core/network/authorization-middleware';
import { ApolloQueryObservable } from 'apollo-angular';
import { CurrentGame, GameFields } from '../../../types';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';
import { AcEntity, AcNotification, ActionType } from 'angular-cesium';

@Component({
  selector: 'game-container',
  templateUrl: './game-container.component.html',
  styleUrls: ['./game-container.component.scss']
})
export class GameContainerComponent implements OnInit, OnDestroy {
  private gameData$: ApolloQueryObservable<CurrentGame.Query>;
  private game: CurrentGame.CurrentGame;
  private gameDataSubscription: Subscription;
  private players$: Subject<AcNotification[]> = new Subject<AcNotification[]>();

  constructor(private gameService: GameService, private activatedRoute: ActivatedRoute, private router: Router) {
  }

  ngOnInit() {
    const paramsSubscription = this.activatedRoute.params.subscribe(params => {
      if (!params.playerToken) {
        this.router.navigate(['/']);
        paramsSubscription.unsubscribe();

        return;
      }

      AuthorizationMiddleware.setToken(params.playerToken);
      this.gameService.refreshConnection();
      this.gameData$ = this.gameService.getCurrentGameData();
      this.gameDataSubscription = this.gameData$.subscribe(({ data: { currentGame } }) => {
        this.game = currentGame;

        const playersNotifications = this.game.players.map<AcNotification>(player => ({
          actionType: ActionType.ADD_UPDATE,
          id: player.id,
          entity: new AcEntity(player),
        }));

        this.players$.next(playersNotifications);
      }, e => {
        this.router.navigate(['/']);
      });
    });
  }

  ngOnDestroy() {
    if (this.gameDataSubscription) {
      this.gameDataSubscription.unsubscribe();
    }
  }
}
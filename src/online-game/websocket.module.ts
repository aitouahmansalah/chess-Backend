import { Module } from '@nestjs/common';
import { OnlineGameGateway } from './online-game.gateway';

@Module({
  providers: [OnlineGameGateway],
})
export class WebsocketModule {}

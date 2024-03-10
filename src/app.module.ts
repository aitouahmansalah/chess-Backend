import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { BookmarkModule } from './bookmark/bookmark.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { OnlineGameGateway } from './online-game/online-game.gateway';
import { WebsocketModule } from './online-game/websocket.module';



@Module({
  imports: [
    AuthModule, 
    UserModule,
    BookmarkModule,
    WebsocketModule,
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true
    }),
  ],
  providers: [OnlineGameGateway],
})
export class AppModule {}

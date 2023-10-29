import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { UsersService } from './user.service';
import { UsersController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { cookieMiddleware } from 'src/middleware/cookie.middleware';
import { EmailService } from 'src/email/email.service';
import { StateService } from 'src/state/state.service';
import { MemoryStoredFile, NestjsFormDataModule } from 'nestjs-form-data';
import { UserSubscriber } from 'src/dataBaseChangeObserver/database-change.service';
import { WebsocketService } from 'src/websocket/websocket.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Room } from 'src/websocket/entities/room.entity';
import { Message } from 'src/websocket/entities/message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Room, Message]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: process.env.SECRET_REGISTER_KEY,
        signOptions: {
          expiresIn: '1h', // Время жизни токена
        },
      }),
      inject: [ConfigService],
    }),
    // Модуль парсит входящую форм дату в читаемый обьект
    NestjsFormDataModule.configAsync({
      useFactory: () => ({
        storage: MemoryStoredFile,
      }),
    }),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    EmailService,
    StateService,
    UserSubscriber,
    WebsocketService,
  ],
})
export class UsersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieMiddleware).forRoutes('*');
  }
}

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { UsersService } from './user.service';
import { UsersController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { cookieMiddleware } from 'src/middleware/cookie.middleware';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: 'Gf6$#@dFb8&kLp2xRz9*Qv1^tWmNs7', // свой секретный ключ, потом поменять на переменную окружения
      signOptions: {
        expiresIn: '1h', // Время жизни токена
      },
    }),
  ], // соединение с базой данных
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieMiddleware).forRoutes('*');
  }
}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/user.module';
import { User } from './users/entities/user.entity';
import { EmailService } from './email/email.service';
import { StateService } from './state/state.service';
import { AppGateway } from './app/app.gateway';
import { GateWayModule } from './app/app.gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule, GateWayModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('BD_HOST'),
        port: configService.get('BD_PORT'),
        username: configService.get('BD_USERNAME'),
        password: configService.get('BD_PASSWORD'),
        database: configService.get('BD_DATABASE'),
        entities: [User],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService, EmailService, StateService],
})
export class AppModule {}

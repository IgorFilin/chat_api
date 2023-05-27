import { BadRequestException, Injectable, Request } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private UserTable: Repository<User>,
  ) {}

  async search(createAuthDto: CreateAuthDto) {
    if (createAuthDto.email === '' || createAuthDto.password === '') {
      throw new BadRequestException(
        'К сожалению недостаточно данных для авторизации',
      );
    }
    const user = await this.UserTable.findOneBy({ email: createAuthDto.email });
    if (user && Object.keys(user).length) {
      const temp = await bcrypt.compare(createAuthDto.password, user.password);
      if (temp) {
        return { message: `Добро пожаловать ${user.name}` };
      } else {
        throw new BadRequestException('Неверный пароль');
      }
    } else {
      throw new BadRequestException(
        'К сожалению такого пользователя не существует',
      );
    }
  }
}

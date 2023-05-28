import { BadRequestException, Injectable, Res } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private UserTable: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const email = await this.UserTable.findOneBy({
        email: createUserDto.email,
      });
      if (email) {
        throw new BadRequestException('К сожалению такая почта уже существует');
      } else {
        const user = await User.createUser(createUserDto);
        return this.UserTable.save(user);
      }
    } catch (e) {}
  }

  async update(id: string, name: string) {
    const user = await this.UserTable.findOneBy({ id });
    user.changeNameUser(name);
    return this.UserTable.save(user);
  }

  async login(LoginUserDto: LoginUserDto) {
    if (LoginUserDto.email === '' || LoginUserDto.password === '') {
      throw new BadRequestException(
        'К сожалению недостаточно данных для авторизации',
      );
    }
    const user = await this.UserTable.findOneBy({ email: LoginUserDto.email });
    if (user && Object.keys(user).length) {
      const userPasswordValid = await bcrypt.compare(
        LoginUserDto.password,
        user.password,
      );
      if (userPasswordValid) {
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

  async remove(id: string) {
    return this.UserTable.delete({ id });
  }

  async get(id: string) {
    return this.UserTable.findOneBy({ id });
  }
}

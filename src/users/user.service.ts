import { BadRequestException, Injectable, Res } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private UserTable: Repository<User>,
    private JwtService: JwtService,
    private readonly mailerService: MailerService,
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
        return { message: `Добро пожаловать ${user.name}`, name: user.name };
      } else {
        throw new BadRequestException('Неверный пароль');
      }
    } else {
      throw new BadRequestException(
        'К сожалению такого пользователя не существует',
      );
    }
  }

  async createToken(payload: LoginUserDto) {
    const token = this.JwtService.sign(payload);
    return token;
  }
}

import { BadRequestException, Injectable, Res } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { StateService } from 'src/state/state.service';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private UserTable: Repository<User>,
    private JwtService: JwtService,
    private stateService: StateService,
    private readonly emailService: EmailService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const email = await this.UserTable.findOneBy({
        email: createUserDto.email,
      });
      if (email) {
        throw new BadRequestException('К сожалению такая почта уже существует');
      } else {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
        const confirmRegKey = randomBytes(5).toString('hex');

        //Создаем пользователя по сущности
        const user = new User();
        user.name = createUserDto.name;
        user.email = createUserDto.email;
        user.password = hashedPassword;
        user.date = new Date();
        user.isAcceptKey = confirmRegKey;

        //Сохраняем в БД пользователя с регистрационным key
        this.UserTable.save(user);

        //Отсылаем на почту ключ подтверждения
        await this.emailService.sendConfirmationEmail(
          user.email,
          confirmRegKey,
        );

        //Возвращаем значение что ключ на почту отправлен
        return { isRegConfirm: true };
      }
    } catch (e) {}
  }

  async confirmRegistration(key: string) {
    try {
      //  const user = this.stateService.getState()
      //  if(key ===)
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

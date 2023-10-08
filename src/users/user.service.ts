import { BadRequestException, Injectable, Res } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { EmailService } from 'src/email/email.service';
import * as fs from 'node:fs';
import * as path from 'path';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private UserTable: Repository<User>,
    private JwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const findUser = await this.UserTable.findOneBy({
        email: createUserDto.email,
      });
      if (findUser) {
        return { message: 'К сожалению такая почта уже существует' };
      } else {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
        const confirmRegKey = randomBytes(5).toString('hex');

        const dirname = process.cwd();
        const imagePath = path.join(
          dirname,
          'dist',
          'static',
          'image',
          'default_photo_user.webp',
        );

        const token = this.JwtService.sign({
          name: createUserDto.name,
          password: createUserDto.password,
        });

        // Создаем пользователя по сущности
        const user = new User();
        user.name = createUserDto.name;
        user.email = createUserDto.email;
        user.password = hashedPassword;
        user.date = new Date();
        user.isAcceptKey = confirmRegKey;
        user.authToken = token;
        user.userPhoto = imagePath;

        //Сохраняем в БД пользователя с регистрационным key
        this.UserTable.save(user);

        //Отсылаем на почту ключ подтверждения
        await this.emailService.sendConfirmationEmail(
          user.email,
          confirmRegKey,
        );

        //Возвращаем значение что ключ на почту отправлен
        return {
          isRegConfirm: true,
          message: `Приветствую ${user.name}, пожалуйста введи код подтверждения`,
        };
      }
    } catch (e) {}
  }

  async confirmRegistration(key: string) {
    try {
      const acceptUser = await this.UserTable.findOneBy({ isAcceptKey: key });
      if (acceptUser) {
        return {
          user: acceptUser,
          name: acceptUser.name,
          token: acceptUser.authToken,
          id: acceptUser.authToken,
          message: `Добро пожаловать ${acceptUser.name}`,
        };
      } else {
        return { message: 'К сожалению код не верный, попробуйте ещё раз' };
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
        return {
          message: `Добро пожаловать ${user.name}`,
          name: user.name,
          token: user.authToken,
          isAuth: true,
          id: user.id,
        };
      } else {
        throw new BadRequestException('Неверный пароль');
      }
    } else {
      throw new BadRequestException(
        'К сожалению такого пользователя не существует',
      );
    }
  }

  async confirmToken(requestToken: any) {
    if (!requestToken) {
      return { isAuth: false };
    }
    try {
      const user = await this.UserTable.findOneByOrFail({
        authToken: requestToken,
      });
      return {
        name: user.name,
        token: user.authToken,
        isAuth: true,
        id: user.id,
      };
    } catch (error) {
      return { isAuth: false };
    }
  }

  async getPhoto(authToken: string) {
    if (authToken) {
      const user = await this.UserTable.findOneBy({ authToken });
      if (user.authToken) {
        const image = path.basename(user.userPhoto);
        const dirname = process.cwd();
        const imagePath = path.join(
          dirname,
          'dist',
          'static',
          'image',
          image ? image : 'default_photo_user.webp',
        );
        return imagePath;
      }
    }
  }

  async setPhoto(userId: string, newAvatar: any) {
    try {
      if (
        newAvatar.avatar.busBoyMimeType !== 'image/webp' &&
        newAvatar.avatar.busBoyMimeType !== 'image/png'
      ) {
        return {
          message: 'Пожалуйста выберите изоражение формата webp или png',
        };
      }
      // Сохраняем файл по дефолтному пути, в папку dist сборки проекта.
      const dirname = process.cwd();
      const savePath = path.join(
        dirname,
        'src',
        'static',
        'image',
        newAvatar.avatar.originalName,
      );
      fs.writeFile(savePath, newAvatar.avatar.buffer, () => {});

      // Заменяем у пользователя путь к аварке в БД на новый
      // Ищем пользователя
      const user = await this.UserTable.findOneBy({
        id: userId,
      });

      // Если id пользователя равен id найденного пользоваетля, проверка на всякий случай
      if (user.id === userId) {
        user.userPhoto = savePath;
        this.UserTable.save(user);

        return savePath;
      }
    } catch (e) {}
  }
}

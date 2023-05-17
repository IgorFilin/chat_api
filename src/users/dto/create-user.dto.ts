import {
  IsEmail,
  MinLength,
  IsString,
  isEmail,
  Validate,
} from 'class-validator';
import { IsAllowedDomain } from '../validators/email';

export class CreateUserDto {
  @IsEmail({}, { message: 'Некорректный адрес электронной почты' })
  @Validate(IsAllowedDomain)
  email: string;

  @MinLength(6, { message: 'Пожалуйста введи в пароль больше 6 символов' })
  password: string;

  @IsString()
  name: string;
}

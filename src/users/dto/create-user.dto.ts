import {
  IsEmail,
  MinLength,
  IsString,
  IsNotEmpty,
  Validate,
  isEmail,
} from 'class-validator';
import { IsAllowedDomain } from '../validators/email';

export class CreateUserDto {
  @Validate(IsAllowedDomain)
  email: string;

  @MinLength(6, { message: 'Пожалуйста введи в пароль больше 6 символов' })
  password: string;

  @IsString()
  name: string;
}

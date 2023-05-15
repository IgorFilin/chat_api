import { IsEmail, MinLength, IsString, isEmail } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @MinLength(6, { message: 'Пожалуйста введи в пароль больше 6 символов' })
  password: string;

  @IsString()
  name: string;
}

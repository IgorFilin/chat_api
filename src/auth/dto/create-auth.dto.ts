import { MinLength, IsString } from 'class-validator';
export class CreateAuthDto {
  @MinLength(6, { message: 'Пожалуйста введи в пароль больше 6 символов' })
  password: string;

  @IsString()
  email: string;
}

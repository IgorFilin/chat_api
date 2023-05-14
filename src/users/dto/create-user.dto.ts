import { IsEmail, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @MinLength(6, { message: 'Please input over 6 items' })
  password: string;

  name: string;
}

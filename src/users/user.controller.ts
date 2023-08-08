import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UsePipes,
  Res,
  Req,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ValidationPipe } from '@nestjs/common';
import { Response, Request } from 'express';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.usersService.get(id);
  }

  @Post('registration')
  @UsePipes(new ValidationPipe())
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('login')
  async login(@Body() LoginUserDto: LoginUserDto, @Res() res: Response) {
    const result = await this.usersService.login(LoginUserDto);
    res.cookie('authToken', '123123');
    return res.send(result);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body('name') name: string) {
    return this.usersService.update(id, name);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}

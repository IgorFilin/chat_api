import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

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
        const user = User.createUser(createUserDto);
        return this.UserTable.save(user);
      }
    } catch (e) {}
  }

  async update(id: string, name: string) {
    const user = await this.UserTable.findOneBy({ id });
    user.changeNameUser(name);
    return this.UserTable.save(user);
  }

  async remove(id: string) {
    return this.UserTable.delete({ id });
  }
}

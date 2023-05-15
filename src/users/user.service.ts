import { Injectable } from '@nestjs/common';
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
    const user = User.createUser(createUserDto);
    return this.UserTable.save(user);
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
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

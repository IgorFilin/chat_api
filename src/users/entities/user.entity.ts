import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CreateUserDto } from '../dto/create-user.dto';

@Entity('Users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  name: string;

  @Column()
  password: string;

  @CreateDateColumn()
  date: Date;

  static createUser(dataUser: CreateUserDto) {
    const user = new User();
    user.name = dataUser.name;
    user.email = dataUser.email;
    user.password = dataUser.password;
    user.date = new Date();
    return user;
  }

  changeNameUser(name: string) {
    this.name = name;
  }
}

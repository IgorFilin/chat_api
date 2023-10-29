import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Room } from './room.entity';

@Entity('Message')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  message: string;

  @Column()
  name: string;

  @Column()
  userId: string;

  @Column()
  userPhoto: string;

  @ManyToOne(() => Room, (room) => room.messages)
  room: Room;
}

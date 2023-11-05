import { InjectRepository } from '@nestjs/typeorm';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as fs from 'node:fs';
import { Room } from './entities/room.entity';
import { Message } from './entities/message.entity';

@WebSocketGateway()
export class WebsocketService {
  constructor(
    @InjectRepository(User)
    private UserTable: Repository<User>,

    @InjectRepository(Room)
    private RoomTable: Repository<Room>,

    @InjectRepository(Message)
    private MessageTable: Repository<Message>,
  ) {}

  @WebSocketServer()
  server: Server;
  clients = {};
  messages = [];

  async updatedClientsAfterUpdateDataBase(user: any) {
    const searchedUser = this.clients[user.id];
    searchedUser.userPhoto = user.userPhoto;
  }

  async getAllMessagesPublicChat(userId: string) {
    const client = this.clients[userId];
    for (let i = 0; i < this.messages.length; i++) {
      client.client.send(
        JSON.stringify({
          messages: this.messages[i],
          lengthMessages: this.messages.length,
        }),
      );
    }
  }

  async broadcastMessage(
    userId: any,
    message: string | ArrayBuffer,
    roomId: string,
  ) {
    const user = this.clients[userId];

    // if (typeof message !== 'string') {
    //   message = message;
    // } else {
    //   message = message.trim();
    // }

    const sendData = {
      message: message,
      userId: user.id,
      name: user.name.trim(),
      userPhoto: '',
      roomId: roomId,
    };

    if (!roomId) {
      try {
        const result = await fs.promises.readFile(user.userPhoto, 'base64');
        sendData.userPhoto = result;
      } catch (e) {
      } finally {
        if (this.messages.length < 20) {
          this.messages.push(sendData);
        } else {
          this.messages.pop();
          this.messages.push(sendData);
        }

        for (const client in this.clients) {
          const messages = JSON.stringify({ messages: sendData });
          this.clients[client].client.send(messages);
        }
      }
    } else {
      const Room = await this.RoomTable.findOne({
        where: { id: roomId },
        relations: ['users'],
      }); // получаем пользаков данной комнаты.

      // console.log('USERS', Room.users);
    }
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() body: any) {
    this.broadcastMessage(body.id, body.message, ''); // отправляем данные всем подключенным клиентам
  }

  @SubscribeMessage('all_messages_public')
  handleAllMessage(@MessageBody() body: any) {
    this.getAllMessagesPublicChat(body.id); // отправляем данные всем подключенным клиентам
  }

  @SubscribeMessage('open_room')
  async handleOpenPrivateRoom(
    @MessageBody() body: { myId: string; userId: string },
  ) {
    const creator = await this.UserTable.findOneBy({ id: body.myId });
    const userToAdd = await this.UserTable.findOneBy({ id: body.userId });

    const client = this.clients[body.myId];

    // Получает комнату в которой есть 2 пользователя, вы и пользователь собеседник
    let room = await this.RoomTable.createQueryBuilder('room')
      .innerJoin('room.users', 'user1') // Делает связь свойства сущности room с массивом подтаблицей users
      .innerJoin('room.users', 'user2') // Делает связь свойства сущности room с массивом подтаблицей users 2 раз
      .where('user1.id = :userId1 AND user2.id = :userId2', {
        userId1: creator.id,
        userId2: userToAdd.id,
      }) // ищем в подтаблице для данной комнаты наличие userId1 и userId2 и если есть возвращать комнату
      .getOne();

    if (!room) {
      // Создайте новую комнату и добавьте пользователей
      room = new Room();
      room.name = `${creator.name}_${userToAdd.name}`;
      room.users = [creator, userToAdd];
      room.messages = [];
      this.RoomTable.save(room);
    }

    let roomMessages = await this.RoomTable.createQueryBuilder('room')
      .leftJoinAndSelect('room.messages', 'message1')
      .where('message1.roomId = :roomId', { roomId: room.id })
      .getOne(); // получение пака сообщений из подтаблицы Message, если их нет то null

    if (!roomMessages) {
      client.client.send(
        JSON.stringify({
          lengthMessages: 0,
          userToAddPrivat: userToAdd.name,
          messages: {
            roomId: room.id,
            roomName: room.name,
            messages: {},
          },
        }),
      );
      return;
    }

    for (let i = 0; i < roomMessages.messages.length; i++) {
      roomMessages.messages[i].userPhoto = await fs.promises.readFile(
        roomMessages.messages[i].userPhoto,
        'base64',
      );

      client.client.send(
        JSON.stringify({
          lengthMessages: roomMessages.messages.length,
          userToAddPrivat: userToAdd.name,
          messages: {
            roomId: room.id,
            roomName: room.name,
            ...roomMessages.messages[i],
          },
        }),
      );
    }
  }

  @SubscribeMessage('private_message')
  handlePrivateMessage(@MessageBody() body: any) {
    this.broadcastMessage(body.id, body.message, body.roomId);
  }

  handleDisconnect(disconnectedClient: any, ...args: any) {
    // Удаляем клиента который отключился
    delete this.clients[disconnectedClient.userId];

    const sendClients = [];

    for (const clientId in this.clients) {
      sendClients.push({
        id: clientId,
        name: this.clients[clientId].name,
      });
    }

    // При отключении определенного клиента, отправляем список всех пользователей и себя в частности, на клиент
    for (const clientId in this.clients) {
      this.clients[clientId].client.send(
        JSON.stringify({ clients: sendClients }),
      );
    }

    console.log('Client disconnect');
  }

  async handleConnection(client: Socket, ...args: any) {
    // Вытаскием id с квери параметров
    const url = new URLSearchParams(args[0].url);
    const userId = url.get('/?userID');

    // Ищем пользака по этому id
    const user = await this.UserTable.findOneBy({
      id: userId,
    });
    // Если пользака нет в обьекте клиентов веб сокетов, то добавляем его туда
    if (!this.clients[userId]) {
      this.clients[userId] = {
        id: userId,
        name: user.name,
        userPhoto: user.userPhoto,
        client,
      };
    }

    // Добавляет обьекту клиента веб сокета id, для успешной идентификации и удаления при дисконнекте
    client['userId'] = userId;

    // Создаем новый массив для отправки подключенных пользователей на клиент
    const sendClients = [];

    for (const clientId in this.clients) {
      sendClients.push({
        id: clientId,
        name: this.clients[clientId].name,
      });
    }

    // При подключении определенного клиента, отправляем список всех пользователей и себя в частности, на клиент
    for (const clientId in this.clients) {
      this.clients[clientId].client.send(
        JSON.stringify({ clients: sendClients }),
      );
    }

    for (let i = 0; i <= this.messages.length; i++) {
      client.send(
        JSON.stringify({
          messages: this.messages[i],
          lengthMessages: this.messages.length,
        }),
      );
    }

    console.log(`Client ${user.name} connected`);
  }
}

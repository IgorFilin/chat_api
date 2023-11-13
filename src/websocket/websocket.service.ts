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
import { isJSON } from 'class-validator';

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
  publicChatEvent = 'message' as 'message';
  privateChatEvent = 'private_message' as 'private_message';

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

  async disconnectUser(disconnectedClient: any) {
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

  async connectedUser(client: any, args: any) {
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

  async broadcastMessage(
    userId: any,
    message: string | Array<[]>,
    roomId: string,
    event: 'message' | 'private_message',
  ) {
    const user = this.clients[userId];

    const maxMessageSize = 300 * 1024; // Максимальный размер сообщения для изобращения

    if (Array.isArray(message) && message.length >= maxMessageSize) {
      return; // Отклоните слишком большое сообщение
    }

    if (message === '') return; // Отклоните пустое сообщение

    const sendData = {
      message: message,
      userId: user.id,
      name: user.name.trim(),
      userPhoto: '',
      roomId: roomId,
      event: event,
    };

    try {
      const result = await fs.promises.readFile(user.userPhoto, 'base64');
      sendData.userPhoto = result;
    } catch (e) {}

    const messages = JSON.stringify({ messages: sendData });

    if (!roomId) {
      if (this.messages.length < 20) {
        this.messages.push(sendData);
      } else {
        this.messages.pop();
        this.messages.push(sendData);
      }
      for (const client in this.clients) {
        this.clients[client].client.send(messages);
      }
    } else {
      const room = await this.RoomTable.findOne({
        where: { id: roomId },
        relations: ['users'],
      }); // получаем пользаков данной комнаты.

      let messageToSaveDB: string | Array<[]>;

      if (Array.isArray(message)) {
        messageToSaveDB = JSON.stringify(message);
      } else {
        messageToSaveDB = message.trim();
      } // Нужно добавить поддержку отправку фото в личку

      const newMessage = new Message();
      newMessage.message = messageToSaveDB;
      newMessage.name = user.name;
      newMessage.userId = user.id;
      newMessage.userPhoto = user.userPhoto;
      newMessage.room = room;

      await this.MessageTable.save(newMessage);

      // let roomMessages = await this.RoomTable.createQueryBuilder('room')
      //   .leftJoinAndSelect('room.messages', 'message1')
      //   .where('message1.roomId = :roomId', { roomId: room.id })
      //   .getOne(); // получение пака сообщений из подтаблицы Message, если их нет то null

      for (let user of room.users) {
        if (this.clients[user.id]) {
          this.clients[user.id].client.send(messages);
        }
      }
    }
  }

  @SubscribeMessage('message')
  async handleMessage(@MessageBody() body: any) {
    await this.broadcastMessage(
      body.id,
      body.message,
      null,
      this.publicChatEvent,
    ); // отправляем данные всем подключенным клиентам
  }

  @SubscribeMessage('private_message')
  async handlePrivateMessage(@MessageBody() body: any) {
    await this.broadcastMessage(
      body.id,
      body.message,
      body.roomId,
      this.privateChatEvent,
    ); // Личные сообщения
  }

  @SubscribeMessage('all_messages_public')
  async handleAllMessage(@MessageBody() body: any) {
    await this.getAllMessagesPublicChat(body.id); // отправляем данные всем подключенным клиентам
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
          openRoom: true,
          messages: {
            roomId: room.id,
            roomName: room.name,
            event: this.privateChatEvent,
            messages: [],
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

      if (isJSON(roomMessages.messages[i].message)) {
        roomMessages.messages[i].message = JSON.parse(
          roomMessages.messages[i].message,
        );
      }

      client.client.send(
        JSON.stringify({
          lengthMessages: roomMessages.messages.length,
          userToAddPrivat: userToAdd.name,
          openRoom: true,
          messages: {
            event: this.privateChatEvent,
            roomId: room.id,
            roomName: room.name,
            ...roomMessages.messages[i],
          },
        }),
      );
    }
  }

  async handleDisconnect(disconnectedClient: any, ...args: any) {
    await this.disconnectUser(disconnectedClient);
  }

  async handleConnection(client: Socket, ...args: any) {
    await this.connectedUser(client, args);
  }
}

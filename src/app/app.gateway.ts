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

@WebSocketGateway()
export class AppGateway {
  constructor(
    @InjectRepository(User)
    private UserTable: Repository<User>,
  ) {}
  @WebSocketServer()
  server: Server;
  clients = [];
  messages = [];

  async updatedClientsAfterUpdateDataBase(user: any) {
    const searchedUser = this.clients.find(
      (searchUser) => searchUser.id === user.id,
    );
    searchedUser.userPhoto = user.userPhoto;
  }

  async broadcastMessage(userId: any, message: string | ArrayBuffer) {
    const user = this.clients.find((user) => user.id === userId);

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
      chunkIndex: 0,
    };

    if (this.messages.length < 20) {
      this.messages.unshift(sendData);
    } else {
      this.messages.pop();
      this.messages.unshift(sendData);
    }

    if (message instanceof ArrayBuffer) {
      message = Buffer.from(message).toString('utf8');
    }

    const chunkSize = 1024;
    const totalChunks = Math.ceil(message.length / chunkSize);
    console.log(totalChunks);
    for (const client of this.clients) {
      let count = false;
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = (i + 1) * chunkSize;
        const messageChunk = message.slice(start, end);

        const result = await fs.promises.readFile(user.userPhoto, 'base64');
        sendData.userPhoto = result;

        sendData.message = messageChunk;
        let messageData;
        if (!count) {
          messageData = JSON.stringify({ messageData: sendData });
        } else {
          messageData = JSON.stringify({
            message: messageChunk,
            chunkIndex: i,
          });
        }
        client.client.send(messageData);
        if (!count) count = true;
      }
    }
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() body: any) {
    this.broadcastMessage(body.id, body.message); // отправляем данные всем подключенным клиентам
  }

  handleDisconnect(disconnectedClient: any, ...args: any) {
    // Удаляем клиента который отключился
    this.clients = this.clients.filter(
      (client) => client.id !== disconnectedClient.userId,
    );
    console.log(this.clients);
    // Создаем новый массив для отправки подключенных пользователей на клиент
    const sendClients = this.clients.map((clientMap) => ({
      id: clientMap.id,
      name: clientMap.name,
    }));
    //При отключении определенного клиента, отправляем список всех пользователей и себя в частности, на клиент
    for (const searchClient of this.clients) {
      searchClient.client.send(JSON.stringify({ clients: sendClients }));
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

    // Добавляет обьекту клиента веб сокета id, для успешной идентификации и удаления при дисконнекте
    client['userId'] = userId;

    // Если пользака нет в массиве клиентов веб сокетов, то пушим его туда
    if (!this.clients.some((client) => client.id === user.id)) {
      this.clients.push({
        id: userId,
        name: user.name,
        userPhoto: user.userPhoto,
        client,
      });
    }

    // Создаем новый массив для отправки подключенных пользователей на клиент
    const sendClients = this.clients.map((clientMap) => ({
      id: clientMap.id,
      name: clientMap.name,
    }));

    //При подключении определенного клиента, отправляем список всех пользователей и себя в частности, на клиент
    for (const searchClient of this.clients) {
      searchClient.client.send(JSON.stringify({ clients: sendClients }));
    }

    client.send(JSON.stringify({ messages: this.messages }));

    console.log(`Client ${user.name} connected`);
  }
}

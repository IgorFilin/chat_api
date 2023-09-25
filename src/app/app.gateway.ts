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

  async broadcastMessage(payload: any) {
    const sendData = {
      message: payload.message.trim(),
      userId: payload.user.id,
      name: payload.user.name.trim(),
      userPhoto: '',
    };
    const pr = new Promise((res, rej) => {
      fs.readFile(payload.user.userPhoto, 'base64', (err, data) => {
        if (err) {
          rej(0);
        }
        sendData.userPhoto = data;
        res(1);
      });
    });
    await pr;
    if (this.messages.length < 100) {
      this.messages.unshift(sendData);
    } else {
      this.messages.pop();
      this.messages.unshift(sendData);
    }

    for (const client of this.clients) {
      const messages = JSON.stringify(this.messages);
      client.client.send(messages);
    }
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() body: any) {
    const user = this.clients.find((user) => user.id === body.id);
    const message = body.message;

    this.broadcastMessage({ user, message }); // отправляем данные всем подключенным клиентам
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected`);
  }

  async handleConnection(client: Socket, ...args: any) {
    const url = new URLSearchParams(args[0].url);
    const userId = url.get('/?userID');
    const user = await this.UserTable.findOneBy({
      id: userId,
    });
    this.clients.push({
      id: userId,
      name: user.name,
      userPhoto: user.userPhoto,
      client,
    });

    client.send(JSON.stringify(this.messages));
    console.log(`Client connected`);
  }
}

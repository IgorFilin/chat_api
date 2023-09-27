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

  async broadcastMessage(userId: any, message: string) {
    const user = this.clients.find((user) => user.id === userId);

    const sendData = {
      message: message.trim(),
      userId: user.id,
      name: user.name.trim(),
      userPhoto: '',
    };

    const pr = new Promise<void>((res, rej) => {
      fs.readFile(user.userPhoto, 'base64', (err, data) => {
        if (err) {
          rej();
        }
        sendData.userPhoto = data;
        res();
      });
    });

    try {
      await pr;
    } catch (e) {
    } finally {
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
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() body: any) {
    this.broadcastMessage(body.id, body.message); // отправляем данные всем подключенным клиентам
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
    if (!this.clients.some((client) => client.id === user.id)) {
      this.clients.push({
        id: userId,
        name: user.name,
        userPhoto: user.userPhoto,
        client,
      });
    }

    client.send(
      JSON.stringify({ messages: this.messages, clients: this.clients }),
    );
    console.log(`Client ${user.name} connected`);
  }
}

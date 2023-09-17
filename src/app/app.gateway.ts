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
@WebSocketGateway()
export class AppGateway {
  constructor(
    @InjectRepository(User)
    private UserTable: Repository<User>,
  ) {}
  @WebSocketServer()
  server: Server;
  clients = [];
  
  broadcastMessage(payload: any) {
    for (const client of this.clients) {
      const sendData = { message: payload.message, userId: '', name: '' };
      if (payload.id === client.id) {
        sendData.userId = payload.id;
        sendData.name = client.name;
      }
      const message = JSON.stringify(sendData);
      client.client.send(message);
    }
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() body: any) {
    console.log(body);
    this.broadcastMessage(body); // отправляем данные всем подключенным клиентам
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
    this.clients.push({ id: userId, name: user.name, client });
    console.log(`Client connected`);
    console.log(this.clients);
  }
}

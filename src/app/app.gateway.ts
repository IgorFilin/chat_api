import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
@WebSocketGateway()
export class AppGateway {
  @WebSocketServer()
  server: Server;
  clients = [];

  broadcastMessage(payload: any) {
    for (const client of this.clients) {
      const message = JSON.stringify(payload);
      client.send(message);
    }
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() body: any) {
    this.broadcastMessage(body); // отправляем данные всем подключенным клиентам
  }

  @SubscribeMessage('token')
  setUserId(id: any) {
    console.log(id.data);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.clients.push(client);
    console.log(client);
  }
}

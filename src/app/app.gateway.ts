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
      const sendData = { message: payload.message, userId: '' };
      if (payload.id === client.id) {
        sendData.userId = payload.id;
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

  @SubscribeMessage('token')
  setUserId(id: any) {
    console.log(id.data);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected`);
  }

  handleConnection(client: Socket, ...args: any) {
    const url = new URLSearchParams(args[0].url);
    const userId = url.get('/?userID');
    this.clients.push({ id: userId, client });
    console.log(`Client connected`);
    console.log(this.clients);
  }
}

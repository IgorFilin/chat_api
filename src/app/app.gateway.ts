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
  private logger: Logger = new Logger('WebSocket');

  broadcastMessage(payload: any) {
    for (const client of this.clients) {
      const message = JSON.stringify(payload);
      client.send(message);
    }
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() body: any) {
    console.log(body);
    this.broadcastMessage(body); // отправляем данные всем подключенным клиентам
  }

  afterInit(server: Server) {
    console.log('Init');
    this.logger.log('Init');
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.clients.push(client);
    console.log(`Client connected: ${client.id}`);
    this.logger.log(`Client connected: ${client.id}`);
  }
}

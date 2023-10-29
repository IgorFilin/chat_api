import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  UpdateEvent,
} from 'typeorm';
import { User } from '../users/entities/user.entity';
import { WebsocketService } from 'src/app/websocket.service';

// Слушатель изменения БД
@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  constructor(
    dataSource: DataSource,
    private readonly appGateway: WebsocketService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return User;
  }

  // После обновления чего то в БД, получаем обновлённую сущность
  beforeUpdate(event: UpdateEvent<any>) {
    this.appGateway.updatedClientsAfterUpdateDataBase(event.entity);
  }
}

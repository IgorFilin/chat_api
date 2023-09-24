import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { User } from '../users/entities/user.entity';
import { AppGateway } from 'src/app/app.gateway';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  constructor(dataSource: DataSource, private readonly appGateway: AppGateway) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return User;
  }

  beforeUpdate(event: UpdateEvent<any>) {
    this.appGateway.updatedClientsAfterUpdateDataBase(event.entity);
  }
}

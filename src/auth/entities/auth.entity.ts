import { CreateAuthDto } from '../dto/create-auth.dto';

export class Auth {
  searchUser(dataUser: CreateAuthDto) {
    console.log(dataUser);
  }
}

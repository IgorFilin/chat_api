import { Injectable } from '@nestjs/common';

@Injectable()
export class StateService {
  private state: any = {};

  setState(key: string, value: any) {
    this.state[key] = value;
  }

  getState(key: string) {
    return this.state[key];
  }

  clearState(key: string) {
    delete this.state[key];
  }
}

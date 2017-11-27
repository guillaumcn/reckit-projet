import {Injectable} from '@angular/core';
import {toast} from 'angular2-materialize';

@Injectable()
export class ToastService {

  constructor() {
  }

  toast(message) {
    toast(message, 3000);
  }

}

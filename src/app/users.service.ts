import { Injectable } from '@angular/core';
import {AngularFireDatabase, AngularFireList} from 'angularfire2/database';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {User} from './user.model';

@Injectable()
export class UsersService {

  query = new Subject<string>();
  usersQueryObservable: Observable<User[]>;


  constructor(private db: AngularFireDatabase) {
    this.usersQueryObservable = this.query.switchMap(value =>
      db.list('/users', ref =>
        ref.orderByChild('email').limitToFirst(5).startAt(value)).valueChanges()
    );
  }

  updateUserData(uid: string, email: string, displayName: string) {
    this.db.object<User>('/users/' + uid).update({email: email, displayName: displayName});
  }

}

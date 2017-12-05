import { Injectable } from '@angular/core';
import {AngularFireDatabase, AngularFireList} from 'angularfire2/database';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {User} from './user.model';

@Injectable()
export class UsersService {

  private usersListRef: AngularFireList<User>;
  query = new Subject<string>();
  usersQueryObservable: Observable<User[]>;


  constructor(private db: AngularFireDatabase) {
    this.usersListRef = this.db.list<User>('/users');
    this.usersQueryObservable = this.query.switchMap(value =>
      db.list('/users', ref =>
        ref.orderByChild('email').limitToFirst(5).startAt(value)).valueChanges()
    );
  }

  addUserData(email: string, displayName: string) {
    this.usersListRef.push({email: email, displayName: displayName});
  }

}

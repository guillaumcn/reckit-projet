import {Injectable} from '@angular/core';
import {AngularFireDatabase, AngularFireList} from 'angularfire2/database';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {User} from './user.model';
import {AngularFirestore} from 'angularfire2/firestore';

@Injectable()
export class UsersService {

  query = new Subject<string>();
  usersQueryObservable: Observable<User[]>;


  constructor(private afs: AngularFirestore) {
    this.usersQueryObservable = this.query.switchMap(value =>
      afs.collection('/users', ref =>
        ref.orderBy('email').limit(5).startAt(value).endAt(value + '\uf8ff')).valueChanges()
    );
  }

  updateUserData(uid: string, email: string, displayName: string) {
    this.afs.doc<User>('/users/' + uid).set({email: email, displayName: displayName});
  }

  updateUserFollowedTags(uid: string, followedTags: string[], callback?) {
    this.afs.doc<User>('/users/' + uid).update({followedTags: followedTags}).then(() => {
      if (callback) {
        callback();
      }
    });
  }

  getUserObservable(uid: string) {
    return this.afs.doc<User>('/users/' + uid).valueChanges();
  }

}

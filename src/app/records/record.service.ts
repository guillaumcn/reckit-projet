import {Injectable} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {AngularFireDatabase, AngularFireList} from 'angularfire2/database';
import {Observable} from 'rxjs/Observable';
import {ToastService} from '../toast.service';
import {Record} from './record.model';
import * as firebase from 'firebase';
import Reference = firebase.storage.Reference;
import {LoadingService} from '../loading/loading.service';
import {AuthService} from '../authentication/auth.service';

@Injectable()
export class RecordService {

  // Chaque élément du tableau de Record[] est une ligne de Firebase
  recordListRef: AngularFireList<Record>;
  fireBaseObservable: Observable<Record[]>;
  storageRef: Reference;

  recordSelected: Subject<Record> = new Subject();

  temporaryFile: File = null;

  selectOptions: string[] = ['Cours', 'Réunion', 'Conférence', 'Discours'];

  constructor(private db: AngularFireDatabase, private toastService: ToastService,
              private loadingService: LoadingService, private authService: AuthService) {
    this.recordListRef = this.db.list<Record>('/records');
    this.fireBaseObservable = this.recordListRef.snapshotChanges().map(actions => {
      return actions.map(action => {
        const data = action.payload.val() as Record;
        const key = action.payload.key;
        return {key, ...data};
      });
    });
    this.storageRef = firebase.storage().ref();
  }

  addRecord(name: string, orator: string, duration: number, type: string, tags: string[]) {
    this.loadingService.isLoading = true;
    if (this.temporaryFile == null) {
      this.toastService.toast('Vous devez d\'abord enregistrer quelque chose');
    } else {
      this.recordListRef.push({
        name: name,
        recorder: this.authService.userDetails.displayName,
        recorderMail: this.authService.userDetails.email,
        orator: orator,
        duration: duration,
        type: type,
        tags: tags
      }).then((data) => {
        const uploadTask = this.storageRef.child('/records/' + data.key + '.mp3').put(this.temporaryFile);
        uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, (snapshot) => {
          },
          (error) => {
            // upload failed
            console.log(error);
          },
          () => {
            this.loadingService.isLoading = false;
            this.toastService.toast('Enregistrement créé avec succés');
            this.recordSelected.next(null);
          });
      });
    }

  }

  updateRecord(key: string, name: string, orator: string, duration: number, type: string, tags: string[]) {
    this.loadingService.isLoading = true;
    this.recordListRef.update(key, {
      name: name,
      recorder: this.authService.userDetails.displayName,
      recorderMail: this.authService.userDetails.email,
      orator: orator,
      duration: duration,
      type: type,
      tags: tags
    }).then((data) => {
      const uploadTask = this.storageRef.child('/records/' + key + '.mp3').put(this.temporaryFile);
      uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, (snapshot) => {
        },
        (error) => {
          // upload failed
          console.log(error);
        },
        () => {
          this.loadingService.isLoading = false;
          this.toastService.toast('Enregistrement modifié avec succés');
          this.recordSelected.next(null);
        });
    });
  }

  removeRecord(key: string) {
    this.loadingService.isLoading = true;
    this.recordListRef.remove(key).then(() => {
      this.storageRef.child('/records/' + key + '.mp3').delete().then(() => {
        this.loadingService.isLoading = false;
        this.toastService.toast('Enregistrement supprimé avec succés');
        this.recordSelected.next(null);
      });
    });
  }

  selectRecord(record: Record) {
    this.loadingService.isLoading = true;
    this.storageRef.child('/records/' + record.key + '.mp3').getDownloadURL().then((url) => {
      record.fileUrl = url;
      this.recordSelected.next(record);
    });
  }

}

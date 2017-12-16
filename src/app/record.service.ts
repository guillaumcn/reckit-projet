import {Injectable} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {AngularFireDatabase, AngularFireList} from 'angularfire2/database';
import {Observable} from 'rxjs/Observable';
import {ToastService} from './toast.service';
import {Record} from './record.model';
import * as firebase from 'firebase';
import Reference = firebase.storage.Reference;
import {LoadingService} from './loading/loading.service';
import {AuthService} from './authentication/auth.service';
import {Router} from '@angular/router';
import UploadTaskSnapshot = firebase.storage.UploadTaskSnapshot;
import JSZip from 'jszip/dist/jszip.js';

@Injectable()
export class RecordService {

  // Chaque élément du tableau de Record[] est une ligne de Firebase
  recordListRef: AngularFireList<Record>;
  recordFirebaseObservable: Observable<Record[]>;
  storageRef: Reference;

  recordSelected: Subject<Record> = new Subject();

  temporaryFile: File = null;
  temporaryDuration = 0;

  selectOptions: string[] = ['Cours', 'Réunion', 'Conférence', 'Discours'];

  constructor(private db: AngularFireDatabase, private toastService: ToastService,
              private loadingService: LoadingService, private authService: AuthService,
              private router: Router) {
    this.recordListRef = this.db.list<Record>('/records');
    this.recordFirebaseObservable = this.recordListRef.snapshotChanges().map(actions => {
      return actions.map(action => {
        const data = action.payload.val() as Record;
        const key = action.payload.key;
        return {key, ...data};
      });
    });
    this.storageRef = firebase.storage().ref();
  }

  addRecord(name: string, oratorMail: string, duration: number, type: string, file: File, tags: string[]) {
    if (this.temporaryFile == null) {
      this.toastService.toast('Vous devez d\'abord enregistrer quelque chose');
    } else {
      this.loadingService.startLoading();

      this.recordListRef.push({
        name: name,
        recorder: this.authService.userDetails.displayName,
        recorderMail: this.authService.userDetails.email,
        oratorMail: oratorMail,
        duration: duration,
        type: type,
        tags: tags
      }).then((data) => {
        const zip = new JSZip();
        zip.file(name + '.mp3', this.temporaryFile);
        if (file != null) {
          zip.file(file.name, file);
        }
        zip.generateAsync({type: 'blob'}).then((content) => {
          const uploadTask = this.storageRef.child('/records/' + data.key + '.zip').put(content);
          this.uneditRecord();
          this.loadingService.stopLoading();
          this.loadingService.startUploading();
          uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, (snapshot: UploadTaskSnapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              this.loadingService.progressUploading(progress);
            },
            (error) => {
              // upload failed
              console.log(error);
            },
            () => {
              this.loadingService.stopUploading();
              this.toastService.toast('Enregistrement créé avec succès');
            });
        });
      });
    }
  }

  updateRecord(key: string, name: string, oratorMail: string, duration: number, type: string, file: File, tags: string[]) {
    this.loadingService.startLoading();
    this.recordListRef.update(key, {
      name: name,
      recorder: this.authService.userDetails.displayName,
      recorderMail: this.authService.userDetails.email,
      oratorMail: oratorMail,
      duration: duration,
      type: type,
      tags: tags
    }).then((data) => {
      const zip = new JSZip();
      zip.file(name + '.mp3', this.temporaryFile);
      if (file != null) {
        zip.file(file.name, file);
      }
      zip.generateAsync({type: 'blob'}).then((content) => {
        const uploadTask = this.storageRef.child('/records/' + key + '.zip').put(content);
        this.uneditRecord();
        this.loadingService.stopLoading();
        this.loadingService.startUploading();
        uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, (snapshot: UploadTaskSnapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            this.loadingService.progressUploading(progress);
          },
          (error) => {
            // upload failed
            console.log(error);
          },
          () => {
            this.loadingService.stopUploading();
            this.toastService.toast('Enregistrement modifié avec succès');
          });
      });
    });
  }

  removeRecord(key: string) {
    this.loadingService.startLoading();
    this.recordListRef.remove(key).then(() => {
      this.storageRef.child('/records/' + key + '.zip').delete().then(() => {
        this.loadingService.stopLoading();
        this.toastService.toast('Enregistrement supprimé avec succès');
        this.uneditRecord();
      });
    });
  }

  uneditRecord() {
    this.recordSelected.next(null);
    this.temporaryFile = null;
    this.temporaryDuration = 0;
  }

  editRecord(record: Record) {
    this.router.navigate(['/record-form']).then(() => {
      this.loadingService.startLoading();
      this.storageRef.child('/records/' + record.key + '.zip').getDownloadURL().then((url) => {
        record.fileUrl = url;
        this.recordSelected.next(record);
      });
    });
  }

  viewRecordDetails(record: Record) {
    this.router.navigate(['/record-detail']).then(() => {
      this.loadingService.startLoading();
      this.storageRef.child('/records/' + record.key + '.zip').getDownloadURL().then((url) => {
        record.fileUrl = url;
        this.recordSelected.next(record);
      });
    });
  }

}

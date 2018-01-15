import {Inject, Injectable} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {AngularFireDatabase, AngularFireList, AngularFireObject} from 'angularfire2/database';
import {Observable} from 'rxjs/Observable';
import {ToastService} from './toast.service';
import {Record} from './record.model';
import * as firebase from 'firebase';
import Reference = firebase.storage.Reference;
import {LoadingService} from './loading/loading.service';
import {AuthService} from './authentication/auth.service';
import {Router} from '@angular/router';
import UploadTaskSnapshot = firebase.storage.UploadTaskSnapshot;
import {HttpClient, HttpParams} from '@angular/common/http';
import {FirebaseObjectObservable} from 'angularfire2/database-deprecated';

@Injectable()
export class RecordService {

  // Chaque élément du tableau de Record[] est une ligne de Firebase
  recordListRef: AngularFireList<Record>;
  recordListFirebaseObservable: Observable<Record[]>;
  storageRef: Reference;

  recordRef: AngularFireObject<Record>;
  recordFirebaseObservable: Observable<Record>;

  recordSelected: Subject<Record> = new Subject();

  beforeUpdateFileNames = [];

  constructor(private db: AngularFireDatabase, private toastService: ToastService,
              private loadingService: LoadingService, private authService: AuthService,
              private router: Router,
              private http: HttpClient) {
    this.recordListRef = this.db.list('/records');
    this.recordListFirebaseObservable = this.recordListRef.snapshotChanges().map(actions => {
      return actions.map(action => {
        const data = action.payload.val() as Record;
        const key = action.payload.key;
        return {key, ...data};
      });
    });
    this.storageRef = firebase.storage().ref();
  }

  getRecord(recordKey: string) {
    this.recordRef = this.db.object('/records/' + recordKey);
    this.recordFirebaseObservable = this.recordRef.snapshotChanges().map(action => {
      const data = action.payload.val() as Record;
      const key = action.payload.key;
      return {key, ...data};
    });
  }

  validateRecord() {
    this.recordRef.update({validate: true});
  }

  addRecord(record: Record,
            files: File[]) {
    this.loadingService.startLoading();

    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let validationKey = '';

    for (let i = 0; i < 16; i++) {
      validationKey += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    this.recordListRef.push({
      name: record.name,
      recorder: this.authService.userDetails.displayName,
      recorderMail: this.authService.userDetails.email,
      oratorMail: record.oratorMail,
      duration: record.duration,
      type: record.type,
      tags: record.tags,
      annotations: record.annotations,
      filenames: record.filenames,
      validate: false,
      validationKey: validationKey
    }).then((data) => {

      const _baseUrl = window.location.origin + '/validation?key=' + data.key;

      this.http.get('https://www.guillaumelerda.com/inc/sendEmailReckit.php?' +
        'email=' + record.oratorMail +
        '&recorder=' + this.authService.userDetails.displayName +
        '&recordname=' + record.name +
        '&validationKey=' + validationKey +
        '&validationURL=' + _baseUrl)
        .subscribe();

      this.uneditRecord();
      this.loadingService.stopLoading();

      this.uploadFiles(data.key, files);
    });
  }

  updateRecord(record: Record,
               files: File[]) {
    this.loadingService.startLoading();

    this.recordListRef.update(record.key, {
      name: record.name,
      recorder: this.authService.userDetails.displayName,
      recorderMail: this.authService.userDetails.email,
      oratorMail: record.oratorMail,
      duration: record.duration,
      type: record.type,
      tags: record.tags,
      annotations: record.annotations,
      filenames: record.filenames,
      validate: record.validate,
      validationKey: record.validationKey
    }).then((data) => {

      this.loadingService.stopLoading();

      this.uploadFiles(record.key, files);

      this.removeFiles(record.key, Record.fileDiff(this.beforeUpdateFileNames, record.filenames));

      this.uneditRecord();
    });
  }

  removeRecord(record: Record) {
    this.loadingService.startLoading();

    this.recordListRef.remove(record.key).then(() => {
      this.removeFiles(record.key, record.filenames);
    });
  }

  uneditRecord() {
    this.recordSelected.next(null);
    this.beforeUpdateFileNames = [];
  }

  getAttachmentUrlPromise(recordKey: string, filename: string): Promise<any> {
    return this.storageRef.child('/records/' + recordKey + '/' + filename).getDownloadURL();
  }

  editRecord(record: Record) {
    this.router.navigate(['/record-form']).then(() => {
      this.loadingService.startLoading();
      this.recordSelected.next(record);
      this.beforeUpdateFileNames = record.filenames.slice();
    });
  }

  viewRecordDetails(record: Record) {
    this.router.navigate(['/record-detail']).then(() => {
      this.loadingService.startLoading();
      this.recordSelected.next(record);
    });
  }

  uploadFiles(recordKey, fileList: File[]) {
    this.uploadFile(recordKey, fileList, 0);
  }

  uploadFile(recordKey: string, fileList: File[], currentIndex: number) {
    if (currentIndex === fileList.length) {
      this.toastService.toast('Enregistrement créé avec succès');
      return;
    }

    this.loadingService.startUploading(fileList[currentIndex].name);
    const uploadTask = this.storageRef.child('/records/' + recordKey + '/' + fileList[currentIndex].name).put(fileList[currentIndex]);
    uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        this.loadingService.progressUploading(progress);
      },
      (error) => {
        // upload failed
        console.log(error);
        this.loadingService.stopUploading();
      },
      () => {
        this.loadingService.stopUploading();
        this.uploadFile(recordKey, fileList, currentIndex + 1);
      });
  }

  removeFiles(recordKey, filenames: string[]) {
    this.removeFile(recordKey, filenames, 0);
  }

  removeFile(recordKey: string, filenames: string[], currentIndex: number) {
    if (currentIndex === filenames.length) {
      this.uneditRecord();
      this.loadingService.stopLoading();
      return;
    }

    const filename = filenames[currentIndex];
    this.storageRef.child('/records/' + recordKey + '/' + filename).delete().then(() => {
      this.removeFile(recordKey, filenames, currentIndex + 1);
    });
  }

}

import {Injectable} from '@angular/core';
import {ToastService} from './toast.service';
import {Record} from './record.model';
import {Comment} from './comment.model';
import * as firebase from 'firebase';
import Reference = firebase.storage.Reference;
import {LoadingService} from './loading/loading.service';
import {AuthService} from './authentication/auth.service';
import {Router} from '@angular/router';
import UploadTaskSnapshot = firebase.storage.UploadTaskSnapshot;
import {HttpClient} from '@angular/common/http';
import {AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument} from 'angularfire2/firestore';
import {current} from 'codelyzer/util/syntaxKind';
import {Subject} from 'rxjs/Subject';

@Injectable()
export class RecordService {

  // Chaque élément du tableau de Record[] est une ligne de Firebase
  recordListRef: AngularFirestoreCollection<Record>;
  storageRef: Reference;

  recordRef: AngularFirestoreDocument<Record>;
  recordCommentsRef: AngularFirestoreCollection<Comment>;

  beforeUpdateFileNames = [];

  constructor(private afs: AngularFirestore, private toastService: ToastService,
              private loadingService: LoadingService, private authService: AuthService,
              private router: Router,
              private http: HttpClient) {
    this.storageRef = firebase.storage().ref();
    this.recordListRef = this.afs.collection('/records');
  }

  recordList(value: string, searchBy?: string, limit?: number, startAfter?: number) {
    return this.afs.collection('/records', ref =>
      ref
        .orderBy('searchRef.' + btoa(value))
        .where('searchRef.' + btoa(value), '>', 0)
        .limit(limit || Math.pow(10, 3))
        .startAfter(startAfter || 0))
      .snapshotChanges().map(actions => {
        const result = actions.map(action => {
          const data = action.payload.doc.data() as Record;
          const key = action.payload.doc.id;
          if (!searchBy || (searchBy && data[searchBy] && data[searchBy].indexOf(value) !== -1)) {
            return {key, ...data};
          }
        });
        for (let i = 0; i < result.length; i++) {
          if (result[i] === undefined) {
            result.splice(i, 1);
            i--;
          }
        }
        return result;
      });
  }

  recordByKey(recordKey: string) {
    this.recordRef = this.afs.doc('/records/' + recordKey);
    this.recordCommentsRef = this.recordRef.collection('comments');
    return this.createRecordObservable();
  }

  createRecordObservable() {
    return this.recordRef.snapshotChanges().map(action => {
      if (action.payload.exists) {
        const data = action.payload.data() as Record;
        const key = action.payload.id;
        return {key, ...data};
      } else {
        return null;
      }
    });
  }

  validateRecord(record: Record) {
    const searchRef = {};
    for (let i = 0; i < record.tags.length; i++) {
      searchRef[btoa(record.tags[i])] = 1 / Date.now();
    }
    searchRef[btoa(this.authService.userDetails.email)] = 1 / Date.now();
    searchRef[btoa(record.oratorMail)] = 1 / Date.now();

    this.recordListRef.doc(record.key).update({validate: true, searchRef: searchRef});
  }

  addRecord(record: Record,
            files: File[]) {
    this.loadingService.startLoading();

    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let validationKey = '';

    for (let i = 0; i < 16; i++) {
      validationKey += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    const searchRef = {};
    for (let i = 0; i < record.tags.length; i++) {
      searchRef[btoa(record.tags[i])] = 1 / Date.now();
    }
    searchRef[btoa(this.authService.userDetails.email)] = 1 / Date.now();
    searchRef[btoa(record.oratorMail)] = 1 / Date.now();

    this.recordListRef.add({
      name: record.name,
      recorder: this.authService.userDetails.displayName,
      recorderMail: this.authService.userDetails.email,
      oratorMail: record.oratorMail,
      duration: record.duration,
      type: record.type,
      tags: record.tags,
      annotations: record.annotations,
      filenames: record.filenames,
      lastUpdate: Date.now(),
      validate: true,
      validationKey: validationKey,
      searchRef: searchRef
    }).then((data) => {
      const _baseUrl = window.location.origin + '/validation?key=' + data.id;

      this.http.get('https://www.guillaumelerda.com/inc/sendEmailReckit.php?' +
        'email=' + record.oratorMail +
        '&recorder=' + this.authService.userDetails.displayName +
        '&recordname=' + record.name +
        '&validationKey=' + validationKey +
        '&validationURL=' + _baseUrl)
        .subscribe();

      this.uneditRecord();
      this.loadingService.stopLoading();

      this.uploadFiles(data.id, files);
    });
  }

  updateRecord(record: Record,
               files: File[]) {
    this.loadingService.startLoading();

    const searchRef = {};
    for (let i = 0; i < record.tags.length; i++) {
      searchRef[btoa(record.tags[i])] = 1 / Date.now();
    }
    searchRef[btoa(this.authService.userDetails.email)] = 1 / Date.now();
    searchRef[btoa(record.oratorMail)] = 1 / Date.now();

    this.recordListRef.doc(record.key).update({
      name: record.name,
      recorder: record.recorder,
      recorderMail: record.recorderMail,
      oratorMail: record.oratorMail,
      duration: record.duration,
      type: record.type,
      tags: record.tags,
      annotations: record.annotations,
      filenames: record.filenames,
      lastUpdate: Date.now(),
      validate: record.validate,
      validationKey: record.validationKey,
      searchRef: searchRef
    }).then((data) => {

      this.loadingService.stopLoading();

      this.uploadFiles(record.key, files);

      this.removeFiles(record.key, Record.fileDiff(this.beforeUpdateFileNames, record.filenames));

      this.uneditRecord();
    });
  }

  removeRecord(record: Record) {
    this.loadingService.startLoading();

    this.recordListRef.doc(record.key).collection('comments').snapshotChanges().map(actions => {
      actions.map(action => {
        const key = action.payload.doc.id;
        return key;
      });
    }).subscribe((comments) => {
      console.log(comments);
    });

    this.recordListRef.doc(record.key).delete().then(() => {
      this.removeFiles(record.key, record.filenames);
    });
  }

  uneditRecord() {
    this.beforeUpdateFileNames = [];

    this.router.navigate(['/record-form/new?refresh=' + Math.random()]);
  }

  getAttachmentUrlPromise(recordKey: string, filename: string): Promise<any> {
    return this.storageRef.child('/records/' + recordKey + '/' + filename).getDownloadURL();
  }

  editRecord(record: Record) {
    this.router.navigate(['/record-form', record.key]).then(() => {
      this.loadingService.startLoading();
      this.beforeUpdateFileNames = record.filenames.slice();
    });
  }

  viewRecordDetails(record: Record) {
    this.router.navigate(['/record-detail', record.key]).then(() => {
      this.loadingService.startLoading();
    });
  }

  viewTagDetails(tag: string) {
    this.router.navigate(['/tag-detail', tag]).then(() => {
      this.loadingService.startLoading();
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

  addQuestion(recordKey: string, question: string) {
    const comList = this.recordListRef.doc(recordKey).collection('comments');
    comList.add({
      textQuestion: question,
      date: Date.now(),
      questioner: this.authService.userDetails.displayName
    });
  }

}

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

  beforeUpdateFileNames = [];

  constructor(private afs: AngularFirestore, private toastService: ToastService,
              private loadingService: LoadingService, private authService: AuthService,
              private router: Router,
              private http: HttpClient) {
  }

  recordList(value: string, searchBy?: string, limit?: number, startAfter?: number) {
    return this.afs.collection('/records', ref =>
      ref
        .orderBy('searchRef.' + btoa(value), 'desc')
        .where('searchRef.' + btoa(value), '>', 0)
        .limit(limit || Math.pow(10, 3))
        .startAfter(startAfter || Number.MAX_SAFE_INTEGER))
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
    return this.afs.doc('/records/' + recordKey).snapshotChanges().map(action => {
      if (action.payload.exists) {
        const data = action.payload.data() as Record;
        const key = action.payload.id;
        return {key, ...data};
      } else {
        return null;
      }
    });
  }

  commentsList(recordKey: string, limit?: number, startAfter?: number) {
    return this.afs.doc('/records/' + recordKey).collection('comments', ref =>
      ref.orderBy('date', 'desc')
        .limit(limit || Math.pow(10, 3))
        .startAfter(startAfter || Number.MAX_SAFE_INTEGER))
      .snapshotChanges().map(actions => {
        return actions.map(action => {
          const data = action.payload.doc.data() as Comment;
          const key = action.payload.doc.id;
          return {key, ...data};
        });
      });
  }

  answersList(recordKey: string, commentKey: string, limit?: number, startAfter?: number) {
    return this.afs.doc('/records/' + recordKey).collection('comments').doc(commentKey).collection('answers', ref =>
      ref.orderBy('date', 'desc')
        .limit(limit || Math.pow(10, 3))
        .startAfter(startAfter || Number.MAX_SAFE_INTEGER))
      .valueChanges();
  }

  validateRecord(record: Record) {
    const currentDate = Date.now();

    const searchRef = {};
    for (let i = 0; i < record.tags.length; i++) {
      searchRef[btoa(record.tags[i])] = currentDate;
    }
    searchRef[btoa(this.authService.userDetails.email)] = currentDate;
    searchRef[btoa(record.oratorMail)] = currentDate;

    this.afs.collection('/records').doc(record.key).update({validate: true, searchRef: searchRef});
  }

  addRecord(record: Record,
            files: File[]) {
    this.loadingService.startLoading();

    record.recorderMail = this.authService.userDetails.email;
    record.recorder = this.authService.userDetails.displayName;

    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let validationKey = '';

    for (let i = 0; i < 16; i++) {
      validationKey += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    const currentDate = Date.now();

    const searchRef = {};
    for (let i = 0; i < record.tags.length; i++) {
      searchRef[btoa(record.tags[i])] = currentDate;
    }
    searchRef[btoa(record.recorderMail)] = currentDate;
    searchRef[btoa(record.oratorMail)] = currentDate;

    this.afs.collection('/records').add({
      name: record.name,
      recorder: record.recorder,
      recorderMail: record.recorderMail,
      oratorMail: record.oratorMail,
      duration: record.duration,
      type: record.type,
      tags: record.tags,
      annotations: record.annotations,
      filenames: record.filenames,
      lastUpdate: currentDate,
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

      this.updateSearchReferences(null, record);

      this.uploadFiles(data.id, files);

      this.loadingService.stopLoading();
    });
  }

  updateRecord(record: Record,
               files: File[]) {
    this.loadingService.startLoading();

    const currentDate = Date.now();

    const searchRef = {};
    for (let i = 0; i < record.tags.length; i++) {
      searchRef[btoa(record.tags[i])] = currentDate;
    }
    searchRef[btoa(this.authService.userDetails.email)] = currentDate;
    searchRef[btoa(record.oratorMail)] = currentDate;

    this.afs.collection('/records').doc(record.key).update({
      name: record.name,
      recorder: record.recorder,
      recorderMail: record.recorderMail,
      oratorMail: record.oratorMail,
      duration: record.duration,
      type: record.type,
      tags: record.tags,
      annotations: record.annotations,
      filenames: record.filenames,
      lastUpdate: currentDate,
      validate: record.validate,
      validationKey: record.validationKey,
      searchRef: searchRef
    }).then((data) => {

      this.uploadFiles(record.key, files);

      this.removeFiles(record.key, Record.fileDiff(this.beforeUpdateFileNames, record.filenames));

      this.updateSearchReferences(null, record);

      this.uneditRecord();

      this.loadingService.stopLoading();
    });
  }

  removeRecord(record: Record) {
    this.loadingService.startLoading();

    this.afs.collection('/records').doc(record.key).collection('comments').snapshotChanges().map(actions => {
      actions.map(action => {
        const key = action.payload.doc.id;
        return key;
      });
    }).subscribe((comments) => {
      console.log(comments);
    });

    this.afs.collection('/records').doc(record.key).delete().then(() => {
      this.removeFiles(record.key, record.filenames);
    });
  }

  uneditRecord() {
    this.beforeUpdateFileNames = [];

    this.router.navigate(['/record-form/new?refresh=' + Math.random()]);
  }

  getAttachmentUrlPromise(recordKey: string, filename: string): Promise<any> {
    return firebase.storage().ref().child('/records/' + recordKey + '/' + filename).getDownloadURL();
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
    const uploadTask = firebase.storage().ref().child('/records/' + recordKey + '/' + fileList[currentIndex].name).put(fileList[currentIndex]);
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
    firebase.storage().ref().child('/records/' + recordKey + '/' + filename).delete().then(() => {
      this.removeFile(recordKey, filenames, currentIndex + 1);
    });
  }

  addQuestion(record: Record, question: string) {
    const comList = this.afs.doc('/records/' + record.key).collection('comments');
    comList.add({
      textQuestion: question,
      date: Date.now(),
      questioner: this.authService.userDetails.displayName
    });
  }

  addAnswer(record: Record, commentKey: string, answer: string) {
    const answersList = this.afs.doc('/records/' + record.key).collection('comments').doc(commentKey).collection('answers');
    answersList.add({
      textAnswer: answer,
      date: Date.now(),
      answerer: this.authService.userDetails.displayName
    });

    this.searchAll('reckit.projet@gmail.com', (result) => {
      console.log(result);
    });
  }

  searchAll(value: string, callback, limit?: number) {
    this.afs.collection('/search')
      .ref.orderBy('value')
      .limit(limit || Math.pow(10, 3))
      .startAt(value)
      .endAt(value + '\uf8ff')
      .get().then((result) => {
      callback(result.docs.map((item) => {
        return item.data();
      }));
    });
  }

  updateSearchReferences(previousRecord: Record, newRecord: Record) {
    this.addSearchReference(newRecord.recorderMail, 'recorderMail');
    this.addSearchReference(newRecord.oratorMail, 'oratorMail');
    this.addSearchReference(newRecord.name, 'name');
    for (let i = 0; i < newRecord.tags.length; i++) {
      this.addSearchReference(newRecord.tags[i], 'tag');
    }
  }

  addSearchReference(reference: string, refType: string) {
    this.afs.collection('/search')
      .ref
      .where('value', '==', reference).get().then((result) => {
      if (result.docs.length === 0) {
        this.afs.collection('/search').add({value: reference, types: [refType]});
      } else {
        const currentTypes = result.docs[0].data().types;
        if (currentTypes.indexOf(refType) === -1) {
          currentTypes.push(refType);
          this.afs.collection('/search').doc(result.docs[0].id).update({types: currentTypes});
        }
      }
    });
  }

}

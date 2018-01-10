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
import {Http} from '@angular/http';

@Injectable()
export class RecordService {

  // Chaque élément du tableau de Record[] est une ligne de Firebase
  recordListRef: AngularFireList<Record>;
  recordFirebaseObservable: Observable<Record[]>;
  storageRef: Reference;

  recordSelected: Subject<Record> = new Subject();

  beforeUpdateFileNames = [];

  constructor(private db: AngularFireDatabase, private toastService: ToastService,
              private loadingService: LoadingService, private authService: AuthService,
              private router: Router,
              private http: Http) {
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

  addRecord(record: Record,
            files: File[]) {
    this.loadingService.startLoading();

    /* const headers = new Headers();
     headers.append('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
     this.http.post('https://www.guillaumelerda.com/inc/sendEmailReckit.php', 'email='+oratorMail+'&recorder='+this.authService.userDetails.displayName, headers).subscribe((response) => {alert(response); });*/

    this.recordListRef.push({
      name: record.name,
      recorder: this.authService.userDetails.displayName,
      recorderMail: this.authService.userDetails.email,
      oratorMail: record.oratorMail,
      duration: record.duration,
      type: record.type,
      tags: record.tags,
      annotations: record.annotations,
      filenames: record.filenames
    }).then((data) => {

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
      filenames: record.filenames
    }).then((data) => {

      this.loadingService.stopLoading();

      this.uploadFiles(record.key, files);

      this.removeFiles(record.key, this.arrayDiff(this.beforeUpdateFileNames, record.filenames));

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

  // array1 - array2
  arrayDiff(array1, array2) {
    const result = [];
    for (let i = 0; i < array1.length; i++) {
      if (array2.indexOf(array1[i]) === -1) {
        result.push(array1[i]);
      }
    }
    return result;
  }

}

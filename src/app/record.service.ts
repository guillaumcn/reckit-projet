import {Injectable} from '@angular/core';
import {ToastService} from './toast.service';
import {Record} from './record.model';
import {Comment} from './comment.model';
import * as firebase from 'firebase';
import {LoadingService} from './loading/loading.service';
import {AuthService} from './authentication/auth.service';
import {Router} from '@angular/router';
import UploadTaskSnapshot = firebase.storage.UploadTaskSnapshot;
import {HttpClient} from '@angular/common/http';
import {AngularFirestore} from 'angularfire2/firestore';
import ServerValue = firebase.database.ServerValue;

@Injectable()
export class RecordService {

  beforeUpdateFileNames = [];

  recordBeforeChanges = null;

  constructor(private afs: AngularFirestore, private toastService: ToastService,
              private loadingService: LoadingService, private authService: AuthService,
              private router: Router,
              private http: HttpClient) {
  }

  recordListObservable(value: string, searchBy?: string, limit?: number, startAfter?: number) {
    return this.afs.collection('/records', ref =>
      ref
        .orderBy('ref.' + btoa(value), 'desc')
        .where('ref.' + btoa(value), '>', new Date(0))
        .limit(limit || Math.pow(10, 3))
        .startAfter(startAfter || new Date(7258118400000)))
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

  recordList(value: string, searchBy?: string, limit?: number, startAfter?: number, callback?) {
    this.afs.collection('/records').ref
      .orderBy('ref.' + btoa(value), 'desc')
      .where('ref.' + btoa(value), '>', new Date(0))
      .limit(limit || Math.pow(10, 3))
      .startAfter(startAfter || new Date(7258118400000))
      .get().then((results) => {
      const records = results.docs.map((result) => {
        const data = result.data() as Record;
        const key = result.id;
        if (!searchBy || (searchBy && data[searchBy] && data[searchBy].indexOf(value) !== -1)) {
          return {key, ...data};
        }
      });
      for (let i = 0; i < records.length; i++) {
        if (records[i] === undefined) {
          records.splice(i, 1);
          i--;
        }
      }
      if (callback) {
        callback(records);
      }
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
        .startAfter(startAfter || new Date(7258118400000)))
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
        .startAfter(startAfter || new Date(7258118400000)))
      .valueChanges();
  }

  validateRecord(record: Record) {
    return new Promise((resolve, reject) => {
      const currentDate = firebase.firestore.FieldValue.serverTimestamp();

      const searchRef = {};
      for (let i = 0; i < record.tags.length; i++) {
        searchRef[btoa(record.tags[i])] = currentDate;
      }
      searchRef[btoa(this.authService.userDetails.email)] = currentDate;
      searchRef[btoa(record.oratorMail)] = currentDate;
      searchRef[btoa(record.name)] = currentDate;

      this.afs.collection('/records').doc(record.key).update({validate: true, ref: searchRef})
        .then(() => {
          resolve();
        }, () => {
          reject();
        });
    });
  }

  addRecord(record: Record,
            files: File[]) {
    return new Promise((resolve, reject) => {

      record.recorderMail = this.authService.userDetails.email;
      record.recorder = this.authService.userDetails.displayName;

      const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let validationKey = '';

      for (let i = 0; i < 16; i++) {
        validationKey += possible.charAt(Math.floor(Math.random() * possible.length));
      }

      const currentDate = firebase.firestore.FieldValue.serverTimestamp();

      const searchRef = {};
      for (let i = 0; i < record.tags.length; i++) {
        searchRef[btoa(record.tags[i])] = currentDate;
      }
      searchRef[btoa(record.recorderMail)] = currentDate;
      searchRef[btoa(record.oratorMail)] = currentDate;
      searchRef[btoa(record.name)] = currentDate;

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
        ref: searchRef
      }).then((data) => {
        const _baseUrl = window.location.origin + '/validation?key=' + data.id;

        this.http.get('https://www.guillaumelerda.com/inc/sendEmailReckit.php?' +
          'email=' + record.oratorMail +
          '&recorder=' + this.authService.userDetails.displayName +
          '&recordname=' + record.name +
          '&validationKey=' + validationKey +
          '&validationURL=' + _baseUrl)
          .subscribe();

        this.updateSearchReferences(null, record).then(() => {
          this.uploadFiles(data.id, files).then(() => {
            resolve();
          }, () => {
            reject();
          });
        }, () => {
          reject();
        });
      }, () => {
        reject();
      });
    });
  }

  updateRecord(record: Record,
               files: File[]) {
    return new Promise((resolve, reject) => {
      const currentDate = firebase.firestore.FieldValue.serverTimestamp();

      const searchRef = {};
      for (let i = 0; i < record.tags.length; i++) {
        searchRef[btoa(record.tags[i])] = currentDate;
      }
      searchRef[btoa(this.authService.userDetails.email)] = currentDate;
      searchRef[btoa(record.oratorMail)] = currentDate;
      searchRef[btoa(record.name)] = currentDate;

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
        ref: searchRef
      }).then((data) => {
        this.updateSearchReferences(this.recordBeforeChanges, record).then(() => {
          this.removeFiles(record.key, Record.fileDiff(this.beforeUpdateFileNames, record.filenames)).then(() => {
            this.uploadFiles(record.key, files).then(() => {
              resolve();
            }, () => {
              reject();
            });
          }, () => {
            reject();
          });
        }, () => {
          reject();
        });
      }, () => {
        reject();
      });
    });
  }

  removeRecord(record: Record) {
    return new Promise((resolve, reject) => {
      this.updateSearchReferences(record, null).then(() => {
        this.afs.collection('/records').doc(record.key).delete().then(() => {
          this.removeFiles(record.key, record.filenames).then(() => {
            this.afs.collection('/records').doc(record.key).collection('comments').ref.get().then((results) => {
              let nbFinish = 0;
              const total = results.docs.length;
              if (total === 0) {
                resolve();
              }
              for (let i = 0; i < results.docs.length; i++) {
                this.afs.collection('/records').doc(record.key).collection('comments').doc(results.docs[i].id).delete()
                  .then(() => {
                    nbFinish++;
                    if (nbFinish === total) {
                      resolve();
                    }
                  }, () => {
                    reject();
                  });
              }
            });
          }, () => {
            reject();
          });
        }, () => {
          reject();
        });
      }, () => {
        reject();
      });
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
    this.recordBeforeChanges = record;
    this.router.navigate(['/record-form', record.key]).then(() => {
      this.beforeUpdateFileNames = record.filenames.slice();
    });
  }

  viewRecordDetails(record: Record) {
    this.router.navigate(['/record-detail', record.key]);
  }

  viewTagDetails(tag: string) {
    this.router.navigate(['/tag-detail', tag]);
  }

  uploadFiles(recordKey, fileList: File[]) {
    return new Promise((resolve, reject) => {
      this.uploadFile(recordKey, fileList, 0, (result) => {
        if (result) {
          resolve();
        } else {
          reject();
        }
      });
    });
  }

  uploadFile(recordKey: string, fileList: File[], currentIndex: number, callback?) {
    if (currentIndex === fileList.length) {
      if (callback) {
        callback(true);
      }
      return;
    }

    this.loadingService.startUploading(fileList[currentIndex].name);
    const uploadTask = firebase.storage().ref().child('/records/' + recordKey + '/' + fileList[currentIndex].name).put(fileList[currentIndex]);
    uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        this.loadingService.progressUploading(progress);
      },
      (error) => {
        if (callback) {
          callback(false);
        }
        // upload failed
        this.loadingService.stopUploading();
      },
      () => {
        this.loadingService.stopUploading();
        this.uploadFile(recordKey, fileList, currentIndex + 1, callback);
      });
  }

  removeFiles(recordKey, filenames: string[]) {
    return new Promise((resolve, reject) => {
      this.removeFile(recordKey, filenames, 0, (result) => {
        console.log('je suis dans le callback');
        if (result) {
          resolve();
        } else {
          reject();
        }
      });
    });
  }

  removeFile(recordKey: string, filenames: string[], currentIndex: number, callback?) {
    if (currentIndex === filenames.length) {
      if (callback) {
        callback(true);
      }
      return;
    }

    const filename = filenames[currentIndex];
    firebase.storage().ref().child('/records/' + recordKey + '/' + filename).delete().then(() => {
      this.removeFile(recordKey, filenames, currentIndex + 1, callback);
    }, () => {
      if (callback) {
        callback(false);
      }
    });
  }

  addQuestion(record: Record, question: string) {
    const comList = this.afs.doc('/records/' + record.key).collection('comments');
    return comList.add({
      textQuestion: question,
      date: firebase.firestore.FieldValue.serverTimestamp(),
      questioner: this.authService.userDetails.displayName
    });
  }

  addAnswer(record: Record, commentKey: string, answer: string) {
    const answersList = this.afs.doc('/records/' + record.key).collection('comments').doc(commentKey).collection('answers');
    return answersList.add({
      textAnswer: answer,
      date: firebase.firestore.FieldValue.serverTimestamp(),
      answerer: this.authService.userDetails.displayName
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
    return new Promise((resolve, reject) => {
      this.removeSearchReferences(previousRecord).then(() => {
        this.addSearchReferences(newRecord).then(() => {
          resolve();
        }, () => {
          reject();
        });
      }, () => {
        reject();
      });
    });
  }

  addSearchReferences(record: Record) {
    return new Promise((resolve, reject) => {
      let nbFinish = 0;
      let total = 0;
      const promises = [];
      if (record) {
        total += 3 + record.tags.length;
        promises.push(this.addSearchReference(record.recorderMail));
        promises.push(this.addSearchReference(record.oratorMail));
        promises.push(this.addSearchReference(record.name));
        for (let i = 0; i < record.tags.length; i++) {
          promises.push(this.addSearchReference(record.tags[i]));
        }
      } else {
        resolve();
      }
      promises.map((promise) => {
        promise.then(() => {
          nbFinish++;
          if (nbFinish === total) {
            resolve();
          }
        }, () => {
          reject();
        });
      });
    });
  }

  removeSearchReferences(record: Record) {
    return new Promise((resolve, reject) => {
      let nbFinish = 0;
      let total = 0;
      const promises = [];
      if (record) {
        total += 3 + record.tags.length;
        promises.push(this.removeSearchReference(record.recorderMail));
        promises.push(this.removeSearchReference(record.oratorMail));
        promises.push(this.removeSearchReference(record.name));
        for (let i = 0; i < record.tags.length; i++) {
          promises.push(this.removeSearchReference(record.tags[i]));
        }
      } else {
        resolve();
      }
      promises.map((promise) => {
        promise.then(() => {
          nbFinish++;
          if (nbFinish === total) {
            resolve();
          }
        }, () => {
          reject();
        });
      });
    });
  }

  addSearchReference(reference: string) {
    return new Promise((resolve, reject) => {
      this.afs.collection('/search')
        .ref
        .where('value', '==', reference).get().then((result) => {
        if (result.docs.length === 0) {
          this.afs.collection('/search').add({value: reference})
            .then(() => {
              resolve();
            }, () => {
              reject();
            });
        } else {
          resolve();
        }
      });
    });
  }

  removeSearchReference(reference: string) {
    return new Promise((resolve, reject) => {
      this.afs.collection('/search')
        .ref
        .where('value', '==', reference).get().then((result) => {
        if (result.docs.length !== 0) {
          this.recordList(reference, null, 2, null, (results) => {
            if (results.length <= 1) {
              this.afs.collection('/search').doc(result.docs[0].id).delete().then(() => {
                resolve();
              }, () => {
                reject();
              });
            } else {
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
    });
  }

}

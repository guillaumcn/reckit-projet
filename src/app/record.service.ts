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
    value = value.toUpperCase();
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
          if (searchBy) {
            let resultValue = data[searchBy];
            if (resultValue && Array.isArray(resultValue)) {
              for (let i = 0; i < resultValue.length; i++) {
                resultValue[i] = resultValue[i].toUpperCase();
              }
            }
            if (resultValue && !Array.isArray(resultValue)) {
              resultValue = resultValue.toUpperCase();
            }
            if (resultValue && resultValue.indexOf(value) !== -1) {
              return {key, ...data};
            }
          } else {
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
    value = value.toUpperCase();
    this.afs.collection('/records').ref
      .orderBy('ref.' + btoa(value), 'desc')
      .where('ref.' + btoa(value), '>', new Date(0))
      .limit(limit || Math.pow(10, 3))
      .startAfter(startAfter || new Date(7258118400000))
      .get().then((results) => {
      const records = results.docs.map((result) => {
        const data = result.data() as Record;
        const key = result.id;
        if (searchBy) {
          let resultValue = data[searchBy];
          if (resultValue && Array.isArray(resultValue)) {
            for (let i = 0; i < resultValue.length; i++) {
              resultValue[i] = resultValue[i].toUpperCase();
            }
          }
          if (resultValue && !Array.isArray(resultValue)) {
            resultValue = resultValue.toUpperCase();
          }
          if (resultValue && resultValue.indexOf(value) !== -1) {
            return {key, ...data};
          }
        } else {
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
        searchRef[btoa(record.tags[i].toUpperCase())] = currentDate;
      }
      searchRef[btoa(record.recorder.toUpperCase())] = currentDate;
      searchRef[btoa(record.orator.toUpperCase())] = currentDate;
      searchRef[btoa(record.recorderMail.toUpperCase())] = currentDate;
      searchRef[btoa(record.oratorMail.toUpperCase())] = currentDate;
      searchRef[btoa(record.name.toUpperCase())] = currentDate;

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
        searchRef[btoa(record.tags[i].toUpperCase())] = currentDate;
      }
      searchRef[btoa(record.recorder.toUpperCase())] = currentDate;
      searchRef[btoa(record.orator.toUpperCase())] = currentDate;
      searchRef[btoa(record.recorderMail.toUpperCase())] = currentDate;
      searchRef[btoa(record.oratorMail.toUpperCase())] = currentDate;
      searchRef[btoa(record.name.toUpperCase())] = currentDate;

      this.afs.collection('/records').add({
        name: record.name,
        recorder: record.recorder,
        orator: record.orator,
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

        /*this.http.get('https://www.guillaumelerda.com/inc/sendEmailReckit.php?' +
          'email=' + record.oratorMail +
          '&recorder=' + this.authService.userDetails.displayName +
          '&recordname=' + record.name +
          '&validationKey=' + validationKey +
          '&validationURL=' + _baseUrl)
          .subscribe();*/

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
        searchRef[btoa(record.tags[i].toUpperCase())] = currentDate;
      }
      searchRef[btoa(record.recorder.toUpperCase())] = currentDate;
      searchRef[btoa(record.orator.toUpperCase())] = currentDate;
      searchRef[btoa(record.recorderMail.toUpperCase())] = currentDate;
      searchRef[btoa(record.oratorMail.toUpperCase())] = currentDate;
      searchRef[btoa(record.name.toUpperCase())] = currentDate;

      this.afs.collection('/records').doc(record.key).update({
        name: record.name,
        duration: record.duration,
        type: record.type,
        tags: record.tags,
        annotations: record.annotations,
        filenames: record.filenames,
        lastUpdate: currentDate,
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
      .startAt(value.toUpperCase())
      .endAt(value.toUpperCase() + '\uf8ff')
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
      if (record) {
        const references = [record.recorderMail, record.oratorMail, record.name, record.orator, record.recorder];
        for (let i = 0; i < record.tags.length; i++) {
          references.push(record.tags[i]);
        }
        this.addSearchReference(0, references, (result) => {
          if (result) {
            resolve();
          } else {
            reject();
          }
        });
      } else {
        resolve();
      }
    });
  }

  removeSearchReferences(record: Record) {
    return new Promise((resolve, reject) => {
      if (record) {
        const references = [record.recorderMail, record.oratorMail, record.name, record.orator, record.recorder];
        for (let i = 0; i < record.tags.length; i++) {
          references.push(record.tags[i]);
        }
        this.removeSearchReference(0, references, (result) => {
          if (result) {
            resolve();
          } else {
            reject();
          }
        });
      } else {
        resolve();
      }
    });
  }

  addSearchReference(currentIndex: number, references: string[], callback) {
    if (currentIndex === references.length) {
      callback(true);
      return;
    }

    this.afs.collection('/search')
      .ref
      .where('value', '==', references[currentIndex].toUpperCase()).get().then((result) => {
      if (result.docs.length === 0) {
        this.afs.collection('/search').add({value: references[currentIndex].toUpperCase()})
          .then(() => {
            this.addSearchReference(currentIndex + 1, references, callback);
          }, () => {
            callback(false);
          });
      } else {
        this.addSearchReference(currentIndex + 1, references, callback);
      }
    });
  }

  removeSearchReference(currentIndex: number, references: string[], callback) {
    if (currentIndex === references.length) {
      callback(true);
      return;
    }

    this.afs.collection('/search')
      .ref
      .where('value', '==', references[currentIndex].toUpperCase()).get().then((result) => {
      if (result.docs.length !== 0) {
        this.recordList(references[currentIndex].toUpperCase(), null, 2, null, (results) => {
          if (results.length <= 1) {
            this.afs.collection('/search').doc(result.docs[0].id).delete().then(() => {
              this.removeSearchReference(currentIndex + 1, references, callback);
            }, () => {
              callback(false);
            });
          } else {
            this.removeSearchReference(currentIndex + 1, references, callback);
          }
        });
      } else {
        this.removeSearchReference(currentIndex + 1, references, callback);
      }
    });
  }

}

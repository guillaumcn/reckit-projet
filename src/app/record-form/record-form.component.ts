import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {RecordService} from '../record.service';
import {NgForm} from '@angular/forms';
import {Record} from '../record.model';
import {UsersService} from '../users.service';
import {User} from '../user.model';
import {Subscription} from 'rxjs/Subscription';
import {LoadingService} from '../loading/loading.service';
import MicRecorder from 'mic-recorder-to-mp3/dist/index.min.js';
import WaveSurfer from 'wavesurfer.js/dist/wavesurfer.min.js';
import JSZip from 'jszip/dist/jszip.js';

@Component({
  selector: 'app-record-form',
  templateUrl: './record-form.component.html',
  styleUrls: ['./record-form.component.css']
})
export class RecordFormComponent implements OnInit, OnDestroy {

  @ViewChild('f') recordForm: NgForm;
  defaultType = 'Cours';
  selectedRecord: Record = null;

  subscriptions: Subscription[] = [];

  oratorList = {};

  tags: string[] = [];

  wavesurfer: WaveSurfer = null;
  recorder: MicRecorder = null;
  isRecording = false;
  interval = null;

  file: File = null;

  constructor(public recordService: RecordService, private usersService: UsersService, public loadingService: LoadingService) {

  }

  ngOnInit() {

    this.recorder = new MicRecorder({
      bitRate: 128
    });

    this.wavesurfer = WaveSurfer.create({
      container: '#waveform',
      waveColor: 'blue',
      progressColor: '#0000AA',
      height: 300
    });

    this.recordService.uneditRecord();

    this.subscriptions.push(
      this.recordService.recordSelected.subscribe(
        (record) => {
          this.selectedRecord = record;

          if (this.selectedRecord != null) {
            this.recordForm.form.patchValue({
              recordData: {
                name: this.selectedRecord.name,
                oratorMail: this.selectedRecord.oratorMail,
                type: this.selectedRecord.type
              }
            });

            if (this.selectedRecord.tags == null) {
              this.tags = [];
            } else {
              this.tags = this.selectedRecord.tags.slice();
            }

            fetch(record.fileUrl, {mode: 'cors'}).then((res) => res.blob()).then((blob) => {
              this.recordService.temporaryDuration = record.duration;
              const zip = new JSZip();
              zip.loadAsync(blob as File).then(() => {
                zip.file(record.name + '.mp3').async('blob').then((mp3Blob) => {
                  this.recordService.temporaryFile = mp3Blob as File;
                  this.wavesurfer.load(URL.createObjectURL(mp3Blob as File));
                  this.loadingService.stopLoading();
                });
              });
            });
          } else {
            this.recordForm.reset();
            this.tags = [];
            this.recordService.temporaryFile = null;
            this.recordService.temporaryDuration = 0;
            this.wavesurfer.load(null);
            this.file = null;
          }
        }
      ));

    this.subscriptions.push(
      this.usersService.usersQueryObservable.subscribe((searchResult) => {
        this.oratorList = {};
        for (let i = 0; i < searchResult.length; i++) {
          const u: User = searchResult[i];
          this.oratorList[u.email] = null;
        }
      }));

    this.recordService.temporaryFile = null;
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

  onCreate() {
    if (this.recordForm.valid) {
      this.recordService.addRecord(
        this.recordForm.value.recordData.name,
        this.recordForm.value.recordData.oratorMail,
        this.recordService.temporaryDuration,
        this.recordForm.value.recordData.type,
        this.file,
        this.tags
      );
    }
  }

  onUpdate() {
    if (this.recordForm.valid && this.selectedRecord != null) {
      this.recordService.updateRecord(
        this.selectedRecord.key,
        this.recordForm.value.recordData.name,
        this.recordForm.value.recordData.oratorMail,
        this.recordService.temporaryDuration,
        this.recordForm.value.recordData.type,
        this.file,
        this.tags
      );
    }
  }

  searchUsers($event) {
    this.usersService.query.next($event.target.value);
  }

  addTag(tagInput) {
    if (this.tags.indexOf(tagInput.value) === -1) {
      this.tags.push(tagInput.value);
      tagInput.value = '';
    }
  }

  deleteTag(index) {
    this.tags.splice(index, 1);
  }

  prettyPrintDuration(duration: number): string {
    let result = '';
    const hours = Math.floor(duration / (60 * 60));

    const divisor_for_minutes = duration % (60 * 60);
    const minutes = Math.floor(divisor_for_minutes / 60);

    const divisor_for_seconds = divisor_for_minutes % 60;
    const seconds = Math.ceil(divisor_for_seconds);

    if (hours < 10) {
      result += '0';
    }
    result += hours + ':';
    if (minutes < 10) {
      result += '0';
    }
    result += minutes + ':';
    if (seconds < 10) {
      result += '0';
    }
    result += seconds;

    return result;
  }

  getFile(event) {
    this.file = event.target.files[0];
  }

  startStopRecording() {
    if (!this.isRecording) {
      this.recorder.start().then(() => {
        this.recordService.temporaryDuration = 0;
        this.interval = setInterval(() => {
          this.recordService.temporaryDuration++;
        }, 1000);
        this.isRecording = true;
      }).catch((e) => {
        console.error(e);
      });
    } else {
      clearInterval(this.interval);
      this.recorder.stop().getMp3().then(([buffer, blob]) => {

        this.isRecording = false;

        const file = new File(buffer, Date.now() + '.mp3', {
          type: blob.type,
          lastModified: Date.now()
        });

        this.recordService.temporaryFile = file;
        this.wavesurfer.load(URL.createObjectURL(file));

      }).catch((e) => {
        alert('We could not retrieve your message');
        console.log(e);
      });
    }
  }

  playPause() {
    if (this.recordService.temporaryFile != null) {
      this.wavesurfer.playPause();
    }
  }
}

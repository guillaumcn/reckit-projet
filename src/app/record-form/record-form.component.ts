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

@Component({
  selector: 'app-record-form',
  templateUrl: './record-form.component.html',
  styleUrls: ['./record-form.component.css']
})
export class RecordFormComponent implements OnInit, OnDestroy {

  // Object representing the form
  @ViewChild('f') recordForm: NgForm;

  defaultType = 'Cours';

  // Selected record (change whenever a record is selected)
  selectedRecord: Record = null;

  // We will add subscriptions to observable here and unsubscribe when destroying the component
  subscriptions: Subscription[] = [];

  // Orator list (for the autocomplete of the orator input)
  oratorList = {};

  // List of tags
  tags: string[] = [];

  // Wave surfer and Microphone Objects from libraries
  wavesurfer: WaveSurfer = null;
  recorder: MicRecorder = null;

  // To know if we are recording or not
  isRecording = false;

  // Interval of 1 second to count record time
  interval = null;

  // Attachments files of the record
  files: File[] = [];

  constructor(public recordService: RecordService, private usersService: UsersService, public loadingService: LoadingService) {

    // Save current page (in case of reloading)
    localStorage.setItem('reloadPage', '/record-form');

    // Load selected record (from a previous reloading)
    if (localStorage.getItem('selectedRecord')) {
      this.selectedRecord = JSON.parse(localStorage.getItem('selectedRecord'));

      this.loadDataFromSelectedRecord();
    } else {
      // Reinitialize all values if no previous record selected
      this.recordService.uneditRecord();
    }

    this.subscriptions.push(
      // Subscribe to a selectedRecord event
      this.recordService.recordSelected.subscribe(
        (record) => {
          this.selectedRecord = record;

          // Save loaded record (in case of reloading)
          localStorage.setItem('selectedRecord', JSON.stringify(this.selectedRecord));

          // Patch all values with new record selected
          this.loadDataFromSelectedRecord();
        }
      ));

    this.subscriptions.push(
      // Subscribe to usersQueryObservable (for the autocomplete of the orator input)
      this.usersService.usersQueryObservable.subscribe((searchResult) => {
        this.oratorList = {};
        for (let i = 0; i < searchResult.length; i++) {
          const u: User = searchResult[i];
          this.oratorList[u.email] = null;
        }
      }));

  }

  ngOnInit() {

    // Initialize Recorder
    this.recorder = new MicRecorder({
      bitRate: 128
    });

    // Initialize WaveSurfer
    this.wavesurfer = WaveSurfer.create({
      container: '#waveform',
      waveColor: 'blue',
      progressColor: '#0000AA',
      height: 300,
      hideScrollbar: true
    });
  }

  loadDataFromSelectedRecord() {
    // If one record selected, patch all values (inputs patches with [ngModel] binding)
    if (this.selectedRecord != null) {

      // patch tags
      if (this.selectedRecord.tags == null) {
        this.tags = [];
      } else {
        this.tags = this.selectedRecord.tags.slice();
      }

      // get mp3 file with all files
      this.recordService.getAttachmentUrlPromise(this.selectedRecord.key, this.selectedRecord.name + '.mp3').then((url) => {
        fetch(url, {mode: 'cors'}).then((res) => res.blob()).then((blob) => {
          this.recordService.temporaryDuration = this.selectedRecord.duration;
          this.recordService.temporaryMP3 = blob as File;
          // .. Load it in the waveSurfer
          this.wavesurfer.load(URL.createObjectURL(blob));
          this.loadingService.stopLoading();
        });
      });

      // If no record selected, reset all values
    } else {
      this.recordForm.reset();
      this.tags = [];
      this.recordService.temporaryMP3 = null;
      this.recordService.temporaryDuration = 0;
      this.wavesurfer.load(null);
      this.files = [];
    }
  }

  ngOnDestroy() {
    // Unsubscribe all observables
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });

    // Remove all "current page" data
    localStorage.removeItem('reloadPage');
    localStorage.removeItem('selectedRecord');
  }

  onCreate() {
    console.log(this.files);
    if (this.recordForm.valid) {
      // Pass data to the record service
      this.recordService.addRecord(
        this.recordForm.value.recordData.name,
        this.recordForm.value.recordData.oratorMail,
        this.recordService.temporaryDuration,
        this.recordForm.value.recordData.type,
        this.files,
        this.tags
      );
    }
  }

  onUpdate() {
    if (this.recordForm.valid && this.selectedRecord != null) {
      // Pass data to the record service
      this.recordService.updateRecord(
        this.selectedRecord.key,
        this.recordForm.value.recordData.name,
        this.recordForm.value.recordData.oratorMail,
        this.recordService.temporaryDuration,
        this.recordForm.value.recordData.type,
        this.files,
        this.tags
      );
    }
  }

  searchUsers($event) {
    // Query the user service (for the autocomplete of the orator input)
    this.usersService.query.next($event.target.value);
  }

  // Update tag Array on button clicks (+ or -)

  addTag(tagInput) {
    if (this.tags.indexOf(tagInput.value) === -1) {
      this.tags.push(tagInput.value);
      tagInput.value = '';
    }
  }

  deleteTag(index) {
    this.tags.splice(index, 1);
  }

  // 00:05:36 from 336 seconds (for example)
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

  // Get files on input[type=file] change
  getFiles(event) {
    this.files = [];
    for (let i = 0; i < event.target.files.length; i++) {
      this.files.push(event.target.files[i]);
    }
  }

  // On record button click
  startStopRecording() {
    if (!this.isRecording) {
      // Start recording
      this.recorder.start().then(() => {
        this.recordService.temporaryDuration = 0;
        // Start duration count
        this.interval = setInterval(() => {
          this.recordService.temporaryDuration++;
        }, 1000);
        this.isRecording = true;
      }).catch((e) => {
        console.error(e);
      });
    } else {
      // Stop recording
      // Stop duration count
      clearInterval(this.interval);
      this.recorder.stop().getMp3().then(([buffer, blob]) => {

        this.isRecording = false;

        // Transform buffer to file
        const file = new File(buffer, Date.now() + '.mp3', {
          type: blob.type,
          lastModified: Date.now()
        });

        this.recordService.temporaryMP3 = file;

        // Load file in wavesurfer
        this.wavesurfer.load(URL.createObjectURL(file));

      }).catch((e) => {
        alert('We could not retrieve your message');
        console.log(e);
      });
    }
  }

  // On play/pause click
  playPause() {
    if (this.recordService.temporaryMP3 != null) {
      this.wavesurfer.playPause();
    }
  }
}

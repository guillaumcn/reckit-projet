import {
  Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild,
  ViewChildren
} from '@angular/core';
import {RecordService} from '../record.service';
import {NgForm} from '@angular/forms';
import {Record} from '../record.model';
import {UsersService} from '../users.service';
import {User} from '../user.model';
import {Subscription} from 'rxjs/Subscription';
import {LoadingService} from '../loading/loading.service';
import MicRecorder from 'mic-recorder-to-mp3/dist/index.min.js';
import WaveSurfer from 'wavesurfer.js/dist/wavesurfer.min.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-record-form',
  templateUrl: './record-form.component.html',
  styleUrls: ['./record-form.component.css']
})
export class RecordFormComponent implements OnInit, OnDestroy {

  // Object representing the form
  @ViewChild('f') recordForm: NgForm;

  // Selected record (change whenever a record is selected)
  selectedRecord: Record = new Record();

  // We will add subscriptions to observable here and unsubscribe when destroying the component
  subscriptions: Subscription[] = [];

  // Orator list (for the autocomplete of the orator input)
  oratorList = {};

  @ViewChildren('annotationText') annotationsText;
  isEditing: number[] = [];

  // Wave surfer and Microphone Objects from libraries
  wavesurfer: WaveSurfer = null;
  recorder: MicRecorder = null;
  // The file which is currently loaded by the waveSurfer
  temporaryMP3: File = null;

  // To know if we are recording or not
  isRecording = false;

  // Show / hide div to add annotation
  annotationsVisible = false;

  // Interval of 1 second to count record or playing time
  recordInterval = null;

  annotationInterval = null;
  // Current time of playing or recording
  annotationTime = 0;

  newfiles: File[] = [];

  selectOptions: string[] = ['Cours', 'Réunion', 'Conférence', 'Discours'];

  @ViewChild('waveform') waveform: ElementRef;
  waveformSize = 0;
  waveformLeft = 0;

  spaceActive = true;

  prettyPrintDuration = Record.prettyPrintDuration;
  objectKeys = Object.keys;


  constructor(public recordService: RecordService, private usersService: UsersService, public loadingService: LoadingService, private route: ActivatedRoute) {

    this.subscriptions.push(this.route.params.subscribe(params => {
      const recordKey = params['key'];

      this.subscriptions.push(this.recordService.recordByKey(recordKey).subscribe((record) => {
        this.selectedRecord = record;

        // Patch all values with new record selected
        this.loadDataFromSelectedRecord();
      }));
    }));

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
      hideScrollbar: true,
      plugins: [
        TimelinePlugin.create({
          container: '#timeline'
        }),
      ]
    });


    // On play, update annotation time if not recording
    this.wavesurfer.on('play', () => {
      if (!this.isRecording) {
        this.annotationInterval = setInterval(() => {
          this.waveformSize = this.waveform.nativeElement.offsetWidth;
          this.waveformLeft = this.waveform.nativeElement.offsetLeft;
          this.annotationTime = Math.floor(this.wavesurfer.getCurrentTime());
        }, 200);
      }
    });

    // Clear interval on pause and finish
    this.wavesurfer.on('pause', () => {
      clearInterval(this.annotationInterval);
    });

    this.wavesurfer.on('finish', () => {
      clearInterval(this.annotationInterval);
      this.annotationTime = 0;
    });

    // On seek, update annotation time if not recording
    this.wavesurfer.on('seek', () => {
      if (!this.isRecording) {
        this.waveformSize = this.waveform.nativeElement.offsetWidth;
        this.waveformLeft = this.waveform.nativeElement.offsetLeft;
        this.annotationTime = Math.floor(this.wavesurfer.getCurrentTime());
      }
    });
    this.waveformSize = this.waveform.nativeElement.offsetWidth;
    this.waveformLeft = this.waveform.nativeElement.offsetLeft;
  }

  loadDataFromSelectedRecord() {
    // If one record selected, patch all values (inputs patches with [ngModel] binding)
    if (this.selectedRecord != null) {

      // patch tags
      if (this.selectedRecord.tags == null) {
        this.selectedRecord.tags = [];
      }

      // patch annotations
      if (this.selectedRecord.annotations == null) {
        this.selectedRecord.annotations = [];
      }

      // patch filenames
      if (this.selectedRecord.filenames == null) {
        this.selectedRecord.filenames = [];
      }

      // get mp3 file...
      this.recordService.getAttachmentUrlPromise(this.selectedRecord.key, this.selectedRecord.name + '.mp3').then((url) => {
        fetch(url, {mode: 'cors'}).then((res) => res.blob()).then((blob) => {
          this.temporaryMP3 = blob as File;
          // .. Load it in the waveSurfer
          this.wavesurfer.load(URL.createObjectURL(blob));
          this.loadingService.stopLoading();
        });
      });

      // If no record selected, reset all values
    } else {
      this.selectedRecord = new Record();
      this.temporaryMP3 = null;
      this.wavesurfer.load(null);
      this.annotationTime = 0;
      this.newfiles = [];
    }
  }

  ngOnDestroy() {
    this.wavesurfer.pause();

    // Unsubscribe all observables
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });

    clearInterval(this.annotationInterval);
    clearInterval(this.recordInterval);
  }

  // Catched before this.selectedRecord.name is automatically changed
  nameChanged(newValue) {
    const indexMp3File = this.selectedRecord.filenames.indexOf(this.selectedRecord.name + '.mp3');
    if (indexMp3File !== -1) {
      this.selectedRecord.filenames[indexMp3File] = newValue + '.mp3';
    }
  }

  onCreate() {
    if (this.recordForm.valid && this.temporaryMP3) {
      // Change mp3 filename
      const blob = this.temporaryMP3.slice(0, -1, this.temporaryMP3.type);
      this.temporaryMP3 = new File([blob], this.selectedRecord.name + '.mp3', {type: blob.type});

      this.newfiles.push(this.temporaryMP3);

      // Pass data to the record service
      this.recordService.addRecord(
        this.selectedRecord,
        this.newfiles,
      );
    }
  }

  onUpdate() {
    if (this.recordForm.valid && this.selectedRecord != null) {
      // Change mp3 filename
      const blob = this.temporaryMP3.slice(0, -1, this.temporaryMP3.type);
      this.temporaryMP3 = new File([blob], this.selectedRecord.name + '.mp3', {type: blob.type});

      this.newfiles.push(this.temporaryMP3);

      // Pass data to the record service
      this.recordService.updateRecord(
        this.selectedRecord,
        this.newfiles,
      );
    }
  }

  searchUsers($event) {
    // Query the user service (for the autocomplete of the orator input)
    this.usersService.query.next($event.target.value);
  }

  // Update tag Array on button clicks (+ or -)

  addTag(tagInput) {
    this.selectedRecord.tags.push(tagInput.value);
    tagInput.value = '';
  }

  deleteTag(index) {
    this.selectedRecord.tags.splice(index, 1);
  }

  // Get files on input[type=file] change
  getFiles(event) {
    for (let i = 0; i < event.target.files.length; i++) {
      if (this.selectedRecord.filenames.indexOf(event.target.files[i].name) === -1) {
        this.newfiles.unshift(event.target.files[i]);
        this.selectedRecord.filenames.unshift(event.target.files[i].name);
      }
    }
  }

  deleteFilename(index) {
    this.selectedRecord.filenames.splice(index, 1);
    this.newfiles.splice(index, 1);
  }

  // On record button click
  startStopRecording() {
    if (!this.isRecording) {
      // Stop playing
      if (this.wavesurfer.isPlaying()) {
        this.playPause();
      }
      // Start recording
      this.recorder.start().then(() => {
        this.annotationTime = 0;
        // Start duration count
        this.recordInterval = setInterval(() => {
          this.annotationTime++;
        }, 1000);
        this.isRecording = true;
      }).catch((e) => {
        console.error(e);
      });
    } else {
      // Stop recording
      // Stop duration count
      clearInterval(this.recordInterval);
      this.recorder.stop().getMp3().then(([buffer, blob]) => {

        this.isRecording = false;

        // Transform buffer to file
        const file = new File(buffer, Date.now() + '.mp3', {
          type: blob.type,
          lastModified: Date.now()
        });

        this.temporaryMP3 = file;
        this.selectedRecord.duration = this.annotationTime;
        if (this.selectedRecord.filenames.indexOf(this.selectedRecord.name + '.mp3') === -1) {
          this.selectedRecord.filenames.unshift(this.selectedRecord.name + '.mp3');
        }

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
    if (!this.isRecording) {
      this.wavesurfer.playPause();
    }
  }

  @HostListener('window:keyup', ['$event'])
  playPauseSpace(event: KeyboardEvent) {
    if (!this.isRecording && this.spaceActive) {
      if (event.keyCode === 32) {
        this.wavesurfer.playPause();
      }
    }
  }

  // Show / Hide div to add an annotation
  showHide() {
    this.annotationsVisible = !this.annotationsVisible;
  }

  // Add annotation with current time to the array
  addAnnotation(note) {
    let noteExist = false;
    for (let i = 0; i < this.selectedRecord.annotations.length; i++) {
      if (this.selectedRecord.annotations[i].time === this.annotationTime) {
        this.selectedRecord.annotations[i] = {
          time: this.annotationTime,
          content: note.value
        };
        noteExist = true;
      }
    }
    if (!noteExist) {
      this.selectedRecord.annotations.unshift({
        time: this.annotationTime,
        content: note.value
      });
    }
  }

  // Remove annotation
  deleteAnnotation(index) {
    this.selectedRecord.annotations.splice(index, 1);
  }

  // Update annotation
  updateAnnotation(index) {
    this.selectedRecord.annotations[index].content = this.annotationsText._results[index].nativeElement.textContent;
    this.isEditing.splice(this.isEditing.indexOf(index), 1);
  }

  // Play wavesurfer on click on the annotation
  playAtTime(time) {
    this.wavesurfer.play(time);
  }

  // Display annotation 3 seconds
  showAnnotation(annotation: { time: number, content: string }) {
    if (!this.isRecording && this.temporaryMP3 && this.annotationTime >= annotation.time && this.annotationTime < annotation.time + 3) {
      return true;
    }
    return false;
  }

  // Get position of the annotation
  getAnnotationMarginLeft(annotation: { time: number, content: string }) {
    return this.waveformLeft +
      (this.waveformSize * (annotation.time / this.selectedRecord.duration));
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if (this.wavesurfer) {
      const wasPlaying = this.wavesurfer.isPlaying();
      const currentTime = this.wavesurfer.getCurrentTime();
      this.wavesurfer.empty();
      this.wavesurfer.drawBuffer();
      if (wasPlaying) {
        this.wavesurfer.play(currentTime);
      }
    }
    this.waveformSize = this.waveform.nativeElement.offsetWidth;
    this.waveformLeft = this.waveform.nativeElement.offsetLeft;
  }
}

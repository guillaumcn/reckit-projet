import {
  Component, HostListener, OnDestroy, OnInit, ViewChild,
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

  // List of annotation
  annotations: { time: number, content: string }[] = [];
  @ViewChildren('annotationText') annotationsText;
  isEditing: number[] = [];

  // Wave surfer and Microphone Objects from libraries
  wavesurfer: WaveSurfer = null;
  recorder: MicRecorder = null;

  // To know if we are recording or not
  isRecording = false;

  // Show / hide div to add annotation
  annotationsVisible = false;

  // Interval of 1 second to count record or playing time
  recordInterval = null;

  annotationInterval = null;
  // Current time of playing or recording
  annotationTime = 0;

  // Attachments files of the record
  filenames: string[] = [];
  newfiles: File[] = [];

  selectOptions: string[] = ['Cours', 'Réunion', 'Conférence', 'Discours'];


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
        this.annotationTime = Math.floor(this.wavesurfer.getCurrentTime());
      }
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

      // patch annotations
      if (this.selectedRecord.annotations == null) {
        this.annotations = [];
      } else {
        this.annotations = this.selectedRecord.annotations.slice();
      }

      // patch filenames
      if (this.selectedRecord.filenames == null) {
        this.filenames = [];
        this.recordService.previousFilenames = [];
      } else {
        this.filenames = this.selectedRecord.filenames.slice();
        this.recordService.previousFilenames = this.selectedRecord.filenames.slice();
        this.filenames.splice(this.filenames.indexOf(this.selectedRecord.name + '.mp3'), 1);
      }

      // get mp3 file...
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
      this.newfiles = [];
      this.annotations = [];
      this.filenames = [];
      localStorage.removeItem('selectedRecord');
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

    // Remove all "current page" data
    localStorage.removeItem('reloadPage');
    localStorage.removeItem('selectedRecord');
  }

  onCreate() {
    if (this.recordForm.valid) {
      // Pass data to the record service
      this.recordService.addRecord(
        this.recordForm.value.recordData.name,
        this.recordForm.value.recordData.oratorMail,
        this.recordService.temporaryDuration,
        this.recordForm.value.recordData.type,
        this.filenames,
        this.newfiles,
        this.tags,
        this.annotations
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
        this.filenames,
        this.newfiles,
        this.tags,
        this.annotations
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
      this.tags.unshift(tagInput.value);
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
    for (let i = 0; i < event.target.files.length; i++) {
      if (this.filenames.indexOf(event.target.files[i].name) === -1) {
        this.newfiles.unshift(event.target.files[i]);
        this.filenames.unshift(event.target.files[i].name);
      }
    }
  }

  deleteFilename(index) {
    this.filenames.splice(index, 1);
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
        this.recordService.temporaryDuration = 0;
        this.annotationTime = 0;
        // Start duration count
        this.recordInterval = setInterval(() => {
          this.recordService.temporaryDuration++;
          this.annotationTime = this.recordService.temporaryDuration;
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
    if (this.recordService.temporaryMP3 != null && !this.isRecording) {
      this.wavesurfer.playPause();
    }
  }

  @HostListener('window:keyup', ['$event'])
  playPauseSpace(event: KeyboardEvent) {
    if (this.recordService.temporaryMP3 != null && !this.isRecording) {
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
    for (let i = 0; i < this.annotations.length; i++) {
      if (this.annotations[i].time === this.annotationTime) {
        this.annotations[i] = {
          time : this.annotationTime,
          content : note.value
        };
        noteExist = true;
      }
    }
    if (!noteExist) {
      this.annotations.unshift({
        time : this.annotationTime,
        content : note.value
      });
    }
  }

  // Remove annotation
  deleteAnnotation(index) {
    this.annotations.splice(index, 1);
  }

  // Update annotation
  updateAnnotation(index) {
    this.annotations[index].content = this.annotationsText._results[index].nativeElement.textContent;
    this.isEditing.splice(this.isEditing.indexOf(index), 1);
  }

  // Play wavesurfer on click on the annotation
  playAtTime(time) {
    this.wavesurfer.play(time);
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
  }
}

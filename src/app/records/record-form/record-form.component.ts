import {Component, ElementRef, EventEmitter, OnInit, ViewChild} from '@angular/core';
import {RecordService} from '../record.service';
import {NgForm} from '@angular/forms';
import {Record} from '../record.model';
import WaveSurfer from 'wavesurfer.js/dist/wavesurfer.min.js';
import MicRecorder from 'mic-recorder-to-mp3/dist/index.min.js';
import {LoadingService} from '../../loading/loading.service';
import {MaterializeAction} from 'angular2-materialize';

@Component({
  selector: 'app-record-form',
  templateUrl: './record-form.component.html',
  styleUrls: ['./record-form.component.css']
})
export class RecordFormComponent implements OnInit {

  @ViewChild('f') recordForm: NgForm;
  defaultType = 'Cours';
  selectOptions: string[];
  selectedRecord: Record = null;
  currentDuration = 0;

  wavesurfer: WaveSurfer = null;
  recorder: MicRecorder = null;
  isRecording = false;
  currentTime = 0;
  interval = null;

  chipsPlaceholder = {
    placeholder: 'Enter your tags',
    secondaryPlaceholder: '+ Tag',
  };
  chipsActions = new EventEmitter<string | MaterializeAction>();
  chips: string[] = [];

  constructor(public recordService: RecordService, private loadingService: LoadingService) { }

  ngOnInit() {
    this.selectOptions = this.recordService.selectOptions;
    this.recordService.recordSelected.subscribe(
      (record) => {
        this.selectedRecord = record;
        if (record != null) {
          this.recordForm.form.patchValue({
            recordData: {
              name: record.name,
              recorder: record.recorder,
              orator: record.orator,
              type: record.type,
              recorderMail: record.recorderMail
            }
          });
          if (this.selectedRecord.tags == null) {
            this.chips = [];
          } else {
            this.chips = this.selectedRecord.tags.slice();
          }
          this.updateChips();
        } else {
          this.recordForm.reset();
          this.chips = [];
          this.updateChips();
        }
      }
    );

    // Wave surfer basique
    this.wavesurfer = WaveSurfer.create({
      container: '#waveform',
      waveColor: 'violet',
      progressColor: 'purple'
    });

    this.recorder = new MicRecorder({
      bitRate: 128
    });

    this.recordService.recordSelected.subscribe((record) => {
      if (record != null) {
        fetch(record.fileUrl, {mode: 'cors'}).then((res) => res.blob()).then((blob) => {
          this.recordService.temporaryFile = blob as File;
          this.currentDuration = record.duration;
          this.wavesurfer.load(URL.createObjectURL(this.recordService.temporaryFile));
          this.loadingService.isLoading = false;
        });
      } else {
        this.recordService.temporaryFile = null;
        this.currentDuration = 0;
        this.wavesurfer.load(null);
      }
    });

    this.recordService.temporaryFile = null;
  }

  onCreate() {
    if (this.recordForm.valid) {
      this.recordService.addRecord(
        this.recordForm.value.recordData.name,
        this.recordForm.value.recordData.orator,
        this.recordForm.value.recordData.duration,
        this.recordForm.value.recordData.type,
        this.chips
      );
    }
  }

  onUpdate() {
    if (this.recordForm.valid && this.selectedRecord != null) {
      this.recordService.updateRecord(
        this.selectedRecord.key,
        this.recordForm.value.recordData.name,
        this.recordForm.value.recordData.orator,
        this.recordForm.value.recordData.duration,
        this.recordForm.value.recordData.type,
        this.chips
      );
    }
  }

  playPause() {
    this.wavesurfer.playPause();
  }

  startStopRecording() {
    if (!this.isRecording) {
      this.recorder.start().then(() => {
        this.interval = setInterval(() => {
          this.currentTime++;
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

        this.currentDuration = this.currentTime;
        this.recordService.temporaryFile = file;
        this.wavesurfer.load(URL.createObjectURL(file));
        this.currentTime = 0;

      }).catch((e) => {
        alert('We could not retrieve your message');
        console.log(e);
      });
    }
  }

  add(chip) {
    this.chips.push(chip.tag);
  }

  delete(chip) {
    this.chips.splice(this.chips.indexOf(chip.tag), 1);
  }

  updateChips() {
    const newChipsData = {data: []};
    for (let i = 0; i < this.chips.length; i++) {
      const chip = this.chips[i];
      newChipsData.data.push({tag: chip});
    }
    this.chipsActions.emit({action: 'material_chip', params: [newChipsData]});
  }
}

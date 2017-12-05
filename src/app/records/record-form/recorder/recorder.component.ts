import { Component, OnInit } from '@angular/core';
import WaveSurfer from 'wavesurfer.js/dist/wavesurfer.min.js';
import MicRecorder from 'mic-recorder-to-mp3/dist/index.min.js';
import {RecordService} from '../../record.service';
import {LoadingService} from '../../../loading/loading.service';

@Component({
  selector: 'app-recorder',
  templateUrl: './recorder.component.html',
  styleUrls: ['./recorder.component.css']
})
export class RecorderComponent implements OnInit {

  wavesurfer: WaveSurfer = null;
  recorder: MicRecorder = null;
  isRecording = false;
  currentTime = 0;
  interval = null;

  constructor(public recordService: RecordService, private loadingService: LoadingService) { }

  ngOnInit() {
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
          this.recordService.temporaryDuration = record.duration;
          this.wavesurfer.load(URL.createObjectURL(this.recordService.temporaryFile));
          this.loadingService.isLoading = false;
        });
      } else {
        this.recordService.temporaryFile = null;
        this.recordService.temporaryDuration = 0;
        this.wavesurfer.load(null);
      }
    });

    this.recordService.temporaryFile = null;
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

        this.recordService.temporaryDuration = this.currentTime;
        this.recordService.temporaryFile = file;
        this.wavesurfer.load(URL.createObjectURL(file));
        this.currentTime = 0;

      }).catch((e) => {
        alert('We could not retrieve your message');
        console.log(e);
      });
    }
  }

}

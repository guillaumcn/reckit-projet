import {Component, ElementRef, HostListener, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {LoadingService} from '../loading/loading.service';
import {Record} from '../record.model';
import {RecordService} from '../record.service';
import WaveSurfer from 'wavesurfer.js/dist/wavesurfer.min.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js';
import {Subscription} from 'rxjs/Subscription';
import * as FileSaver from 'file-saver';
import PDFObject from 'pdfobject/pdfobject.min.js';

@Component({
  selector: 'app-record-detail',
  templateUrl: './record-detail.component.html',
  styleUrls: ['./record-detail.component.css']
})
export class RecordDetailComponent implements OnInit, OnDestroy {

  // Selected record (change whenever a record is selected)
  selectedRecord: Record = null;

  showPDF = false;

  // Wave surfer Object from libraries
  wavesurfer: WaveSurfer = null;
  @ViewChild('waveform') waveform: ElementRef;
  waveformSize = 0;
  waveformLeft = 0;

  // We will add subscriptions to observable here and unsubscribe when destroying the component
  subscriptions: Subscription[] = [];

  currentPlayingTime = 0;
  // Interval of 1 second to count playing time
  interval = null;

  prettyPrintDuration = Record.prettyPrintDuration;

  constructor(public recordService: RecordService, private loadingService: LoadingService) {
    // Save current page (in case of reloading)
    localStorage.setItem('reloadPage', '/record-detail');

    // Load selected record (from a previous reloading)
    if (localStorage.getItem('selectedRecord')) {
      this.selectedRecord = JSON.parse(localStorage.getItem('selectedRecord'));

      this.loadDataFromSelectedRecord();
    }

    this.subscriptions.push(
      // Subscribe to a selectedRecord event
      this.recordService.recordSelected.subscribe((record) => {
        this.selectedRecord = record;

        // Save loaded record (in case of reloading)
        localStorage.setItem('selectedRecord', JSON.stringify(this.selectedRecord));

        // Patch all values with new record selected
        this.loadDataFromSelectedRecord();
      }));
  }

  ngOnInit() {
    // Initialize WaveSurfer
    this.wavesurfer = WaveSurfer.create({
      container: '#waveform',
      waveColor: 'blue',
      progressColor: '#0000AA',
      height: 150,
      hideScrollbar: true,
      normalize: true,
      plugins: [
        TimelinePlugin.create({
          container: '#timeline'
        }),
        ]
    });

    this.wavesurfer.on('play', () => {
      // While playing, update current time and bounds values
      this.interval = setInterval(() => {
        this.waveformSize = this.waveform.nativeElement.offsetWidth;
        this.waveformLeft = this.waveform.nativeElement.offsetLeft;
        this.currentPlayingTime = Math.floor(this.wavesurfer.getCurrentTime());
      }, 200);
    });

    // Clear interval on pause and finish
    this.wavesurfer.on('pause', () => {
      clearInterval(this.interval);
    });

    this.wavesurfer.on('finish', () => {
      clearInterval(this.interval);
    });

    // On seek, update current time and bounds values
    this.wavesurfer.on('seek', () => {
      this.waveformSize = this.waveform.nativeElement.offsetWidth;
      this.waveformLeft = this.waveform.nativeElement.offsetLeft;
      this.currentPlayingTime = Math.floor(this.wavesurfer.getCurrentTime());
    });

    // update bounds values after create
    this.waveformSize = this.waveform.nativeElement.offsetWidth;
    this.waveformLeft = this.waveform.nativeElement.offsetLeft;

  }

  loadDataFromSelectedRecord() {

    // patch tags
    if (this.selectedRecord.tags == null) {
      this.selectedRecord.tags = [];
    }

    // patch annotations
    if (this.selectedRecord.annotations == null) {
      this.selectedRecord.annotations = [];
    }

    // get mp3 file ...
    this.recordService.getAttachmentUrlPromise(this.selectedRecord.key, this.selectedRecord.name + '.mp3').then((url) => {
      fetch(url, {mode: 'cors'}).then((res) => res.blob()).then((blob) => {
        // .. Load it in the waveSurfer
        this.wavesurfer.load(URL.createObjectURL(blob));
        this.loadingService.stopLoading();
      });
    });
  }

  ngOnDestroy() {
    this.wavesurfer.pause();

    // Unsubscribe all observables
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });

    // Remove all "current page" data
    localStorage.removeItem('reloadPage');
    localStorage.removeItem('selectedRecord');
  }

  // On click of download file button
  downloadAttachment(filename: string) {
    this.loadingService.startLoading();
    // Get concerned file...
    this.recordService.getAttachmentUrlPromise(this.selectedRecord.key, filename).then((url) => {
      fetch(url, {mode: 'cors'}).then((res) => res.blob()).then((blob) => {
        this.loadingService.stopLoading();
        // Download it
        FileSaver.saveAs(blob, filename);
      });
    });
  }

  downloadPDF(filename) {
    this.loadingService.startLoading();
    // Get concerned file...
    this.recordService.getAttachmentUrlPromise(this.selectedRecord.key, filename).then((url) => {
      fetch(url, {mode: 'cors'}).then((res) => res.blob()).then((blob) => {
        this.loadingService.stopLoading();
        // Add it to the PDF container
        PDFObject.embed(URL.createObjectURL(blob), '#pdfcontainer');
      });
    });
    // Show / hide pdf container
    this.showPDF = !this.showPDF;
  }

  // On play/pause click
  playPause() {
      this.wavesurfer.playPause();
  }

  @HostListener('window:keyup', ['$event'])
  playPauseSpace(event: KeyboardEvent) {
      if (event.keyCode === 32) {
        this.wavesurfer.playPause();
      }
  }

  // Display annotation 3 seconds
  showAnnotation(annotation: { time: number, content: string }) {
    if (this.currentPlayingTime >= annotation.time && this.currentPlayingTime < annotation.time + 3) {
      return true;
    }
  }

  // Get position of the annotation
  getAnnotationMarginLeft(annotation: { time: number, content: string }) {
    return this.waveformLeft +
      (this.waveformSize * (annotation.time / this.selectedRecord.duration));
  }

  // Update bounds value on window resize and resize the wavesurfer
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

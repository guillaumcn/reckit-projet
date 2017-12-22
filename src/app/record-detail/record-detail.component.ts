import {Component, OnDestroy, OnInit} from '@angular/core';
import {LoadingService} from '../loading/loading.service';
import {Record} from '../record.model';
import {RecordService} from '../record.service';
import WaveSurfer from 'wavesurfer.js/dist/wavesurfer.min.js';
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

  // List of tags
  tags: string[] = [];

  showPDF = false;

  // Wave surfer Object from libraries
  wavesurfer: WaveSurfer = null;

  // We will add subscriptions to observable here and unsubscribe when destroying the component
  subscriptions: Subscription[] = [];

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
      hideScrollbar: true
    });

  }

  loadDataFromSelectedRecord() {

    // patch tags
    this.tags = this.selectedRecord.tags.slice();

    // get mp3 file ...
    this.recordService.getAttachmentUrlPromise(this.selectedRecord.key, this.selectedRecord.name + '.mp3').then((url) => {
      fetch(url, {mode: 'cors'}).then((res) => res.blob()).then((blob) => {
        this.recordService.temporaryDuration = this.selectedRecord.duration;
        this.recordService.temporaryMP3 = blob as File;
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
    if (this.recordService.temporaryMP3 != null) {
      this.wavesurfer.playPause();
    }
  }

}

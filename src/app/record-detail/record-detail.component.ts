import {Component, OnDestroy, OnInit} from '@angular/core';
import {LoadingService} from '../loading/loading.service';
import {Record} from '../record.model';
import {RecordService} from '../record.service';
import WaveSurfer from 'wavesurfer.js/dist/wavesurfer.min.js';
import JSZip from 'jszip/dist/jszip.js';
import {Subscription} from 'rxjs/Subscription';
import * as FileSaver from 'file-saver';

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

  // Attachments files of the record
  files: File[] = [];

  // Wave surfer Object from libraries
  wavesurfer: WaveSurfer = null;

  // We will add subscriptions to observable here and unsubscribe when destroying the component
  subscriptions: Subscription[] = [];

  constructor(public recordService: RecordService, private loadingService: LoadingService) {
  }

  ngOnInit() {

    // Save current page (in case of reloading)
    localStorage.setItem('reloadPage', '/record-detail');

    // Load selected record (from a previous reloading)
    if (localStorage.getItem('selectedRecord')) {
      this.selectedRecord = JSON.parse(localStorage.getItem('selectedRecord'));

      this.loadDataFromSelectedRecord();
    }

    // Initialize WaveSurfer
    this.wavesurfer = WaveSurfer.create({
      container: '#waveform',
      waveColor: 'blue',
      progressColor: '#0000AA',
      height: 150,
      hideScrollbar: true
    });

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

  loadDataFromSelectedRecord() {

    // patch tags
    this.tags = this.selectedRecord.tags.slice();

    // get zip with all files
    fetch(this.selectedRecord.fileUrl, {mode: 'cors'}).then((res) => res.blob()).then((blob) => {
      this.recordService.temporaryMP3 = blob as File;
      this.recordService.temporaryDuration = this.selectedRecord.duration;
      const zip = new JSZip();
      zip.loadAsync(this.recordService.temporaryMP3).then(() => {
        // For each file in the zip...
        zip.forEach((relativePath) => {
          zip.file(relativePath).async('blob').then((fileblob) => {
            // Patch files array
            this.files.push(new File([fileblob], relativePath));
          });
        });
        // For the record file...
        zip.file(this.selectedRecord.name + '.mp3').async('blob').then((mp3Blob) => {
          // .. Load it in the waveSurfer
          this.wavesurfer.load(URL.createObjectURL(mp3Blob));
          this.loadingService.stopLoading();
        });
      });
    });
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
  downloadAttachment(index: number) {
    FileSaver.saveAs(this.files[index], this.files[index].name);
  }

  // On play/pause click
  playPause() {
    if (this.recordService.temporaryMP3 != null) {
      this.wavesurfer.playPause();
    }
  }

}

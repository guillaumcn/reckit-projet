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

  selectedRecord: Record = null;
  tags: string[] = [];
  files: File[] = [];

  wavesurfer: WaveSurfer = null;

  subscriptions: Subscription[] = [];

  constructor(public recordService: RecordService, private loadingService: LoadingService) {
  }

  ngOnInit() {

    this.wavesurfer = WaveSurfer.create({
      container: '#waveform',
      waveColor: 'blue',
      progressColor: '#0000AA',
      height: 150
    });

    this.subscriptions.push(this.recordService.recordSelected.subscribe((record) => {
      this.selectedRecord = record;

      if (this.selectedRecord.tags == null) {
        this.tags = [];
      } else {
        this.tags = this.selectedRecord.tags.slice();
      }

      fetch(record.fileUrl, {mode: 'cors'}).then((res) => res.blob()).then((blob) => {
        this.recordService.temporaryMP3 = blob as File;
        this.recordService.temporaryDuration = record.duration;
        const zip = new JSZip();
        zip.loadAsync(this.recordService.temporaryMP3).then(() => {
          zip.forEach((relativePath) => {
            zip.file(relativePath).async('blob').then((fileblob) => {
              this.files.push(new File([fileblob], relativePath));
            });
          });
          zip.file(record.name + '.mp3').async('blob').then((mp3Blob) => {
            this.wavesurfer.load(URL.createObjectURL(mp3Blob));
            this.loadingService.stopLoading();
          });
        });
      });
    }));
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
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

  downloadAttachment(index: number) {
    FileSaver.saveAs(this.files[index], this.files[index].name);
  }

}

import {Component, OnDestroy, OnInit} from '@angular/core';
import {RecordService} from '../record.service';
import {Record} from '../record.model';

@Component({
  selector: 'app-record-list',
  templateUrl: './record-list.component.html',
  styleUrls: ['./record-list.component.css']
})
export class RecordListComponent implements OnInit, OnDestroy {

  // List of records
  records: Record[] = [];

  constructor(private recordService: RecordService) {
  }

  ngOnInit() {
    // Save current page (in case of reloading)
    localStorage.setItem('reloadPage', '/record-list');

    // Subscribe to the list of records observable
    this.recordService.recordFirebaseObservable.subscribe(
      (records) => {
        this.records = records;
      }
    );
  }

  ngOnDestroy() {
    // Remove all "current page" data
    localStorage.removeItem('reloadPage');
  }

}

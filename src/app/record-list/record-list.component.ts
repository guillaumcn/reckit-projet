import {Component, OnDestroy, OnInit} from '@angular/core';
import {RecordService} from '../record.service';
import {Record} from '../record.model';

@Component({
  selector: 'app-record-list',
  templateUrl: './record-list.component.html',
  styleUrls: ['./record-list.component.css']
})
export class RecordListComponent implements OnInit {

  // List of records
  records: Record[] = [];

  constructor(private recordService: RecordService) {
  }

  ngOnInit() {

    // Subscribe to the list of records observable
    this.recordService.recordListFirebaseObservable.subscribe(
      (records) => {
        this.records = records;
      }
    );
  }

}

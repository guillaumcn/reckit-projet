import {Component, OnInit} from '@angular/core';
import {RecordService} from '../record.service';
import {Record} from '../record.model';

@Component({
  selector: 'app-record-list',
  templateUrl: './record-list.component.html',
  styleUrls: ['./record-list.component.css']
})
export class RecordListComponent implements OnInit {

  records: Record[] = [];

  constructor(private recordService: RecordService) {
  }

  ngOnInit() {
    this.recordService.fireBaseObservable.subscribe(
      (records) => {
        this.records = records;
      }
    );
  }

}

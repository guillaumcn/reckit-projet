import {Component, Input, OnInit} from '@angular/core';
import {RecordService} from '../../record.service';
import {Record} from '../../record.model';

@Component({
  selector: 'app-record-item',
  templateUrl: './record-item.component.html',
  styleUrls: ['./record-item.component.css']
})
export class RecordItemComponent implements OnInit {

  @Input() record: Record;

  constructor(private recordService: RecordService) {
  }

  ngOnInit() {
  }

  removeRecord() {
    this.recordService.removeRecord(this.record.key);
  }

  onSelect() {
    this.recordService.selectRecord(this.record);
  }

}

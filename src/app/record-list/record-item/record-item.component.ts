import {Component, Input, OnInit} from '@angular/core';
import {RecordService} from '../../record.service';
import {Record} from '../../record.model';

@Component({
  selector: 'app-record-item',
  templateUrl: './record-item.component.html',
  styleUrls: ['./record-item.component.css']
})
export class RecordItemComponent implements OnInit {

  // Record "inputted" from the record list component
  @Input() record: Record;

  prettyPrintDuration = Record.prettyPrintDuration;

  constructor(private recordService: RecordService) {
  }

  ngOnInit() {
  }

  // Transmit actions to the recordService
  removeRecord() {
    this.recordService.removeRecord(this.record);
  }

  onEdit() {
    if (this.record.validate) {
      this.recordService.editRecord(this.record);
    }
  }

  onRecordDetail() {
    if (this.record.validate) {
      this.recordService.viewRecordDetails(this.record);
    }
  }

}

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

  constructor(private recordService: RecordService) {
  }

  ngOnInit() {
  }

  // Transmit actions to the recordService
  removeRecord() {
    this.recordService.removeRecord(this.record);
  }

  onEdit() {
    this.recordService.editRecord(this.record);
  }

  onRecordDetail() {
    this.recordService.viewRecordDetails(this.record);
  }


  // 00:05:36 from 336 seconds (for example)
  prettyPrintDuration(duration: number) {
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

}

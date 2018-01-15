import {Component, OnInit} from '@angular/core';
import {RecordService} from '../record.service';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {Record} from '../record.model';

@Component({
  selector: 'app-validation',
  templateUrl: './validation.component.html',
  styleUrls: ['./validation.component.css']
})
export class ValidationComponent implements OnInit {

  timer: number;
  recordInterval = null;

  selectedRecord: Record = new Record();
  validationKey = '';

  prettyPrintDuration = Record.prettyPrintDuration;

  constructor(private recordService: RecordService, private route: ActivatedRoute, private router: Router) {

  }

  ngOnInit() {
    if (this.route.snapshot.queryParams['key']) {
      this.recordService.getRecord(this.route.snapshot.queryParams['key']);
      this.recordService.recordFirebaseObservable.subscribe((record) => {
        this.selectedRecord = record;
        this.timer = 0;
        // Start duration count
        this.recordInterval = setInterval(() => {
          this.timer++;
          if (record.validate && this.timer === 5) {
            this.router.navigate(['/record-form']);
          }
        }, 1000);
      });
    } else {
      this.router.navigate(['/record-form']);
    }
  }

  validateRecord() {
    if (this.validationKey === this.selectedRecord.validationKey) {
      this.recordService.validateRecord();
    }
  }
}

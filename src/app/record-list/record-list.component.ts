import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {RecordService} from '../record.service';
import {Record} from '../record.model';
import {LoadingService} from '../loading/loading.service';
import {Subscription} from 'rxjs/Subscription';
import {ActivatedRoute} from '@angular/router';
import {AuthService} from '../authentication/auth.service';

@Component({
  selector: 'app-record-list',
  templateUrl: './record-list.component.html',
  styleUrls: ['./record-list.component.css']
})
export class RecordListComponent implements OnInit, OnDestroy {

  @Input('searchBy') searchBy: string;
  @Input('searchValue') searchValue: string;
  @Input('limit') limit;

  currentDisplay: number;

  // List of records
  records: Record[] = [];

  // We will add subscriptions to observable here and unsubscribe when destroying the component
  subscriptions: Subscription[] = [];

  constructor(private recordService: RecordService, private loadingService: LoadingService) {
  }

  ngOnInit() {
    // Subscribe to the list of records observable
    this.subscriptions.push(this.recordService.recordList(this.searchValue, this.searchBy, parseInt(this.limit || 5, 10)).subscribe(
      (records) => {
        this.records = records;
        this.loadingService.stopLoading();
      }
    ));

    this.currentDisplay = this.limit || 5;
  }

  nextPage() {
    if (this.records.length == this.currentDisplay) {
      // Unsubscribe all observables
      this.subscriptions.forEach((subscription: Subscription) => {
        subscription.unsubscribe();
      });

      this.currentDisplay += (this.limit || 5);

      // Subscribe to the list of records observable
      this.subscriptions.push(this.recordService.recordList(this.searchValue, this.searchBy, parseInt(this.currentDisplay + '', 10)).subscribe(
        (records) => {
          this.records = records;
          this.loadingService.stopLoading();
        }
      ));
    }
  }

  ngOnDestroy() {
    // Unsubscribe all observables
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

}

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {RecordService} from '../record.service';
import {Record} from '../record.model';
import {LoadingService} from '../loading/loading.service';
import {Subscription} from 'rxjs/Subscription';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-record-list',
  templateUrl: './record-list.component.html',
  styleUrls: ['./record-list.component.css']
})
export class RecordListComponent implements OnInit, OnDestroy {

  // List of records
  records: Record[] = [];

  // We will add subscriptions to observable here and unsubscribe when destroying the component
  subscriptions: Subscription[] = [];

  constructor(private recordService: RecordService, private loadingService: LoadingService, private route: ActivatedRoute) {
  }

  ngOnInit() {
    // Subscribe to the list of records observable
    this.subscriptions.push(this.recordService.recordList().subscribe(
      (records) => {
        this.records = records;
        this.loadingService.stopLoading();
      }
    ));

    this.recordService.searchQuery('');

    this.subscriptions.push(this.route.params.subscribe(params => {
      if (params['tag']) {
        this.recordService.searchQuery(params['tag']);
      }
    }));
  }

  ngOnDestroy() {
    // Unsubscribe all observables
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

}

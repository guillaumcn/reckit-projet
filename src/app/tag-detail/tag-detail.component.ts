import {Component, OnDestroy, OnInit} from '@angular/core';
import {RecordService} from '../record.service';
import {ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';

@Component({
  selector: 'app-tag-detail',
  templateUrl: './tag-detail.component.html',
  styleUrls: ['./tag-detail.component.css']
})
export class TagDetailComponent implements OnInit, OnDestroy {

  selectedTag = '';

  // We will add subscriptions to observable here and unsubscribe when destroying the component
  subscriptions: Subscription[] = [];

  constructor(public recordService: RecordService, private route: ActivatedRoute) {


    this.subscriptions.push(this.route.params.subscribe(params => {
      this.selectedTag = params['tag'];
    }));
  }

  ngOnInit() {



  }

  ngOnDestroy() {
    // Unsubscribe all observables
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

}

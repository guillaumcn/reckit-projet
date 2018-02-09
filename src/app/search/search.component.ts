import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';
import {ActivatedRoute, Route, Router} from '@angular/router';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit, OnDestroy {

  searchValue = '';

  subscriptions: Subscription[] = [];

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.subscriptions.push(this.route.params.subscribe(params => {
      this.searchValue = params['value'];
    }));
  }

  ngOnDestroy() {
    // Unsubscribe all observables
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

}

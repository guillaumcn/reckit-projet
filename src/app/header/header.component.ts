import { Component, OnInit } from '@angular/core';
import { AuthService } from '../authentication/auth.service';
import { Router } from '@angular/router';
import {RecordService} from '../record.service';
import {Record} from '../record.model';
import {LoadingService} from '../loading/loading.service';
import {Subscription} from 'rxjs/Subscription';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  results = [];

  // We will add subscriptions to observable here and unsubscribe when destroying the component
  subscriptions: Subscription[] = [];

  constructor(public authService: AuthService, private recordService: RecordService) {
  }

  ngOnInit() {
    this.results.push('blabla');
    /*this.recordService.recordList().subscribe(
      (records) => {
        this.records = records;
        for (let i = 0; i < records.length; i++) {
          const r: Record = records[i];
          this.records[r.name] = null;
        }
      }
    );*/
  }

  deconnexion() {
    this.authService.logout();
  }

  search($event) {
    // Unsubscribe all observables
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });

    // Query the user service (for the autocomplete of the orator input)
      this.recordService.recordList($event.target.value, null, 5, null)
        .subscribe((records) => { console.log(records); });
  }
}

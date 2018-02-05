import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {User} from '../user.model';
import {Subscription} from 'rxjs/Subscription';
import {UsersService} from '../users.service';
import {AuthService} from '../authentication/auth.service';
import {Record} from '../record.model';
import {RecordService} from '../record.service';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css']
})
export class NewsComponent implements OnInit, OnDestroy {

  currentUser: User = new User();

  // We will add subscriptions to observable here and unsubscribe when destroying the component
  subscriptions: Subscription[] = [];

  // List of records
  records: Record[] = [];
  tempRecords: Record[] = [];
  displayedRecordKeys: string[] = [];
  interval = null;
  nbFinish = 0;

  currentDisplay: number;

  constructor(private userService: UsersService, private authService: AuthService, private recordService: RecordService) {
  }

  ngOnInit() {
    this.currentDisplay = 5;

    this.reload();
  }

  reload() {
    // Unsubscribe all observables
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });


    this.subscriptions.push(this.userService.getUserObservable(this.authService.userDetails.uid).subscribe((user: User) => {
        this.currentUser = user;
        this.records = [];
        this.tempRecords = [];
        this.displayedRecordKeys = [];
        this.nbFinish = 0;
        clearInterval(this.interval);

        if (!this.currentUser.followedTags) {
          this.currentUser.followedTags = [];
        }

        // When all records loaded, sort all and get only currentDisplay number
        this.interval = setInterval(() => {
          if (this.nbFinish === this.currentUser.followedTags.length) {
            // Unsubscribe all observables
            this.subscriptions.forEach((subscription: Subscription) => {
              subscription.unsubscribe();
            });

            this.tempRecords.sort((a, b) => {
              if (a.lastUpdate < b.lastUpdate) {
                return 1;
              }
              if (a.lastUpdate > b.lastUpdate) {
                return -1;
              }

              return 0;
            });
            this.tempRecords.splice(this.currentDisplay, this.tempRecords.length);
            this.records = this.tempRecords;
            clearInterval(this.interval);
          }
        }, 200);

        // Unsubscribe all observables
        this.subscriptions.forEach((subscription: Subscription) => {
          subscription.unsubscribe();
        });

        // For all followed tags
        for (let i = 0; i < this.currentUser.followedTags.length; i++) {
          // Subscribe to the list of records observable filtered by tag
          this.subscriptions.push(this.recordService.recordList(this.currentUser.followedTags[i], 'tags', this.currentDisplay).subscribe(
            (records) => {

              // For each received records
              for (let j = 0; j < records.length; j++) {
                if (this.displayedRecordKeys.indexOf(records[j].key) === -1) {
                  this.tempRecords.push(records[j]);
                  this.displayedRecordKeys.push(records[j].key);
                }
              }
              this.nbFinish++;
            }
          ));
        }
      })
    );
  }

  ngOnDestroy() {
    // Unsubscribe all observables
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

}

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

  displayedRecordKeys: string[] = [];

  currentDisplay: number;

  constructor(private userService: UsersService, private authService: AuthService, private recordService: RecordService) {
  }

  ngOnInit() {
    this.currentDisplay = 5;

    this.subscriptions.push(this.userService.getUserObservable(this.authService.userDetails.uid).subscribe((user: User) => {
        this.currentUser = user;

        if (!this.currentUser.followedTags) {
          this.currentUser.followedTags = [];
        }

        console.log(this.currentUser.followedTags);

        // Unsubscribe all observables
        this.subscriptions.forEach((subscription: Subscription) => {
          subscription.unsubscribe();
        });

        // For all foolowed tags
        for (let i = 0; i < this.currentUser.followedTags.length; i++) {

          // Subscribe to the list of records observable filtered by tag
          this.subscriptions.push(this.recordService.recordList(this.currentUser.followedTags[i], 'tags', this.currentDisplay).subscribe(
            (records) => {

              // For each received records
              for (let j = 0; j < records.length; j++) {

                console.log(records[j]);

                // If we have to display it
                if (this.records.length === 0
                  || this.records.length < this.currentDisplay
                  || records[j].lastUpdate > this.records[this.records.length - 1].lastUpdate) {

                  // If we are full remove the last
                  if (this.records.length + 1 > this.currentDisplay) {
                    this.records.splice(this.records.length - 1, 1);
                  }

                  // Find the position where to display
                  let recordPosition = 0;
                  for (let k = 1; k < this.records.length; k++) {
                    if (records[j].lastUpdate < this.records[k - 1].lastUpdate) {
                      recordPosition = k;
                      if (records[j].lastUpdate > this.records[k].lastUpdate) {
                        break;
                      }
                    }
                  }
                  console.log(recordPosition);

                  // Add the new record
                  this.records.splice(recordPosition, 0, records[j]);
                }

                console.log(this.records);
                debugger;
              }
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

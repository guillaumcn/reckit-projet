import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {User} from '../user.model';
import {Subscription} from 'rxjs/Subscription';
import {UsersService} from '../users.service';
import {AuthService} from '../authentication/auth.service';
import {Record} from '../record.model';
import {RecordService} from '../record.service';
import {LoadingService} from '../loading/loading.service';

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
  foundedRecordKeys: string[] = [];
  interval = null;
  nbFinish = 0;
  nbWaiting = 0;
  waitingKeys = [];

  isLoading = false;

  prettyPrintDuration = Record.prettyPrintDuration;

  constructor(private userService: UsersService, private authService: AuthService, private recordService: RecordService, private loadingService: LoadingService) {
  }

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.subscriptions.push(this.userService.getUserObservable(this.authService.userDetails.uid).subscribe((user: User) => {
        // Unsubscribe all observables
        this.subscriptions.forEach((subscription: Subscription) => {
          subscription.unsubscribe();
        });

        this.currentUser = user;
        this.records = [];
        this.tempRecords = [];
        this.foundedRecordKeys = [];
        this.nbFinish = 0;
        this.waitingKeys = [];
        this.nbWaiting = 0;
        clearInterval(this.interval);

        if (!this.currentUser.followedTags) {
          this.currentUser.followedTags = [];
        }

        // When all records loaded, sort all and get only currentDisplay number
        this.interval = setInterval(() => {
          if (this.nbFinish === this.currentUser.followedTags.length) {
            this.tempRecords.sort((a, b) => {
              if (a.lastUpdate < b.lastUpdate) {
                return 1;
              }
              if (a.lastUpdate > b.lastUpdate) {
                return -1;
              }

              return 0;
            });
            this.tempRecords.splice(10, this.tempRecords.length);
            for (let i = 0; i < this.tempRecords.length; i++) {
              this.records.push(this.tempRecords[i]);
            }
            this.tempRecords = [];
            this.foundedRecordKeys = [];

            // Unsubscribe all observables
            this.subscriptions.forEach((subscription: Subscription) => {
              subscription.unsubscribe();
            });

            // Waiting news count
            for (let i = 0; i < this.currentUser.followedTags.length; i++) {
              let firstInObservable = true;
              // Subscribe to the list of records observable filtered by tag
              this.subscriptions.push(this.recordService.recordListObservable(this.currentUser.followedTags[i], 'tags', 1).subscribe(
                (records) => {
                  if (!firstInObservable) {
                    if (this.waitingKeys.indexOf(records[0].key) === -1) {
                      this.waitingKeys.push(records[0].key);
                      this.nbWaiting++;
                    }
                  }
                  firstInObservable = false;
                }
              ));
            }

            this.loadingService.stopLoading();
            this.isLoading = false;
            this.nbFinish = 0;
          }
        }, 200);

        this.getNextModif();
      })
    );
  }

  getNextModif() {
    this.isLoading = true;
    if (this.records.length === 0) {
      this.loadingService.startLoading();
    }
    // For all followed tags
    for (let i = 0; i < this.currentUser.followedTags.length; i++) {
      // Subscribe to the list of records observable filtered by tag
      this.subscriptions.push(this.recordService.recordListObservable(this.currentUser.followedTags[i],
        'tags',
        10,
        this.records.length !== 0 ? (this.records[this.records.length - 1].lastUpdate) : Number.MAX_SAFE_INTEGER)
        .subscribe(
          (records) => {
            // For each received records
            for (let j = 0; j < records.length; j++) {
              if (this.foundedRecordKeys.indexOf(records[j].key) === -1) {
                this.tempRecords.push(records[j]);
                this.foundedRecordKeys.push(records[j].key);
              }
            }
            if (this.nbFinish !== this.currentUser.followedTags.length) {
              this.nbFinish++;
            }
          }
        ));
    }
  }

  unfollowTag(tag) {
    this.currentUser.followedTags.splice(this.currentUser.followedTags.indexOf(tag), 1);
    this.userService.updateUserFollowedTags(this.authService.userDetails.uid, this.currentUser.followedTags, () => {
      this.reload();
    });
  }

  ngOnDestroy() {
    // Unsubscribe all observables
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

  timestampToLocaleString(timestamp: number) {
    return new Date(timestamp).toLocaleString();
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(event) {
    const body = document.body;
    const html = document.documentElement;

    const height = Math.max( body.scrollHeight, body.offsetHeight,
      html.clientHeight, html.scrollHeight, html.offsetHeight );

    if (window.pageYOffset + window.innerHeight >= height - 10 && !this.isLoading) {
      this.getNextModif();
      console.log('aaa');
    }
  }
}

import {Component, OnDestroy, OnInit} from '@angular/core';
import {RecordService} from '../record.service';
import {ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';
import {UsersService} from '../users.service';
import {AuthService} from '../authentication/auth.service';
import {User} from '../user.model';

@Component({
  selector: 'app-tag-detail',
  templateUrl: './tag-detail.component.html',
  styleUrls: ['./tag-detail.component.css']
})
export class TagDetailComponent implements OnInit, OnDestroy {

  selectedTag = '';

  currentUser: User = new User();

  // We will add subscriptions to observable here and unsubscribe when destroying the component
  subscriptions: Subscription[] = [];

  constructor(public recordService: RecordService, private route: ActivatedRoute, private userService: UsersService, private authService: AuthService) {

    this.subscriptions.push(this.route.params.subscribe(params => {
      this.selectedTag = params['tag'];
    }));

    this.subscriptions.push(this.userService.getUserObservable(this.authService.userDetails.uid).subscribe((user: User) => {
        this.currentUser = user;

        if (!this.currentUser.followedTags) {
          this.currentUser.followedTags = [];
        }
      })
    );
  }

  followTag() {
    this.currentUser.followedTags.push(this.selectedTag);
    this.userService.updateUserFollowedTags(this.authService.userDetails.uid, this.currentUser.followedTags);
  }

  unfollowTag() {
    this.currentUser.followedTags.splice(this.currentUser.followedTags.indexOf(this.selectedTag), 1);
    this.userService.updateUserFollowedTags(this.authService.userDetails.uid, this.currentUser.followedTags);
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

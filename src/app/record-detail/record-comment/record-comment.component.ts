import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Record} from '../../record.model';
import {Comment} from '../../comment.model';
import {RecordService} from '../../record.service';
import {AuthService} from '../../authentication/auth.service';
import {Subscription} from 'rxjs/Subscription';

@Component({
  selector: 'app-record-comment',
  templateUrl: './record-comment.component.html',
  styleUrls: ['./record-comment.component.css']
})
export class RecordCommentComponent implements OnInit, OnDestroy {

  askaquestion = '';
  @Input('selectedRecord') selectedRecord: Record = new Record();

  comments: Comment[] = [];
  nbComments: number;

  @Output() spaceActive = new EventEmitter<boolean>();

  // We will add subscriptions to observable here and unsubscribe when destroying the component
  subscriptions: Subscription[] = [];

  constructor(private recordService: RecordService, private authService: AuthService) {
  }

  ngOnInit() {
    this.nbComments = 0;
    this.moreComments();
  }

  moreComments() {
    // Unsubscribe all observables
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });

    this.nbComments = this.nbComments + 5;

    this.subscriptions.push(this.recordService.commentsList(this.selectedRecord.key, this.nbComments).subscribe((comments) => {
      const moveAnswers = {};
      for (let i = 0; i < this.comments.length; i++) {
        if (this.comments[i]['answers']) {
          moveAnswers[this.comments[i].key] = {};
          moveAnswers[this.comments[i].key]['answers'] = this.comments[i]['answers'];
          moveAnswers[this.comments[i].key]['tempAnswer'] = this.comments[i]['tempAnswer'];
          moveAnswers[this.comments[i].key]['answerLimit'] = this.comments[i]['answerLimit'];
          moveAnswers[this.comments[i].key]['subscription'] = this.comments[i]['subscription'];
        }
      }

      this.comments = comments.reverse();

      for (let i = 0; i < this.comments.length; i++) {
        if (moveAnswers[this.comments[i].key]) {
          this.comments[i]['answers'] = moveAnswers[this.comments[i].key]['answers'];
          this.comments[i]['tempAnswer'] = moveAnswers[this.comments[i].key]['tempAnswer'];
          this.comments[i]['answerLimit'] = moveAnswers[this.comments[i].key]['answerLimit'];
          this.comments[i]['subscription'] = moveAnswers[this.comments[i].key]['subscription'];
        }
      }
    }));
  }

  getAnswers(index: number) {
    if (!this.comments[index]['answers']) {
      this.comments[index]['answers'] = [];
      this.comments[index]['tempAnswer'] = '';
      this.comments[index]['answerLimit'] = 0;
      this.moreAnswers(index);
    } else {
      delete this.comments[index]['answers'];
      delete this.comments[index]['tempAnswer'];
      this.comments[index]['subscription'].unsubscribe();
      delete this.comments[index]['subscription'];
    }
  }

  moreAnswers(index: number) {
    this.comments[index]['answerLimit'] += 5;
    if (this.comments[index]['subscription']) {
      this.comments[index]['subscription'].unsubscribe();
    }
    this.comments[index]['subscription'] = this.recordService.answersList(this.selectedRecord.key, this.comments[index].key, this.comments[index]['answerLimit']).subscribe((answers: { answerer: string, date: number, textAnswer: string }[]) => {
      this.comments[index]['answers'] = answers.reverse();
    });
  }

  addQuestion() {
    this.recordService.addQuestion(this.selectedRecord, this.askaquestion);
    this.askaquestion = '';
  }

  addReply(index: string) {
    this.recordService.addAnswer(this.selectedRecord, this.comments[index].key, this.comments[index]['tempAnswer']);
    this.comments[index]['tempAnswer'] = '';
  }

  focusInput() {
    this.spaceActive.emit(false);
  }

  blurInput() {
    this.spaceActive.emit(true);
  }

  timestampToLocaleString(timestamp) {
    return new Date(timestamp).toLocaleString();
  }

  ngOnDestroy() {
    // Unsubscribe all observables
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}

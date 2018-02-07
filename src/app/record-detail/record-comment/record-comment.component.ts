import {Component, Input, OnInit} from '@angular/core';
import {Record} from '../../record.model';
import {Comment} from '../../comment.model';
import {RecordService} from '../../record.service';
import {AuthService} from '../../authentication/auth.service';

@Component({
  selector: 'app-record-comment',
  templateUrl: './record-comment.component.html',
  styleUrls: ['./record-comment.component.css']
})
export class RecordCommentComponent implements OnInit {

  askaquestion = '';
  @Input('selectedRecord') selectedRecord: Record = new Record();

  comments: Comment[];

  constructor(private recordService: RecordService, private authService: AuthService) {
  }

  ngOnInit() {
    this.recordService.commentsList(this.selectedRecord.key, 10).subscribe((comments) => {
      this.comments = comments.reverse();
    });
  }

  getAnswers(index: string) {
	if (!this.comments[index]['answers']) {
		this.comments[index]['answers'] = [];
		this.comments[index]['tempAnswer'] = '';
		this.comments[index]['subscription'] = this.recordService.recordCommentsRef.doc(this.comments[index].key).collection('answers').valueChanges().subscribe((answers) => {
			this.comments[index]['answers'] = answers;
		});
	} else {
		delete this.comments[index]['answers'];
		delete this.comments[index]['tempAnswer'];
		this.comments[index]['subscription'].unsubscribe();
		delete this.comments[index]['subscription'];
	}
  }

  addQuestion() {
    this.recordService.addQuestion(this.selectedRecord.key, this.askaquestion);
    this.askaquestion = '';
  }

  sendReply(index: string) {
    this.recordService.recordCommentsRef.doc(this.comments[index].key).collection('answers').add({
      textAnswer: this.comments[index]['tempAnswer'],
      date: Date.now(),
      answerer: this.authService.userDetails.displayName
    });
    this.comments[index]['tempAnswer'] = '';
  }

  timestampToLocaleString(timestamp) {
    return new Date(timestamp).toLocaleString();
  }
}

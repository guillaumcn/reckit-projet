import {Component, Input, OnInit, ViewChild} from '@angular/core';
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
    this.recordService.recordCommentsRef.snapshotChanges().map(actions => {
      return actions.map(action => {
        const data = action.payload.doc.data() as Comment;
        const key = action.payload.doc.id;
        return {key, ...data};
      });
    }).subscribe((comments) => {
        this.comments = comments;
    });
  }

  getAnswers(index: string) {
    this.recordService.recordCommentsRef.doc(this.comments[index].key).collection('answers').valueChanges().subscribe((answers) => {
      if (!this.comments[index]['answers'])
        this.comments[index]['answers'] = [];

      if (!this.comments[index]['tempAnswer'])
        this.comments[index]['tempAnswer'] = '';

      this.comments[index]['answers'] = answers;
    });
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
  }

}

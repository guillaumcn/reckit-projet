import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {Record} from '../../record.model';
import {Comment} from '../../comment.model';
import {RecordService} from '../../record.service';

@Component({
  selector: 'app-record-comment',
  templateUrl: './record-comment.component.html',
  styleUrls: ['./record-comment.component.css']
})
export class RecordCommentComponent implements OnInit {

  askaquestion = '';
  @Input('selectedRecord') selectedRecord: Record = new Record();

  comments: Comment[];

  constructor(private recordService: RecordService) {
  }

  ngOnInit() {
    this.recordService.recordCommentsRef.valueChanges().subscribe((comments) => {
      this.comments = comments;
    });
  }

  addQuestion() {
    this.recordService.addQuestion(this.selectedRecord.key, this.askaquestion);
    this.askaquestion = '';
  }

}

import {Component, Input, OnInit} from '@angular/core';
import {Record} from '../../record.model';

@Component({
  selector: 'app-record-comment',
  templateUrl: './record-comment.component.html',
  styleUrls: ['./record-comment.component.css']
})
export class RecordCommentComponent implements OnInit {

  askaquestion = '';
  @Input('selectedRecord') selectedRecord: Record = new Record();

  constructor() {
  }

  ngOnInit() {
    console.log('dans le oninit putain ' + this.selectedRecord);
  }

  addQuestion(){

  }

}

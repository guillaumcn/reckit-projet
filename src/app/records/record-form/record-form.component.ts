import {Component, ElementRef, EventEmitter, OnInit, ViewChild} from '@angular/core';
import {RecordService} from '../record.service';
import {NgForm} from '@angular/forms';
import {Record} from '../record.model';
import {MaterializeAction} from 'angular2-materialize';
import {UsersService} from '../../users.service';
import {User} from '../../user.model';

@Component({
  selector: 'app-record-form',
  templateUrl: './record-form.component.html',
  styleUrls: ['./record-form.component.css']
})
export class RecordFormComponent implements OnInit {

  @ViewChild('f') recordForm: NgForm;
  defaultType = 'Cours';
  selectOptions: string[];
  selectedRecord: Record = null;

  oratorList = {};

  chipsActions = new EventEmitter<string | MaterializeAction>();
  chips: string[] = [];
  @ViewChild('chips') chipsDiv: ElementRef;

  constructor(public recordService: RecordService, private usersService: UsersService) {
    usersService.usersQueryObservable.subscribe((searchResult) => {
      this.oratorList = {};
      for (let i = 0; i < searchResult.length; i++) {
        const u: User = searchResult[i];
        this.oratorList[u.email] = null;
      }
    });
  }

  ngOnInit() {
    this.selectOptions = this.recordService.selectOptions;
    this.recordService.recordSelected.subscribe(
      (record) => {
        this.selectedRecord = record;
        if (record != null) {
          this.recordForm.form.patchValue({
            recordData: {
              name: record.name,
              recorder: record.recorder,
              oratorMail: record.oratorMail,
              type: record.type,
              recorderMail: record.recorderMail
            }
          });
          if (this.selectedRecord.tags == null) {
            this.chips = [];
          } else {
            this.chips = this.selectedRecord.tags.slice();
          }
          this.updateChips();
        } else {
          this.recordForm.reset();
          this.chips = [];
          this.updateChips();
        }
      }
    );
  }

  onCreate() {
    if (this.recordForm.valid) {
      this.recordService.addRecord(
        this.recordForm.value.recordData.name,
        this.recordForm.value.recordData.oratorMail,
        this.recordForm.value.recordData.duration,
        this.recordForm.value.recordData.type,
        this.chips
      );
    }
  }

  onUpdate() {
    if (this.recordForm.valid && this.selectedRecord != null) {
      this.recordService.updateRecord(
        this.selectedRecord.key,
        this.recordForm.value.recordData.name,
        this.recordForm.value.recordData.oratorMail,
        this.recordForm.value.recordData.duration,
        this.recordForm.value.recordData.type,
        this.chips
      );
    }
  }

  searchUsers($event) {
    this.usersService.query.next($event.target.value);
  }

  add(chip) {
    this.chips.push(chip.tag);
  }

  delete(chip) {
    this.chips.splice(this.chips.indexOf(chip.tag), 1);
  }

  updateChips() {
    const newChipsData = {data: []};
    for (let i = 0; i < this.chips.length; i++) {
      const chip = this.chips[i];
      newChipsData.data.push({tag: chip});
    }
    this.chipsActions.emit({action: 'material_chip', params: [newChipsData]});
  }
}

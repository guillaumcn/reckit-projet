import {Component, ElementRef, EventEmitter, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {RecordService} from '../record.service';
import {NgForm} from '@angular/forms';
import {Record} from '../record.model';
import {MaterializeAction} from 'angular2-materialize';
import {UsersService} from '../users.service';
import {User} from '../user.model';
import {Subscription} from 'rxjs/Subscription';
import {LoadingService} from '../loading/loading.service';

@Component({
  selector: 'app-record-form',
  templateUrl: './record-form.component.html',
  styleUrls: ['./record-form.component.css']
})
export class RecordFormComponent implements OnInit, OnDestroy {

  @ViewChild('f') recordForm: NgForm;
  defaultType = 'Cours';
  selectedRecord: Record = null;

  subscriptions: Subscription[] = [];

  oratorList = {};

  chipsActions = new EventEmitter<string | MaterializeAction>();
  chips: string[] = [];
  @ViewChild('chips') chipsDiv: ElementRef;

  constructor(public recordService: RecordService, private usersService: UsersService, public loadingService: LoadingService) {

  }

  ngOnInit() {

    this.recordService.unselectRecord();

    this.subscriptions.push(
      this.recordService.recordSelected.subscribe(
        (record) => {
          this.selectedRecord = record;

          if (this.selectedRecord != null) {
            this.recordForm.form.patchValue({
              recordData: {
                name: this.selectedRecord.name,
                oratorMail: this.selectedRecord.oratorMail,
                type: this.selectedRecord.type
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
      ));

    this.subscriptions.push(
      this.usersService.usersQueryObservable.subscribe((searchResult) => {
        this.oratorList = {};
        for (let i = 0; i < searchResult.length; i++) {
          const u: User = searchResult[i];
          this.oratorList[u.email] = null;
        }
      }));
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
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

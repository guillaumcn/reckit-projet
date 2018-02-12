import { Component, OnInit } from '@angular/core';
import { AuthService } from '../authentication/auth.service';
import { Router } from '@angular/router';
import {RecordService} from '../record.service';
import {Record} from '../record.model';
import {LoadingService} from '../loading/loading.service';
import {Subscription} from 'rxjs/Subscription';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  results = [];

  constructor(public authService: AuthService, private recordService: RecordService) {
  }

  ngOnInit() {

  }

  deconnexion() {
    this.authService.logout();
  }

  search($event) {
    this.results = [];
    this.recordService.searchAll($event.target.value, (results) => {
      this.results = results;
    }, 5);
  }
}

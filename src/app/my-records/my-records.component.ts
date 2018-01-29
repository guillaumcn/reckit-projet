import { Component, OnInit } from '@angular/core';
import {AuthService} from '../authentication/auth.service';

@Component({
  selector: 'app-my-records',
  templateUrl: './my-records.component.html',
  styleUrls: ['./my-records.component.css']
})
export class MyRecordsComponent implements OnInit {

  constructor(public authService: AuthService) { }

  ngOnInit() {
  }

}

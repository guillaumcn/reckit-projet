import { Component, OnInit } from '@angular/core';
import { AuthService } from '../authentication/auth.service';
import { Router } from '@angular/router';
import {RecordService} from '../record.service';
import {Record} from '../record.model';
import {LoadingService} from '../loading/loading.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  // List of records
  records: Record[] = [];

  constructor(public authService: AuthService, private loadingService: LoadingService, private router: Router, private recordService: RecordService) {
  }

  ngOnInit() {
    /*this.recordService.recordList().subscribe(
      (records) => {
        this.records = records;
        for (let i = 0; i < records.length; i++) {
          const r: Record = records[i];
          this.records[r.name] = null;
        }
      }
    );*/
  }

  deconnexion() {
    this.authService.logout();
  }

  searchTags($event) {
    // Query the user service (for the autocomplete of the orator input)
      //this.recordService.searchQuery($event.target.value);
  }
}

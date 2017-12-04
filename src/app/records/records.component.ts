import { Component, OnInit } from '@angular/core';
import { AuthService } from '../authentication/auth.service';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';

@Component({
  selector: 'app-records',
  templateUrl: './records.component.html',
  styleUrls: ['./records.component.css']
})
export class RecordsComponent implements OnInit {

  constructor(private authService: AuthService, private firebaseAuth: AngularFireAuth) { 
    firebaseAuth.authState.subscribe(
      (user) => {
        if (user) {
          console.log("Utilisateur : " + user.displayName);
        }
      });
  }

  ngOnInit() {
    
  }

}

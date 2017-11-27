import { Component, EventEmitter, OnInit } from '@angular/core';
import { AuthService } from '../authentication/auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../toast.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  sidenavActions = new EventEmitter<any>();
  sidenavParams = [];

  constructor(public authService: AuthService, private router: Router, private toastService: ToastService) { }

  ngOnInit() {

  }

  showSideNav() {
    this.sidenavParams = ['show'];
    this.sidenavActions.emit('sideNav');
  }

  deconnexion() {
    this.authService.logout();
  }
}

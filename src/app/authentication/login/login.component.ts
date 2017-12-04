import { NgForm } from '@angular/forms';
import {Component, OnInit} from '@angular/core';
import {AuthService} from '../auth.service';
import {Router} from '@angular/router';
import {LoadingService} from '../../loading/loading.service';
import { ViewChild } from '@angular/core';
import { ToastService } from '../../toast.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {

  @ViewChild('loginForm') loginForm: NgForm;

  constructor(private authService: AuthService,
              private router: Router,
              private loadingService: LoadingService) {
  }

  ngOnInit() {

  }

  connexion() {
    if (this.loginForm.valid) {
      this.loadingService.isLoading = true;
      this.authService.signInWithEmailPassword(this.loginForm.value.email, this.loginForm.value.password);
      this.loginForm.reset();
    }
  }

  connexionGoogle() {
    this.loadingService.isLoading = true;
    this.authService.signInWithGoogle();
    this.loginForm.reset();
  }
d
}

import {Component, OnInit} from '@angular/core';
import {AuthService} from '../auth.service';
import {Router} from '@angular/router';
import {LoadingService} from '../../loading/loading.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {

  // créé sur Firebase
  emailTyped = '';
  passwordTyped = '';

  constructor(private authService: AuthService,
              private router: Router,
              private loadingService: LoadingService) {
  }

  ngOnInit() {

  }

  connexion() {
    this.loadingService.isLoading = true;
    this.authService.login(this.emailTyped, this.passwordTyped);
  }

  connexionGoogle() {
    this.loadingService.isLoading = true;
    this.authService.signInWithGoogle();
  }
}

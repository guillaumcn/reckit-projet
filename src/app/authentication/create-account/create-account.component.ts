import { Component, OnInit } from '@angular/core';
import {AuthService} from '../auth.service';
import {LoadingService} from '../../loading/loading.service';


@Component({
  selector: 'app-create-account',
  templateUrl: './create-account.component.html',
  styleUrls: ['./create-account.component.css']
})
export class CreateAccountComponent implements OnInit {

  emailTyped: string;
  passwordTyped: string;
  pass2Typed: string;

  constructor(private authService: AuthService,
    private loadingService: LoadingService) {
  }

  ngOnInit() {
  }

  createAccount() {
      this.loadingService.isLoading = true;
      this.authService.signup(this.emailTyped, this.passwordTyped, this.pass2Typed);
  }

}

import { Component, OnInit, ViewChild } from '@angular/core';
import {AuthService} from '../auth.service';
import {LoadingService} from '../../loading/loading.service';
import { NgForm } from '@angular/forms';


@Component({
  selector: 'app-create-account',
  templateUrl: './create-account.component.html',
  styleUrls: ['./create-account.component.css']
})
export class CreateAccountComponent implements OnInit {

  @ViewChild('signinForm') signinForm: NgForm;

  constructor(private authService: AuthService,
    private loadingService: LoadingService) {
  }

  ngOnInit() {
  }

  createAccount() {
    if (this.signinForm.valid) {
      this.loadingService.startLoading();
      this.authService.signup(this.signinForm.value.lastName,
        this.signinForm.value.firstName,
        this.signinForm.value.email,
        this.signinForm.value.password,
        this.signinForm.value.pass2);
      this.signinForm.reset();
    }
  }

}

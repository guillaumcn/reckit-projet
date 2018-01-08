import {Component, OnInit, ViewChild} from '@angular/core';
import {NgForm} from '@angular/forms';
import {AuthService} from '../auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {

  @ViewChild('resetPasswordForm') resetPasswordForm: NgForm;

  resetPassword = false;

  constructor(private authService: AuthService) {
  }

  ngOnInit() {

  }

  sendResetEmail() {
    this.authService.resetPassword(this.resetPasswordForm.value.email);
    this.resetPassword = true;
  }
}

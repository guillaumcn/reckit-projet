import { Injectable } from '@angular/core';

import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

import { Observable } from 'rxjs/Observable';
import { Router } from '@angular/router';
import { LoadingService } from '../loading/loading.service';
import { ToastService } from '../toast.service';
import { Location } from '@angular/common';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class AuthService {
  userDetails: firebase.User = null;

  constructor(private firebaseAuth: AngularFireAuth, private router: Router,
    private loadingService: LoadingService, private toastService: ToastService) {

    firebaseAuth.authState.subscribe(
      (user) => {
        if (user) {
          // If user.providerData[0]['providerId'] !== 'password', no need to verify email
          if (user.providerData[0]['providerId'] !== 'password' || user.emailVerified) {
            this.userDetails = user;
            if (user.displayName != null) {
              this.toastService.toast('Connecté en tant que ' + user.displayName);
            } else {
              this.toastService.toast('Connecté en tant que ' + user.email);
            }
            this.router.navigate(['/records']);
          } else {
            this.logout();
            this.toastService.toast('Merci de valider votre adresse mail');
          }
        }
      }
    );
  }

  signup(lastName: string, firstName: string, email: string, password: string, pass2: string) {
    if (password === pass2) {
      this.firebaseAuth
        .auth
        .createUserWithEmailAndPassword(email, password)
        .then(user => {
          user.updateProfile({
            displayName: firstName + ' ' + lastName,
          });
          this.loadingService.isLoading = false;
          user.sendEmailVerification();
          this.toastService.toast('Compte ' + email + ' créé !');
        })
        .catch(err => {
          this.loadingService.isLoading = false;
          if (err.code === 'auth/email-already-in-use') {
            this.toastService.toast('Email déjà utilisé');
          }
        });
    } else {
      this.toastService.toast('Les deux mots de passe renseignés sont différents');
      this.loadingService.isLoading = false;
    }
  }

  signupWithEmailPassword(email: string, password: string, pass2: string) {
    if (password === pass2) {
      this.firebaseAuth
        .auth
        .createUserWithEmailAndPassword(email, password)
        .then(user => {
          this.loadingService.isLoading = false;
          user.sendEmailVerification();
          this.toastService.toast('Compte ' + email + ' créé !');
        })
        .catch(err => {
          this.loadingService.isLoading = false;
          if (err.code === 'auth/email-already-in-use') {
            this.toastService.toast('Email déjà utilisé');
          }
        });
    } else {
      this.toastService.toast('Les deux mots de passe renseignés sont différents');
      this.loadingService.isLoading = false;
    }
  }

  signInWithEmailPassword(email: string, password: string) {
    this.firebaseAuth.auth.signInWithEmailAndPassword(email, password)
      .then(value => {
        this.loadingService.isLoading = false;
      }).catch(err => {
        this.loadingService.isLoading = false;
      });
  }

  signInWithGoogle() {
    const googleProvider = new firebase.auth.GoogleAuthProvider();
    this.firebaseAuth.auth.signInWithPopup(
      googleProvider
    ).then(user => {
      this.loadingService.isLoading = false;
    }).catch(err => {
      this.loadingService.isLoading = false;
      if (err.code === 'auth/account-exists-with-different-credential') {
        this.toastService.toast('Email déjà utilisé');
      }
    });
  }

  logout() {
    this.firebaseAuth.auth.signOut().then(value => {
      this.router.navigate(['/authentication']);
    }, err => {
    });
  }

  isLoggedIn() {
    if (this.userDetails == null) {
      return false;
    } else {
      return true;
    }
  }

}

import {Injectable} from '@angular/core';

import {AngularFireAuth} from 'angularfire2/auth';
import * as firebase from 'firebase/app';

import {ActivatedRoute, Router} from '@angular/router';
import {LoadingService} from '../loading/loading.service';
import {ToastService} from '../toast.service';
import {UsersService} from '../users.service';

@Injectable()
export class AuthService {
  userDetails: firebase.User = null;

  constructor(private firebaseAuth: AngularFireAuth, private router: Router,
              private loadingService: LoadingService, private toastService: ToastService, private usersService: UsersService,
              private route: ActivatedRoute) {

    firebaseAuth.authState.subscribe(
      (user) => {
        if (user) {
          // If user.providerData[0]['providerId'] !== 'password', no need to verify email
          if (user.providerData[0]['providerId'] !== 'password' || user.emailVerified) {
            this.userDetails = user;

            if (this.router.url.indexOf('authentication') !== -1) {
              const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/record-form/new';
              this.router.navigate([returnUrl]);
            }
          } else {
            this.logout();
            this.toastService.toast('Merci de valider votre adresse mail');
          }
        } else {
          this.userDetails = null;
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
          this.usersService.updateUserData(user.uid, email, firstName + ' ' + lastName);
          this.loadingService.stopLoading();
          user.sendEmailVerification();
          this.toastService.toast('Compte ' + email + ' créé !');
        })
        .catch(err => {
          this.loadingService.stopLoading();
          if (err.code === 'auth/email-already-in-use') {
            this.toastService.toast('Email déjà utilisé');
          }
        });
    } else {
      this.toastService.toast('Les deux mots de passe renseignés sont différents');
      this.loadingService.stopLoading();
    }
  }

  signInWithEmailPassword(email: string, password: string) {
    this.firebaseAuth.auth.signInWithEmailAndPassword(email, password)
      .then(value => {
        this.loadingService.stopLoading();
      }).catch(err => {
      this.loadingService.stopLoading();
    });
  }

  signInWithGoogle() {
    this.firebaseAuth.auth.signInWithPopup(
      new firebase.auth.GoogleAuthProvider()
    ).then(result => {
      this.loadingService.stopLoading();
      this.usersService.updateUserData(result.user.uid, result.user.email, result.user.displayName);
    }).catch(err => {
      this.loadingService.stopLoading();
      if (err.code === 'auth/account-exists-with-different-credential') {
        this.toastService.toast('Email déjà utilisé');
      }
    });
  }

  resetPassword(email: string) {
    return this.firebaseAuth.auth.sendPasswordResetEmail(email)
      .then(() => console.log('sent Password Reset Email!'))
      .catch((error) => console.log(error));
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

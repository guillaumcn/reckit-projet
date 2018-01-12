import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import {MaterializeModule} from 'angular2-materialize';
import { HeaderComponent } from './header/header.component';
import {AppRoutingModule} from './app-routing.module';
import {FormsModule} from '@angular/forms';
import { AngularFireModule} from 'angularfire2';
import {AngularFireDatabaseModule} from 'angularfire2/database';
import { environment } from '../environments/environment';
import {AngularFireAuthModule} from 'angularfire2/auth';
import { LoginComponent } from './authentication/login/login.component';
import {AuthService} from './authentication/auth.service';
import {AuthGuard} from './auth-guard.service';
import {ToastService} from './toast.service';
import { LoadingComponent } from './loading/loading.component';
import {LoadingService} from './loading/loading.service';
import { CreateAccountComponent } from './authentication/create-account/create-account.component';
import { AuthenticationComponent } from './authentication/authentication.component';
import {RecordFormComponent} from './record-form/record-form.component';
import {RecordListComponent} from './record-list/record-list.component';
import {RecordItemComponent} from './record-list/record-item/record-item.component';
import {RecordService} from './record.service';
import {UsersService} from './users.service';
import { RecordDetailComponent } from './record-detail/record-detail.component';
import {ResetPasswordComponent} from './authentication/reset-password/reset-password.component';
import {HttpClientModule} from '@angular/common/http';
import {ValidationComponent} from './validation/validation.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    LoginComponent,
    LoadingComponent,
    CreateAccountComponent,
    ResetPasswordComponent,
    AuthenticationComponent,
    ValidationComponent,
    RecordFormComponent,
    RecordListComponent,
    RecordItemComponent,
    RecordDetailComponent,
],
  imports: [
    BrowserModule,
    MaterializeModule,
    AppRoutingModule,
    FormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    HttpClientModule
  ],
  providers: [
    AuthService,
    AuthGuard,
    ToastService,
    LoadingService,
    RecordService,
    UsersService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

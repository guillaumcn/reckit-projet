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
import { RecordsComponent } from './records/records.component';
import {RecordFormComponent} from './records/record-form/record-form.component';
import {RecordListComponent} from './records/record-list/record-list.component';
import {RecordItemComponent} from './records/record-list/record-item/record-item.component';
import {RecordService} from './records/record.service';
import { RecorderComponent } from './records/record-form/recorder/recorder.component';
import {UsersService} from './users.service';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    LoginComponent,
    LoadingComponent,
    CreateAccountComponent,
    AuthenticationComponent,
    RecordsComponent,
    RecordFormComponent,
    RecordListComponent,
    RecordItemComponent,
    RecorderComponent
],
  imports: [
    BrowserModule,
    MaterializeModule,
    AppRoutingModule,
    FormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireDatabaseModule,
    AngularFireAuthModule
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

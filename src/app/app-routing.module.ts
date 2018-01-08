import { CreateAccountComponent } from './authentication/create-account/create-account.component';
import { ResetPasswordComponent } from './authentication/reset-password/reset-password.component';
import { LoginComponent } from './authentication/login/login.component';
import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {AuthGuard} from './auth-guard.service';
import { AuthenticationComponent } from './authentication/authentication.component';
import {RecordFormComponent} from './record-form/record-form.component';
import {RecordListComponent} from './record-list/record-list.component';
import {RecordDetailComponent} from './record-detail/record-detail.component';


const appRoutes: Routes = [
  {path: '', redirectTo: 'record-form', pathMatch: 'full'},
  {path: 'authentication', component: AuthenticationComponent, children: [
    {path: '', redirectTo: 'login', pathMatch: 'full'},
    {path: 'login', component: LoginComponent},
    {path: 'create-account', component: CreateAccountComponent},
    {path: 'reset-password', component: ResetPasswordComponent},
  ]},
  {path: 'record-form', component: RecordFormComponent, canActivate: [AuthGuard]},
  {path: 'record-list', component: RecordListComponent, canActivate: [AuthGuard]},
  {path: 'record-detail', component: RecordDetailComponent, canActivate: [AuthGuard]},
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {

}

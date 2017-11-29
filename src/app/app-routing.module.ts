import { CreateAccountComponent } from './authentication/create-account/create-account.component';
import { LoginComponent } from './authentication/login/login.component';
import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {AuthGuard} from './auth-guard.service';
import { AuthenticationComponent } from './authentication/authentication.component';
import { RecordsComponent } from './records/records.component';


const appRoutes: Routes = [
  {path: '', redirectTo: 'records', pathMatch: 'full'},
  {path: 'authentication', component: AuthenticationComponent, children: [
    {path: '', redirectTo: 'login', pathMatch: 'full'},
    {path: 'login', component: LoginComponent},
    {path: 'create-account', component: CreateAccountComponent},
  ]},
  {path: 'records', component: RecordsComponent, canActivate: [AuthGuard]}
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {

}

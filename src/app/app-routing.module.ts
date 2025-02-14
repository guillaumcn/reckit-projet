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
import {ValidationComponent} from './validation/validation.component';
import {TagDetailComponent} from './tag-detail/tag-detail.component';
import {MyRecordsComponent} from './my-records/my-records.component';
import {NewsComponent} from './news/news.component';
import {SearchComponent} from './search/search.component';


const appRoutes: Routes = [
  {path: '', redirectTo: 'news', pathMatch: 'full'},
  {path: 'authentication', component: AuthenticationComponent, children: [
    {path: '', redirectTo: 'login', pathMatch: 'full'},
    {path: 'login', component: LoginComponent},
    {path: 'create-account', component: CreateAccountComponent},
    {path: 'reset-password', component: ResetPasswordComponent},
  ]},
  {path: 'record-form/:key', component: RecordFormComponent, canActivate: [AuthGuard]},
  {path: 'news', component: NewsComponent, canActivate: [AuthGuard]},
  {path: 'my-records', component: MyRecordsComponent, canActivate: [AuthGuard]},
  {path: 'record-detail/:key', component: RecordDetailComponent, canActivate: [AuthGuard]},
  {path: 'tag-detail/:tag', component: TagDetailComponent, canActivate: [AuthGuard]},
  {path: 'search/:value', component: SearchComponent, canActivate: [AuthGuard]},
  {path: 'validation', component: ValidationComponent},
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {

}

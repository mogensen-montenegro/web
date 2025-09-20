import {CommonModule} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {LoginComponent} from './login.component';
import {LoginService} from './login-core/login.service';
import {RouterLinkActive} from "@angular/router";
import { LoaderComponent } from 'src/app/components/loader/loader.component';

@NgModule({
  declarations: [LoginComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterLinkActive,
    LoaderComponent
  ],
  exports: [LoginComponent],
  providers: [LoginService]
})
export class LoginModule {
}

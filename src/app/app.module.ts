import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {PagesModule} from './pages/pages.module';
import {LoginModule} from './portal/pages/login/login.module';
import {PanelControlModule} from './portal/pages/panel-control/panel-control.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    PagesModule,
    LoginModule,
    PagesModule,
    PanelControlModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}

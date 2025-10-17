import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { AppComponent } from './app.component';
import { LoginComponent } from './login.component';
import { TaskBoardComponent } from './task-board.component';
import { AuthInterceptor } from './auth.interceptor';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: TaskBoardComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  declarations: [AppComponent, LoginComponent, TaskBoardComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,   // optional but nice for CDK interactions
    HttpClientModule,
    FormsModule,               // needed for [(ngModel)]
    DragDropModule,            // needed for cdkDropList / cdkDrag
    RouterModule.forRoot(routes)
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent],
})
export class AppModule {}

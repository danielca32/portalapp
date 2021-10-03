import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HeaderType } from '../enum/header-type.enum';
import { NotificationType } from '../enum/notification-type.enum';
import { User } from '../model/user';
import { AuthenticationService } from '../service/authentication.service';
import { NotificationService } from '../service/notification.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit, OnDestroy {
  public showLoading: boolean;
  private subscriptions: Subscription[] = [];

  constructor(private router: Router, private authenticationService: AuthenticationService, private notificationService: NotificationService) { }

  ngOnDestroy(): void {
    if (this.authenticationService.isUserLoggedIn()) {
      this.router.navigateByUrl('/user/management');
    }
  }

  public onRegister(user: User): void {
    this.showLoading = true;
    console.log(user);
    this.subscriptions.push(
      this.authenticationService.register(user).subscribe((response: User) => {
        this.showLoading = false;
        this.sendErrorNotification(NotificationType.SUCCESS, 'An email has been sent with your password.');
      }, (errorResponse: HttpErrorResponse) => {
        console.log(errorResponse);
        this.sendErrorNotification(NotificationType.ERROR, errorResponse.error.message);
        this.showLoading = false;
      })
    );
  }

  sendErrorNotification(notificationType: NotificationType, message: string): void {
    if (message) {
      this.notificationService.notify(notificationType, message);
    } else {
      this.notificationService.notify(notificationType, 'An error ocurred. Please try again');
    }
  }
  ngOnInit(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

}

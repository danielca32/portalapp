import { HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import { NotificationType } from '../enum/notification-type.enum';
import { CustomHttpResponse } from '../model/CustomHttpResponse';
import { FileUploadStatus } from '../model/file-upload.status';
import { User } from '../model/user';
import { AuthenticationService } from '../service/authentication.service';
import { NotificationService } from '../service/notification.service';
import { UserService } from '../service/user.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {
  private titleSubject = new BehaviorSubject<string>('Users'); //Completely unnecessary, just to try RxJS a bit. 
  public titleAction$ = this.titleSubject.asObservable();
  public user: User;
  public users: User[];
  public refreshing: boolean;
  private subscriptions: Subscription[] = [];
  public selectedUser: User;
  public fileName: string;
  public profileImage: File;
  public isAdmin: boolean = true; //TODO Change
  public isAdminOrManager: boolean = true; //TODO Change
  public isManager: boolean = true; //TODO Change
  public fileStatus = new FileUploadStatus();


  public editUser: User = new User();
  private currentUsername: string;
  constructor(private userService: UserService, private notificationService: NotificationService, private authenticationService: AuthenticationService, private router: Router) { }

  ngOnInit(): void {
    this.user = this.authenticationService.getUserFromLocalCache();
    this.getUsers(true);
  }

  public changeTitle(title: string): void {
    this.titleSubject.next(title)
  }

  public onSelectUser(selectedUser: User): void {
    this.selectedUser = selectedUser;
    document.getElementById('openUserInfo').click();
  }
  public getUsers(showNotification: boolean): void {
    this.refreshing = true;
    this.subscriptions.push(this.userService.getUsers().subscribe((response: User[]) => {
      this.userService.addUsersToLocalCache(response);
      this.users = response;
      this.refreshing = false;
      if (showNotification) {
        this.sendNotification(NotificationType.SUCCESS, `${response.length} Users loaded successfully.`)
      }
    },
      (errorResponse: HttpErrorResponse) => { this.sendNotification(NotificationType.ERROR, errorResponse.error.message); }))
  }

  public searchUsers(searchTerm: string): void {
    const results: User[] = [];
    for (const user of this.userService.getUsersFromLocalCache()) {
      if (user.firstName.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 ||
        user.lastName.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
      ) {
        results.push(user);
      }
    }

    this.users = results;
    if (results.length == 0 || !searchTerm) {
      this.users = this.userService.getUsersFromLocalCache();
    }
  }

  private sendNotification(notificationType: NotificationType, message: string): void {
    if (message) {
      this.notificationService.notify(notificationType, message);
    } else {
      this.notificationService.notify(notificationType, 'An error ocurred. Please try again');
    }
  }

  public onProfileImageChange(fileName: string, profileImage: File): void {
    this.fileName = fileName;
    this.profileImage = profileImage;
  }

  public onAddNewUser(userForm: NgForm): void {
    const formData = this.userService.createUserFormData(null, userForm.value, this.profileImage);
    this.subscriptions.push(this.userService.addUser(formData).subscribe((response: User) => {
      this.clickButton('new-user-close');
      this.getUsers(false);
      this.fileName = null;
      this.profileImage = null;
      userForm.reset();
      this.sendNotification(NotificationType.SUCCESS, `${response.firstName} ${response.lastName} updated successfully.`)
    }, (errorResponse: HttpErrorResponse) => {
      this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
      this.profileImage = null;
    }));

  }
  public saveNewUser() {
    this.clickButton('new-user-save');
  }

  private clickButton(buttonId: string): void {
    document.getElementById(buttonId).click();
  }

  public onEditUser(editUser: User): void {
    this.editUser = editUser;
    this.currentUsername = editUser.username;
    this.clickButton('openUserEdit');
  }

  public onUpdateUser(): void {
    const formData = this.userService.createUserFormData(this.currentUsername, this.editUser, this.profileImage);
    this.subscriptions.push(this.userService.updateUser(formData).subscribe((response: User) => {
      this.clickButton('closeEditUserModalButton');
      this.getUsers(false);
      this.fileName = null;
      this.profileImage = null;
      this.sendNotification(NotificationType.SUCCESS, `${response.firstName} ${response.lastName} updated successfully.`)
    }, (errorResponse: HttpErrorResponse) => {
      this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
      this.profileImage = null;
    }));
  }

  public onDeleteUser(username: string): void {
    this.subscriptions.push(this.userService.deleteUser(username).subscribe(
      (response: CustomHttpResponse) => {
        this.sendNotification(NotificationType.SUCCESS, response.message);
        this.getUsers(false);
      }, (errorResponse: HttpErrorResponse) => {
        this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
      }
    ));
  }

  public onResetPassword(emailForm: NgForm): void {
    this.refreshing = true;
    const emailAddress = emailForm.value['reset-password-email'];
    console.log(emailForm);
    this.subscriptions.push(
      this.userService.resetPassword(emailAddress).subscribe(
        (response: CustomHttpResponse) => {
          this.sendNotification(NotificationType.SUCCESS, response.message);
          this.refreshing = false;
        },
        (error: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, error.error.message);
        },
        () => { emailForm.reset() })
    );
  }

  public onUpdateCurrentUser(user: User): void {
    this.refreshing = true;
    this.currentUsername = this.authenticationService.getUserFromLocalCache().username;
    const formData = this.userService.createUserFormData(this.currentUsername, user, this.profileImage);
    this.subscriptions.push(this.userService.updateUser(formData).subscribe((response: User) => {
      this.authenticationService.addUserToLocalCache(response);
      this.getUsers(false);
      this.fileName = null;
      this.profileImage = null;
      this.refreshing = false;
      this.sendNotification(NotificationType.SUCCESS, `${response.firstName} ${response.lastName} updated successfully.`)
    }, (errorResponse: HttpErrorResponse) => {
      this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
      this.profileImage = null;
      this.refreshing = false;
    }));
  }

  public onLogOut(): void {
    this.authenticationService.logOut();
    this.router.navigate(['/login']);
    this.sendNotification(NotificationType.SUCCESS, `You've been successfully logged out`)
  }

  public updateProfileImage() {
    this.clickButton('profile-image-input');
  };

  public onUpdateProfileImage(): void {
    const formData = new FormData();
    formData.append('username', this.user.username);
    formData.append('profileImage', this.profileImage);

    this.subscriptions.push(this.userService.updateProfileImage(formData).subscribe((event: HttpEvent<any>) => {
      this.reportUploadProgress(event);
      this.sendNotification(NotificationType.SUCCESS, `Profile image updated updated successfully.`)
    }, (errorResponse: HttpErrorResponse) => {
      this.sendNotification(NotificationType.ERROR, errorResponse.error.message);

    }));
  }
  reportUploadProgress(event: HttpEvent<any>): void {
    switch (event.type) {
      case HttpEventType.UploadProgress:
        this.fileStatus.percentage = Math.round(100 * event.loaded / event.total);
        this.fileStatus.status = 'progress';
        break;
      case HttpEventType.Response:
        if (event.status === 200) {
          this.user.profileImageUrl = `${event.body.profileImageUrl}?time=${new Date().getTime()}`;
          this.sendNotification(NotificationType.SUCCESS, `${event.body.firstName}\'s image updated successfully.`);
          this.fileStatus.status = 'done';
        } else {
          this.sendNotification(NotificationType.ERROR, `Unable to upload image. Please try again.`);

        }
        break;

        default: 
        `Finished all processes.`
    }
  }
}

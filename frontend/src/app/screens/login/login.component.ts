import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  errors = '';
  constructor(private http: HttpClient) {}
  @Output() onLogin = new EventEmitter<{ fullname: string; url: string; email: string; favorites: any[] }>();
  login(form: any): void {
    if (form.invalid) return;
    const payload = {
      email: this.email,
      password: this.password
    };
    this.http.post<any>('/login', payload, { withCredentials: true })
    .subscribe({
      next: (res) => {
        console.log('Registered:', res);
        this.errors = '';
        this.onLogin.emit({ fullname: res.fullname, url: res.image, email: res.email, favorites: res.favorites  });
      },
      error: (err) => {
        const backendError = err.error;
        this.errors = backendError?.message || 'Login failed.';
      }
    });
  }
  @Output() registerPage = new EventEmitter<void>();
  toRegister(): void {
    this.registerPage.emit();
  }
}

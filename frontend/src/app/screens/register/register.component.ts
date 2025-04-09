import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  fullname = '';
  email = '';
  password = '';
  errors = '';
  constructor(private http: HttpClient) {}
  @Output() onRegister = new EventEmitter<{ fullname: string; url: string; email: string; favorites: any[] }>();
  register(form: any): void {
    if (form.invalid) return;
    const payload = {
      fullname: this.fullname,
      email: this.email,
      password: this.password
    };
    this.http.post<any>('/register', payload, { withCredentials: true })
    .subscribe({
      next: (res) => {
        console.log('Registered:', res);
        this.errors = '';
        this.onRegister.emit({ fullname: res.fullname, url: res.image, email: res.email, favorites: res.favorites });
      },
      error: (err) => {
        const backendError = err.error;
        this.errors = backendError?.message || 'Registration failed.';
      }
    });
  }
  clear() {
    this.errors = '';
  }
  @Output() loginPage = new EventEmitter<void>();
  toLogin(): void {
    this.loginPage.emit();
  }
}

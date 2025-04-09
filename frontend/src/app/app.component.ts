import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainComponent } from './main/main.component';
import { FavoritesComponent } from './screens/favorites/favorites.component';
import { LoginComponent } from './screens/login/login.component';
import { RegisterComponent } from './screens/register/register.component';
import { SearchComponent } from './screens/search/search.component';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MainComponent, CommonModule, FavoritesComponent, LoginComponent, RegisterComponent, SearchComponent, HttpClientModule,],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';
  selectedButton = 'search';
  selectedLoginButton = '';
  isNotLogin = true;
  userFullname = '';
  url = '';
  email = '';
  alertMessage: string | null = null;
  alertType: 'danger' | 'warning' | 'success' | 'info' = 'danger';
  favorites: any[] = [];
  alertQueue: { message: string; type: string; id: number }[] = [];
  private alertCount = 0;
  // navButtons = [
  //   { id: 'search', label: 'Search' },
  //   { id: 'login', label: 'Log in' },
  //   { id: 'register', label: 'Register' },
  // ];
  constructor(private titles: Title, private http: HttpClient) {}
  changeTitle(): void {
    if (this.isNotLogin) {
      if (this.selectedButton === 'search') this.titles.setTitle('Search');
      else if (this.selectedButton === 'login') this.titles.setTitle('Login');
      else if (this.selectedButton === 'register') this.titles.setTitle('Register');
    } else {
      if (this.selectedLoginButton === 'search') this.titles.setTitle('Search');
      else if (this.selectedLoginButton === 'favor') this.titles.setTitle('Favorites');
    }
  }
  clearPage(): void{
    this.isNotLogin = true;
    this.selectedLoginButton = '';
    this.selectedButton = '';
    setTimeout(() => {
      this.selectedButton = 'search';
    });
    this.userFullname = '';
    this.url = '';
    this.email = '';
  }

  handleLogin(fullname: string, url: string, email: string, favorites: any[]): void {
    this.userFullname = fullname;
    this.url = url;
    this.email = email;
    this.favorites = favorites;
    this.isNotLogin = false;
    this.selectedButton = '';
    this.selectedLoginButton = 'search';
  }
  showAlert(message: string, type: 'danger' | 'warning' | 'success' | 'info' = 'danger'): void {
    const id = this.alertCount++;
    this.alertQueue.push({ message, type, id });

    setTimeout(() => {
      this.alertQueue = this.alertQueue.filter(alert => alert.id !== id);
    }, 3000);
  }
  removeAlert(alertId: number): void {
    this.alertQueue = this.alertQueue.filter(alert => alert.id !== alertId);
  }
  logout(): void {
    this.http.post('/logout', {}, { withCredentials: true }).subscribe({
      next: (res : any) => {
        this.clearPage();
        this.showAlert(res.message, 'warning');
      },
      error: () => {
        console.log("Logout failed.");
        this.clearPage();
      }
    });
  }


  deleteAccount(): void {
    this.http.post('/delete', { email: this.email }, { withCredentials: true }).subscribe({
      next: (res: any) => {
        this.clearPage();
        this.showAlert(res.message, 'danger');
      },
      error: () => {
        this.clearPage();
      }
    });
  }
  selectButton(id: string): void {
    this.selectedButton = id;
    this.changeTitle();
  }
  selectLoginButton(id: string): void {
    this.selectedLoginButton = id;
    this.changeTitle();
  }
  change(): void {
    this.isNotLogin = !this.isNotLogin;
    this.selectedButton = '';
    this.changeTitle();
  }

  ngOnInit(): void {
    this.checkLogin();
    this.changeTitle();
  }

  checkLogin(): void {
    this.http.get<any>('/me', { withCredentials: true }).subscribe({
      next: (res) => {
        this.userFullname = res.fullname;
        this.url = res.image;
        this.email = res.email;
        this.favorites = res.favorites;
        this.isNotLogin = false;
        this.selectedButton = '';
        this.selectedLoginButton = 'search';
      },
      error: () => {
        this.clearPage();
      }
    });
  }
  openNav(): void {
    const navbar = document.getElementById('navbarContent');
    if (!navbar) return;
    if (navbar.classList.contains('show')) {
      navbar.style.maxHeight = '0';
      const onTransitionEnd = () => {
        navbar.classList.remove('show');
        navbar.removeEventListener('transitionend', onTransitionEnd);
      };
      navbar.addEventListener('transitionend', onTransitionEnd);
    } else {
      // Expand
      navbar.classList.add('show');
      navbar.style.maxHeight = '0';
      navbar.style.maxHeight = navbar.scrollHeight + 'px';
    }
    
  }
  
}

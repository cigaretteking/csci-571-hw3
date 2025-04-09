import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { Tooltip } from 'bootstrap';

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
      new Tooltip(el);
    });
  })
  .catch((err) => console.error(err));
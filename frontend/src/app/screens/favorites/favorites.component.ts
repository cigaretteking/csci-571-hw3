import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChangeDetectorRef, OnDestroy } from '@angular/core';
@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.css'
})
export class FavoritesComponent {
  @Input() favorites: any[] = [];
  @Input() email: string = '';
  @Output() updateFavorites = new EventEmitter<any[]>();
  @Output() showAlert = new EventEmitter<{ message: string; type: 'success' | 'danger' }>();
  private timer: any;
  ngOnInit(): void {
    console.log('[FavoritesComponent] Loaded favorites:', this.favorites);
    const newest = this.favorites[0];
    const newestTime = new Date(newest?.time || 0).getTime();
    const now = Date.now();
    const diffSec = Math.floor((now - newestTime) / 1000);

    const interval = diffSec < 60 ? 1000 : 60000;

    this.timer = setInterval(() => {
      this.cdr.detectChanges();
    }, interval);
  }
  constructor(private router: Router, private cdr: ChangeDetectorRef) {}
  removeFavorite(event: MouseEvent, id: string): void {
    event.stopPropagation();
    fetch('/remove_favorite', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, email: this.email })
    })
    .then(res => res.json())
    .then(res => {
      this.updateFavorites.emit(res.favorites);
      this.showAlert.emit({ message: res.message, type: res.type });
    })
    .catch(() => {
      this.showAlert.emit({ message: 'Failed to remove favorite.', type: 'danger' });
    });
  }

  viewArtist(id: string): void {
    this.router.navigate([], {
      queryParams: { artist: id, tab: 'info' },
      queryParamsHandling: 'merge',
    });
    this.toSearch();
  }

  getRelativeTime(isoTime: string): string {
    const now = new Date().getTime();
    const time = new Date(isoTime).getTime();
    const diff = Math.floor((now - time) / 1000);

    if (diff < 60) return `${diff} second${diff === 1 ? '' : 's'} ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
  @Output() searchPage = new EventEmitter<void>();
  toSearch(): void {
    this.searchPage.emit();
  }
}

import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Modal } from 'bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent {
  searchContent = '';
  isInputFocused: boolean = false;
  isLoading = false;
  searchResults: any[] = [
  ];
  similarArtists: any[] = [
  ];
  artworks: any[] = [];
  hoveredCard: string | null = null;
  selectedCard: string | null = null;
  selectedTab: 'info' | 'artworks' = 'info';
  isInfoLoading = false;
  isArtworksLoading = false;
  noResult = true;
  searched = false;
  noArtworksResult = false;
  artistInfo = {
    name: '',
    birthday: '',
    deathday: '',
    nationality: '',
    biography: ''
  };
  selectedArtworkTitle: string = '';
  isGenesLoading = false;
  selectedArtwork: any = null;
  genes: any[] = [];
  @Input() favorites: any[] = [];
  @Input() isNotLogin: boolean = true;
  @Input() email: string = '';
  @Output() updateFavorites = new EventEmitter<any[]>();
  @ViewChild('categoryModal') categoryModalRef!: ElementRef;
  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute) { }



  isFavorite(id: string): boolean {
    return this.favorites.some(fav => fav.id === id);
  }
  @Output() showAlert = new EventEmitter<{ message: string; type: 'success' | 'danger' }>();
  modifyFavorite(event: MouseEvent, result: any): void {
    event.stopPropagation();
    const endpoint = this.isFavorite(result.link) ? '/remove_favorite' : '/add_favorite';

    this.http.post<any>(`${endpoint}`, {
      id: result.link,
      email: this.email
    }, { withCredentials: true }).subscribe({
      next: (res) => {
        this.favorites = res.favorites;
        this.updateFavorites.emit(this.favorites);
        this.showAlert.emit({ message: res.message, type: res.type });
      },
      error: (err) => {
        console.error('Favorite add or remove failed:', err);
      }
    });
  }
  selectArtist(id: string): void {
    if (this.selectedCard === id) return;
    if (this.isInfoLoading) return;
    if (this.isArtworksLoading) return;
    console.trace('selectArtist called with', id);
    this.isInfoLoading = true;
    this.isArtworksLoading = true;
    this.selectedCard = id;
    this.artistInfo = { name: '', birthday: '', deathday: '', nationality: '', biography: '' };
    this.artworks = [];
    this.router.navigate([], {
      queryParams: { artist: id, tab: this.selectedTab },
      queryParamsHandling: 'merge',
    });
    console.log("1111");
    this.http.get<any>(`/artists/${id}`).pipe(take(1)).subscribe({
      next: (res) => {
        console.log(res);
        this.artistInfo = {
          name: res.name || '',
          birthday: res.birthday || '',
          deathday: res.deathday || '',
          nationality: res.nationality || '',
          biography: res.biography?.replace(/(\w)-\s+(\w)/g, '$1$2').trim() || ''
        };
        this.isInfoLoading = false;
      },
      error: (err) => {
        console.error('Failed to fetch artist info:', err);
        this.isInfoLoading = false;
      }
    });
    this.http.get<any>(`/artworks/${id}`).subscribe({
      next: (res) => {
        this.artworks = res.results || [];
        this.noArtworksResult = this.artworks?.length === 0;
        this.isArtworksLoading = false;
      },
      error: (err) => {
        console.error('Failed to fetch artist info:', err);
        this.isArtworksLoading = false;
      }
    });
    if (!this.isNotLogin && !this.noResult) {
      this.http.get<any>(`/similar_artists/${id}`).subscribe({
        next: (res) => {
          this.similarArtists = res.results || [];
        },
        error: () => {
          this.similarArtists = [];
        }
      });
    }
  }
  
  search(): void {
    if (!this.searchContent.trim()) return;
    this.noResult = true;
    this.isLoading = true;
    this.searched = false;
    console.log(`/search/${encodeURI(this.searchContent.trim()).replace(/%20/g, '+')}`);
    this.http.get<any>(`/search/${encodeURI(this.searchContent.trim()).replace(/%20/g, '+')}`)
      .subscribe({
        next: (res) => {
          this.searchResults = res.results || [];
          this.selectedCard = null;
          this.similarArtists = [];
          this.isLoading = false;
          this.noResult = this.searchResults?.length === 0;
          this.searched = true;
        },
        error: () => {
          this.searchResults = [];
          this.isLoading = false;
        }
      });
  }

  clear(): void {
    this.searchContent = '';
    this.isLoading = false;
    this.searchResults = [];
    this.hoveredCard = null;
    this.selectedCard = null;
    this.noResult = true;
    this.isInputFocused = false;
    this.similarArtists = [];
    this.artworks = [];
    this.selectedTab = 'info';
    this.isInfoLoading = false;
    this.isArtworksLoading = false;
    this.searched = false;
    this.noArtworksResult = false;
    this.artistInfo = {
      name: '',
      birthday: '',
      deathday: '',
      nationality: '',
      biography: ''
    };
    this.selectedArtworkTitle = '';
    this.isGenesLoading = false;
    this.selectedArtwork = null;
    this.router.navigate([], {
    });
  }

  openModal(artwork: any) {
    this.selectedArtwork = artwork;
    this.selectedArtworkTitle = artwork.title;

    this.isGenesLoading = true;
    this.genes = [];
    this.http.get<any>(`/genes/${artwork.id}`).subscribe({
      next: (res) => {
        this.genes = res.results || [];
        this.isGenesLoading = false;
      },
      error: () => {
        this.genes = [];
        this.isGenesLoading = false;
      }
    });

    const modal = new Modal(this.categoryModalRef.nativeElement);
    modal.show();
  }
  private link: any;
  ngOnInit(): void {
    this.link = this.route.queryParams.subscribe(params => {
      const artistId = params['artist'];
      const tab = params['tab'] as 'info' | 'artworks';
  
      if (artistId && this.searchResults.length === 0 && this.selectedCard !== artistId) {
        this.selectedTab = tab || 'info';
        this.selectArtist(artistId);
      }
    });
  }
  ngOnDestroy(): void {
    if (this.link) {
      this.link.unsubscribe();
    }
  }
}


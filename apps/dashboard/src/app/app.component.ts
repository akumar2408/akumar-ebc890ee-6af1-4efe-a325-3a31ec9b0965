
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  template: `
  <div class="min-h-screen">
    <header class="p-4 border-b border-white/10 sticky top-0 backdrop-blur bg-black/30 flex items-center justify-between">
      <div class="font-bold text-lg">Secure Tasks</div>
      <nav class="space-x-4">
        <button class="px-3 py-1 rounded bg-white/10 hover:bg-white/20" (click)="go('')">Dashboard</button>
        <button class="px-3 py-1 rounded bg-white/10 hover:bg-white/20" (click)="go('login')">Login</button>
      </nav>
    </header>
    <main class="p-4 max-w-4xl mx-auto">
      <router-outlet></router-outlet>
    </main>
  </div>
  `
})
export class AppComponent {
  constructor(private router: Router) {}
  go(path: string) { this.router.navigateByUrl(path); }
}

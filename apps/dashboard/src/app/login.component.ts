import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  template: `
  <div class="max-w-md mx-auto mt-16 p-6 rounded-2xl ring-1 ring-white/10 bg-white/5">
    <h2 class="text-xl font-semibold mb-4">Login</h2>

    <form (ngSubmit)="login()" class="space-y-3">
      <input [(ngModel)]="email" name="email" type="email" placeholder="Email"
             class="w-full px-3 py-2 rounded bg-black/30 ring-1 ring-white/10" required />
      <input [(ngModel)]="password" name="password" type="password" placeholder="Password"
             class="w-full px-3 py-2 rounded bg-black/30 ring-1 ring-white/10" required />
      <div class="flex items-center gap-2">
        <input [(ngModel)]="orgId" name="orgId" type="number" placeholder="Org ID"
               class="w-32 px-3 py-2 rounded bg-black/30 ring-1 ring-white/10" />
        <button class="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500">Login</button>
      </div>
    </form>

    <p class="text-sm mt-3 opacity-80">
      Tip: seed users with <code>npm run seed</code>, then use
      owner&#64;demo.com / <code>password</code>
    </p>
  </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  orgId: number | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  async login() {
    try {
      const res = await this.http
        .post<{ accessToken: string }>('/api/auth/login', {
          email: this.email,
          password: this.password,
        })
        .toPromise();

      if (!res) return;

      localStorage.setItem('jwt', res.accessToken);
      if (this.orgId) localStorage.setItem('orgId', String(this.orgId));

      this.router.navigateByUrl('/');
    } catch (e) {
      alert('Login failed');
      console.error(e);
    }
  }
}

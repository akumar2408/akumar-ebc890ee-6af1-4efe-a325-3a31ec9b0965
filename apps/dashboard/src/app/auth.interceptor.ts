import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Prefix relative requests with /api so the dev proxy forwards to :3333
    let url = req.url;
    const isAbsolute = /^https?:\/\//i.test(url);
    if (!isAbsolute) {
      url = url.startsWith('/api') ? url : `/api${url.startsWith('/') ? '' : '/'}${url}`;
    }

    // Attach JWT + org
    const token = localStorage.getItem('jwt');
    const orgId = localStorage.getItem('orgId');

    let headers = req.headers;
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    if (orgId) headers = headers.set('X-Org-Id', orgId);

    return next.handle(req.clone({ url, headers }));
  }
}

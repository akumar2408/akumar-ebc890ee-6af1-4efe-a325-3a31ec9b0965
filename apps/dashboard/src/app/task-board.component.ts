import { Component, HostListener, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

type Status = 'todo' | 'in_progress' | 'done';

interface Task {
  id: number;
  title: string;
  description?: string | null;
  category?: string | null;
  status: Status;
  createdAt: string;
  updatedAt: string;
  org: { id: number; name: string };
  ownerUser: { id: number; email?: string };
}

@Component({
  selector: 'app-task-board',
  template: `
  <div class="p-4 md:p-8 max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-semibold">Secure Tasks</h1>

        <label class="text-sm opacity-80">Org</label>
        <select [(ngModel)]="orgId" (ngModelChange)="onOrgChange($event)"
                class="px-3 py-2 rounded bg-black/30 ring-1 ring-white/10">
          <option [value]="1">1 (TurboVets)</option>
          <option [value]="2">2 (TurboVets West)</option>
        </select>

        <input [(ngModel)]="filter" (ngModelChange)="splitIntoColumns()" placeholder="Filter..."
               class="px-3 py-2 rounded bg-black/30 ring-1 ring-white/10 w-44" />

        <select [(ngModel)]="filterCategory" (ngModelChange)="splitIntoColumns()"
                class="px-3 py-2 rounded bg-black/30 ring-1 ring-white/10">
          <option value="">All</option>
          <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <button class="px-3 py-2 rounded bg-zinc-700 hover:bg-zinc-600"
                (click)="toggleTheme()">
          {{ theme === 'dark' ? 'Light' : 'Dark' }}
        </button>
        <button class="px-3 py-2 rounded bg-zinc-700 hover:bg-zinc-600" (click)="logout()">Logout</button>
      </div>
    </div>

    <div class="grid md:grid-cols-3 gap-4" cdkDropListGroup>
      <!-- Create -->
      <div class="panel p-4">
        <h2 class="font-medium mb-3">New Task</h2>

        <input #newTitleRef
               [(ngModel)]="newTitle"
               (keyup.enter)="create()"
               placeholder="Title (press Enter)"
               class="input mb-2"
               autocomplete="off" />

        <input [(ngModel)]="newCategory"
               placeholder="Category (Work / Personal …)"
               class="input mb-2"
               autocomplete="off" />

        <textarea [(ngModel)]="newDesc"
                  placeholder="Description"
                  class="input h-28"></textarea>

        <button class="btn-primary mt-3" (click)="create()">Add</button>

        <p class="text-sm mt-2 opacity-80">
          Shortcuts:
          <span class="kbd">{{ modKey }}</span> <span class="kbd">N</span> new,
          <span class="kbd">{{ modKey }}</span> <span class="kbd">F</span> filter
        </p>
      </div>

      <!-- Columns -->
      <ng-container *ngFor="let col of columns">
        <div class="panel p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-medium capitalize">{{ label(col.key) }}</h2>
            <span class="text-sm opacity-70">{{ col.items.length }}</span>
          </div>

          <div class="min-h-[200px] space-y-3"
               cdkDropList
               [cdkDropListData]="col.items"
               (cdkDropListDropped)="onDrop($event, col.key)">
            <div *ngFor="let t of col.items" cdkDrag class="card-muted p-3">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <div class="font-medium">{{ t.title }}</div>
                  <div class="text-xs opacity-70" *ngIf="t.category">{{ t.category }}</div>
                  <div class="text-sm opacity-80 mt-1" *ngIf="t.description">{{ t.description }}</div>
                </div>
                <button title="Delete" class="text-rose-400 hover:text-rose-300" (click)="remove(t)">✕</button>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  </div>
  `
})
export class TaskBoardComponent implements OnInit {
  // theme
  theme: 'dark' | 'light' =
    (localStorage.getItem('theme') as any) ??
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  modKey = navigator.platform?.toLowerCase().includes('mac') ? '⌘' : 'Ctrl';

  // data
  all: Task[] = [];
  newTitle = '';
  newCategory = '';
  newDesc = '';
  filter = '';
  filterCategory = '';
  categories = ['Work', 'Personal', 'Errand', 'Other'];

  get orgId(): number { return Number(localStorage.getItem('orgId') || 1); }
  set orgId(v: number) { localStorage.setItem('orgId', String(v)); }

  columns = [
    { key: 'todo' as Status,        items: [] as Task[] },
    { key: 'in_progress' as Status, items: [] as Task[] },
    { key: 'done' as Status,        items: [] as Task[] },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.applyTheme((localStorage.getItem('theme') as 'light' | 'dark') || 'dark');
    this.load();
  }

  // ---- THEME ----
  private applyTheme(theme: 'light'|'dark' = this.theme) {
    const root = document.documentElement;
    if (theme === 'dark') { root.classList.add('dark'); root.classList.remove('light'); }
    else { root.classList.add('light'); root.classList.remove('dark'); }
    localStorage.setItem('theme', theme);
  }

  toggleTheme() {
    this.theme = (this.theme === 'dark') ? 'light' : 'dark';
    this.applyTheme();
  }

  // ---- SHORTCUTS (Ctrl/⌘ + N, Ctrl/⌘ + F only, and never while typing) ----
  private isEditable(el: Element | null) {
    if (!el) return false;
    const tag = (el as HTMLElement).tagName;
    return ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || (el as HTMLElement).isContentEditable;
  }

  @HostListener('window:keydown', ['$event'])
  onGlobalKey(e: KeyboardEvent) {
    if (!(e.ctrlKey || e.metaKey)) return;
    if (this.isEditable(document.activeElement) || this.isEditable(e.target as Element)) return;

    const k = e.key.toLowerCase();
    if (k === 'n') { e.preventDefault(); this.focusNew(); }
    if (k === 'f') { e.preventDefault(); this.focusFilter(); }
  }

  // ---- UI helpers ----
  label(s: Status) { return s === 'in_progress' ? 'In Progress' : s[0].toUpperCase() + s.slice(1); }

  splitIntoColumns() {
    const lists = { todo: [] as Task[], in_progress: [] as Task[], done: [] as Task[] };
    const f = this.filter.toLowerCase();
    for (const t of this.all) {
      const matchesText = !f || t.title.toLowerCase().includes(f) || (t.description || '').toLowerCase().includes(f);
      const matchesCat = !this.filterCategory || (t.category || '') === this.filterCategory;
      if (matchesText && matchesCat) lists[t.status].push(t);
    }
    this.columns[0].items = lists.todo;
    this.columns[1].items = lists.in_progress;
    this.columns[2].items = lists.done;
  }

  async load() {
    const res = await this.http.get<Task[]>(`/api/tasks?orgId=${this.orgId}`).toPromise();
    this.all = res || [];
    this.splitIntoColumns();
  }

  async create() {
    if (!this.newTitle.trim()) return;
    const body = { title: this.newTitle.trim(), category: this.newCategory || null, description: this.newDesc || null };
    try {
      const created = await this.http.post<Task>(`/api/tasks?orgId=${this.orgId}`, body).toPromise();
      if (created) {
        this.all.unshift(created);
        this.newTitle = this.newCategory = this.newDesc = '';
        this.splitIntoColumns();
      }
    } catch {
      alert('Create failed (check org and permissions).');
    }
  }

  async remove(t: Task) {
    try {
      await this.http.delete(`/api/tasks/${t.id}?orgId=${this.orgId}`).toPromise();
      this.all = this.all.filter(x => x.id !== t.id);
      this.splitIntoColumns();
    } catch {
      alert('Delete failed (permission?).');
    }
  }

  async onDrop(event: CdkDragDrop<Task[]>, newStatus: Status) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }
    const task = event.previousContainer.data[event.previousIndex];
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    const prev = task.status;
    task.status = newStatus;
    try {
      const updated = await this.http.put<Task>(`/api/tasks/${task.id}?orgId=${this.orgId}`, { status: newStatus }).toPromise();
      if (updated) {
        const idx = this.all.findIndex(x => x.id === task.id);
        if (idx >= 0) this.all[idx] = updated;
      }
    } catch (e) {
      task.status = prev;
      this.splitIntoColumns();
      console.error('Failed to update status', e);
    }
  }

  onOrgChange(_: number) {
    this.load();
  }

  logout() {
    localStorage.clear();
    location.href = '/login';
  }

  // focus helpers
  focusNew() {
    document.querySelector<HTMLInputElement>('input[placeholder="Title (press Enter)"]')?.focus();
  }
  focusFilter() {
    document.querySelector<HTMLInputElement>('input[placeholder="Filter..."]')?.focus();
  }
}

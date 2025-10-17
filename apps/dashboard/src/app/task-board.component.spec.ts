import { TestBed } from '@angular/core/testing';
import { TaskBoardComponent } from './task-board.component';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { HttpClientTestingModule } from '@angular/common/http/testing';

type Status = 'todo' | 'in_progress' | 'done';

describe('TaskBoardComponent (filter & columns)', () => {
  let comp: TaskBoardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, DragDropModule, HttpClientTestingModule],
      declarations: [TaskBoardComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskBoardComponent);
    comp = fixture.componentInstance;

    // seed tasks across columns
    const now = new Date().toISOString();
    (comp as any).all = [
      { id: 1, title: 'Write docs',  description: null, category: 'Work', status: 'todo',        createdAt: now, updatedAt: now, org: { id: 1, name: 'TurboVets' }, ownerUser: { id: 1 } },
      { id: 2, title: 'Groceries',   description: null, category: 'Personal', status: 'done',    createdAt: now, updatedAt: now, org: { id: 1, name: 'TurboVets' }, ownerUser: { id: 1 } },
      { id: 3, title: 'Refactor RBAC', description: 'guard', category: 'Work', status: 'in_progress', createdAt: now, updatedAt: now, org: { id: 2, name: 'TurboVets West' }, ownerUser: { id: 2 } },
    ] as any;

    comp.splitIntoColumns();
  });

  it('splits tasks into columns by status', () => {
    const [todo, doing, done] = comp.columns;
    expect(todo.items.map(t => t.id)).toEqual([1]);
    expect(doing.items.map(t => t.id)).toEqual([3]);
    expect(done.items.map(t => t.id)).toEqual([2]);
  });

  it('applies text filter to title/description', () => {
    comp.filter = 'rbac'; // matches description of id=3
    comp.splitIntoColumns();
    const [todo, doing, done] = comp.columns;
    expect(todo.items.length).toBe(0);
    expect(doing.items.map(t => t.id)).toEqual([3]);
    expect(done.items.length).toBe(0);
  });

  it('applies category filter', () => {
    comp.filter = '';
    comp.filterCategory = 'Work';
    comp.splitIntoColumns();
    const [todo, doing, done] = comp.columns;
    // Only Work remain: ids 1,3
    expect(todo.items.map(t => t.id)).toEqual([1]);
    expect(doing.items.map(t => t.id)).toEqual([3]);
    expect(done.items.length).toBe(0);
  });
});

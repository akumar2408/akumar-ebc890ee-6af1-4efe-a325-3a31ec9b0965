
export type RoleName = 'OWNER' | 'ADMIN' | 'VIEWER';

export interface Organization {
  id: number;
  name: string;
  parentId?: number | null;
}

export interface User {
  id: number;
  email: string;
  passwordHash: string;
}

export interface UserOrgRole {
  id: number;
  userId: number;
  orgId: number;
  role: RoleName;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  category?: 'Work' | 'Personal';
  status: 'todo' | 'in_progress' | 'done';
  orgId: number;
  ownerUserId: number;
}

export interface LoginResponse {
  accessToken: string;
}

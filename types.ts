import React from 'react';

export interface User {
  id: string;
  name: string;
  avatar: string;
  status?: string;
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  content: string;
  image?: string;
  timestamp: string;
  type: 'status' | 'photo' | 'comment';
  commentsCount: number;
}

export interface SidebarItem {
  id: string;
  icon: React.ReactNode;
  text: string;
  boldText?: string;
  action?: string;
}

export enum ViewState {
  LOGIN = 'LOGIN',
  HOME = 'HOME',
  PROFILE = 'PROFILE'
}
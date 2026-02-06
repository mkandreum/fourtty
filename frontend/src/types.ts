import React from 'react';

export interface User {
  id: number;
  email?: string;
  name: string;
  avatar: string;
  bio?: string; // status in frontend mapped to bio
  gender?: string;
  age?: number;
  relationshipStatus?: string;
  location?: string;
  occupation?: string;
  privacy?: string;
  createdAt?: string;
  _count?: {
    friendships?: number;
    posts?: number;
    photos?: number;
  };
}

export interface Post {
  id: number;
  userId: number;
  user: User;
  content: string;
  type: 'status' | 'photo' | 'comment' | 'video';
  image?: string;
  videoUrl?: string;
  createdAt: string;
  updatedAt?: string;
  comments?: Comment[];
  _count?: {
    comments: number;
  };
}

export interface Comment {
  id: number;
  postId: number;
  userId: number;
  user: User;
  content: string;
  createdAt: string;
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

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
}
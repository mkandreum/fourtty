import React from 'react';

export interface User {
  id: number;
  email?: string;
  name: string;
  lastName: string;
  avatar: string;
  bio?: string; // status in frontend mapped to bio
  gender?: string;
  age?: number;
  relationshipStatus?: string;
  location?: string;
  occupation?: string;
  privacy?: string;
  invitationsCount?: number;
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
  likedByMe?: boolean;
  _count?: {
    comments: number;
    likes?: number;
  };
}

export interface Photo {
  id: number;
  userId: number;
  user: User;
  url: string;
  caption?: string;
  createdAt: string;
  likedByMe?: boolean;
  photoTags?: any[];
  _count?: {
    likes?: number;
  };
}

export interface Comment {
  id: number;
  postId?: number;
  photoId?: number;
  userId: number;
  user: User;
  content: string;
  createdAt: string;
  likeCount?: number;
  isLiked?: boolean;
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
  PROFILE = 'PROFILE',
  PEOPLE = 'PEOPLE'
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
}
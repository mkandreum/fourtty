import React from 'react';
import { Post, User } from './types';

export const MOCK_USER: User = {
  id: 'me',
  name: 'Laura García',
  avatar: 'https://i.pravatar.cc/150?u=laura',
  status: 'Mañana empiezo 21 días sin Tuenti, primera entrada en el blog...'
};

export const MOCK_FRIENDS: User[] = [
  { id: '1', name: 'Francisco José', avatar: 'https://i.pravatar.cc/150?u=fran', status: 'En el centro' },
  { id: '2', name: 'María López', avatar: 'https://i.pravatar.cc/150?u=maria', status: 'Estudiando :(' },
  { id: '3', name: 'Alberto Ruiz', avatar: 'https://i.pravatar.cc/150?u=alberto', status: 'Finde genial!!' },
  { id: '4', name: 'Cristina M.', avatar: 'https://i.pravatar.cc/150?u=cris', status: 'Aburrida en casa' },
  { id: '5', name: 'Javi P.', avatar: 'https://i.pravatar.cc/150?u=javi' },
  { id: '6', name: 'Lucía R.', avatar: 'https://i.pravatar.cc/150?u=lucia' },
  { id: '7', name: 'Dani B.', avatar: 'https://i.pravatar.cc/150?u=dani' },
  { id: '8', name: 'Elena G.', avatar: 'https://i.pravatar.cc/150?u=elena' },
];

export const MOCK_FEED: Post[] = [
  {
    id: '101',
    userId: '1',
    user: MOCK_FRIENDS[0],
    content: 'ha subido 8 fotos etiquetadas en "Fiesta fin de curso"',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&q=80',
    timestamp: 'hoy, 09:51',
    type: 'photo',
    commentsCount: 8
  },
  {
    id: '102',
    userId: '2',
    user: MOCK_FRIENDS[1],
    content: 'ha comentado en tu estado: "Jajaja no te lo crees ni tú que aguantes 21 días!"',
    timestamp: 'ayer, 23:40',
    type: 'comment',
    commentsCount: 3
  },
  {
    id: '103',
    userId: '3',
    user: MOCK_FRIENDS[2],
    content: 'ha cambiado su estado: "Buscando plan para el sábado noche, alguien se apunta?"',
    timestamp: 'ayer, 18:20',
    type: 'status',
    commentsCount: 12
  },
  {
    id: '104',
    userId: '4',
    user: MOCK_FRIENDS[3],
    content: 'ha subido 3 fotos nuevas',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&q=80',
    timestamp: 'hace 2 días',
    type: 'photo',
    commentsCount: 5
  }
];

export const MOCK_REQUESTS = [
  { name: 'Marta Díaz', mutual: 12 },
  { name: 'Pedro J.', mutual: 3 },
  { name: 'Sofía L.', mutual: 5 },
];

export const LEFT_PANEL_DATA = {
  messages: 2,
  statusComments: 1,
  visits: 3,
  requests: 76,
  comments: 53,
  eventInvites: 37,
  gameInvites: 1,
  tags: 5,
  photoComments: 2,
  pageInvites: 2
};
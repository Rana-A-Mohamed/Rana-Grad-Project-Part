import type { ContactMessageView } from './contact.types.js';

export interface ContactMessageDto {
  id: string;
  name: string;
  email: string;
  subject: string;
  body: string;
  createdAt: Date;
}

/** Maps a ContactMessageView to the outbound DTO. Same shape for now. */
export function toDto(view: ContactMessageView): ContactMessageDto {
  return view;
}

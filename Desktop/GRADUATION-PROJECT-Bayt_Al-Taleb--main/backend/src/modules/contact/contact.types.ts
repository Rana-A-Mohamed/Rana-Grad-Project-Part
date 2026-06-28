/** Domain view of a contact message — returned by the repository. */
export interface ContactMessageView {
  id: string;
  name: string;
  email: string;
  subject: string;
  /** Maps to the `message` column in the DB (Prisma model field is `message`). */
  body: string;
  isHandled: boolean;
  createdAt: Date;
}

/** Data required to create a new contact message. */
export interface SubmitContactData {
  name: string;
  email: string;
  subject: string;
  body: string;
}
export interface ContactEntry {
  title: string;
  name: string;
  nameLanguage?: string;
  email: string;
}

export const contacts: ContactEntry[] = [
  { title: 'General Inquiries', name: 'Carly Markkanen', email: 'info@oldforestechoes.com' },
  { title: 'Director', name: 'Barbora Šilhánová', nameLanguage: 'cs', email: 'barbora@oldforestechoes.com' },
];

export const primaryEmail = contacts[0].email;

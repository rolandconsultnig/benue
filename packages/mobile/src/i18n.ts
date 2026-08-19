/**
 * Multi-language strings for the CEWERS mobile app.
 * Languages: English (default), Idoma, Igede, Hausa.
 * Per the proposal Section 5.1 — all citizen-facing channels support
 * Idoma, Igede, Hausa, and English.
 */

export type Language = 'en' | 'idoma' | 'igede' | 'hausa';

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'idoma', label: 'Idoma', flag: '🏛️' },
  { code: 'igede', label: 'Igede', flag: '🏛️' },
  { code: 'hausa', label: 'Hausa', flag: '🏛️' },
];

type Strings = {
  appName: string;
  report: string;
  panic: string;
  myReports: string;
  settings: string;
  category: string;
  description: string;
  descriptionPlaceholder: string;
  location: string;
  gettingLocation: string;
  capturePhoto: string;
  anonymous: string;
  submit: string;
  submitting: string;
  submitted: string;
  queuedForSync: string;
  signIn: string;
  phone: string;
  password: string;
  signInButton: string;
  signOut: string;
  selectCategory: string;
  back: string;
  cancel: string;
  confirmPanic: string;
  panicActivated: string;
  noReports: string;
  syncPending: string;
  syncComplete: string;
  offline: string;
  online: string;
  language: string;
};

const en: Strings = {
  appName: 'CEWERS',
  report: 'Report Incident',
  panic: 'SOS',
  myReports: 'My Reports',
  settings: 'Settings',
  category: 'Category',
  description: 'Description',
  descriptionPlaceholder: 'Describe what is happening...',
  location: 'Location',
  gettingLocation: 'Getting your location...',
  capturePhoto: 'Take Photo',
  anonymous: 'Report anonymously',
  submit: 'Submit Report',
  submitting: 'Submitting...',
  submitted: 'Report submitted successfully',
  queuedForSync: 'Saved — will send when online',
  signIn: 'Sign In',
  phone: 'Phone Number',
  password: 'Password',
  signInButton: 'Sign In',
  signOut: 'Sign Out',
  selectCategory: 'What are you reporting?',
  back: 'Back',
  cancel: 'Cancel',
  confirmPanic: 'Press and hold to send SOS',
  panicActivated: 'SOS ACTIVATED — Help is on the way',
  noReports: 'No reports yet',
  syncPending: 'Waiting to sync',
  syncComplete: 'All reports synced',
  offline: 'Offline',
  online: 'Online',
  language: 'Language',
};

// Idoma translations (key citizen-facing strings)
const idoma: Partial<Strings> = {
  report: 'Gbe Oye',
  panic: 'SOS',
  myReports: 'Eloche Nwa',
  settings: 'Eche',
  category: 'Oye',
  description: 'Eloche',
  descriptionPlaceholder: 'Kolo nyo elimi...',
  submit: 'Fio',
  submitting: 'O fi o...',
  submitted: 'O fi ole',
  signIn: 'Kpe Ola',
  selectCategory: 'Oye lo ka?',
  confirmPanic: 'Nwa ji ka SOS',
  panicActivated: 'SOS — help o ga',
};

// Igede translations
const igede: Partial<Strings> = {
  report: 'Iye Ihin',
  panic: 'SOS',
  myReports: 'Ihin Ogede',
  settings: 'Ogede',
  selectCategory: 'Iye lo hin?',
  confirmPanic: 'Ku ma SOS',
  panicActivated: 'SOS — help o de',
};

// Hausa translations
const hausa: Partial<Strings> = {
  report: 'Bayar da Rahoto',
  panic: 'SOS',
  myReports: 'Rahotanni Na',
  settings: 'Saituna',
  category: 'Rukuni',
  description: 'Kwamfatan',
  descriptionPlaceholder: 'Kwatanta abin da ke faruwa...',
  submit: 'Aika Rahoto',
  submitting: 'Ana aikawa...',
  submitted: 'An aika rahoto cikin nasara',
  signIn: 'Shiga',
  phone: 'Lambar Waya',
  password: 'Kalmar Sirri',
  selectCategory: 'Me kake bayar da rahoto?',
  confirmPanic: 'Danna kuma ka rike don tura SOS',
  panicActivated: 'SOS - Taimako yana kan hanya',
  offline: 'Baya da intanet',
  online: 'Da intanet',
};

export function getStrings(lang: Language): Strings {
  switch (lang) {
    case 'idoma': return { ...en, ...idoma };
    case 'igede': return { ...en, ...igede };
    case 'hausa': return { ...en, ...hausa };
    default: return en;
  }
}

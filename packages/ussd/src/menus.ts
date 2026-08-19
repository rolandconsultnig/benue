/**
 * USSD Menu Engine — multi-level interactive menu system.
 *
 * Works on ANY feature phone via USSD (no data plan needed).
 * The menu is driven by Africa's Talking's USSD callback format:
 *
 *   POST /ussd  body: { sessionId, phoneNumber, text, serviceCode }
 *
 * Response: "CON ..." (continue session) or "END ..." (end session)
 *
 * Flow:
 *   1. Language selection (en/idoma/igede/hausa)
 *   2. Main menu (Report / Track / Help)
 *   3. Category selection (15 categories in 2 pages)
 *   4. Description entry (free text)
 *   5. Confirmation → API submission
 */

import { CATEGORIES, Channel, type IncidentCategory, type CreateIncidentDto } from '@cewers/shared';

// ─── Session state ────────────────────────────────────────────────────────────

export interface UssdSession {
  sessionId: string;
  phoneNumber: string;
  language?: string;
  step: 'language' | 'main' | 'category' | 'category2' | 'description' | 'confirm' | 'done';
  selectedCategory?: IncidentCategory;
  description?: string;
}

// In-memory session store (production would use Redis)
const sessions = new Map<string, UssdSession>();

function getSession(sessionId: string, phoneNumber: string): UssdSession {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { sessionId, phoneNumber, step: 'language' });
  }
  return sessions.get(sessionId)!;
}

function endSession(sessionId: string) {
  sessions.delete(sessionId);
}

// ─── Menu text ─────────────────────────────────────────────────────────────────

const LANGUAGES = ['English', 'Idoma', 'Igede', 'Hausa'];

const STRINGS = {
  en: {
    welcome: 'CEWERS Benue South\nSelect language:',
    mainMenu: 'CEWERS\n1. Report Incident\n2. Track My Report\n3. Help',
    selectCategory: 'Select type:\n',
    nextPage: '\n0. Next page',
    enterDesc: 'Describe briefly (max 140 chars):',
    confirm: 'Submit this report?\n1. Yes\n2. Cancel',
    submitted: 'Report received. Your ref: ',
    cancelled: 'Report cancelled.',
    help: 'CEWERS: Call 112 for emergencies. Report incidents safely and anonymously.',
    invalid: 'Invalid option. Try again.',
  },
};

function t(lang?: string) {
  return STRINGS[lang as keyof typeof STRINGS] || STRINGS.en;
}

// ─── USSD handler ─────────────────────────────────────────────────────────────

export type UssdResponse = { action: 'CON' | 'END'; text: string };
export type IncidentSubmitter = (dto: CreateIncidentDto, phone: string) => Promise<{ reference: string }>;

export async function handleUssd(
  body: { sessionId: string; phoneNumber: string; text: string; serviceCode: string },
  submitIncident: IncidentSubmitter,
): Promise<UssdResponse> {
  const session = getSession(body.sessionId, body.phoneNumber);
  const input = body.text.trim();

  // USSD sends the full accumulated text (e.g. "1*3*2"), so we split on *
  const steps = input ? input.split('*') : [];
  const lastStep = steps[steps.length - 1] || '';

  // ─── Step: Language selection ──────────────────────────────────────────────
  if (session.step === 'language') {
    if (steps.length === 0) {
      let menu = t().welcome;
      LANGUAGES.forEach((l, i) => (menu += `\n${i + 1}. ${l}`));
      return { action: 'CON', text: menu };
    }
    const langIdx = parseInt(lastStep);
    session.language = LANGUAGES[langIdx - 1]?.toLowerCase() || 'en';
    session.step = 'main';
    // Fall through to main menu
  }

  // ─── Step: Main menu ─────────────────────────────────────────────────────────
  if (session.step === 'main') {
    if (steps.length <= 1 && steps[0] !== '') {
      // User just selected language, now show main menu
      // OR user selected an option from main menu
    }
    const mainSelection = steps.length === 1 ? null : steps[1];

    if (!mainSelection) {
      return { action: 'CON', text: t(session.language).mainMenu };
    }

    if (mainSelection === '1') {
      session.step = 'category';
      // Show first 8 categories
      let menu = t(session.language).selectCategory;
      CATEGORIES.slice(0, 8).forEach((c, i) => (menu += `${i + 1}. ${c.label}\n`));
      menu += t(session.language).nextPage;
      return { action: 'CON', text: menu };
    }

    if (mainSelection === '2') {
      endSession(body.sessionId);
      return { action: 'END', text: 'Track: Enter your reference number (e.g. CEW-2024-00001) via SMS to shortcode.' };
    }

    if (mainSelection === '3') {
      endSession(body.sessionId);
      return { action: 'END', text: t(session.language).help };
    }

    return { action: 'CON', text: `${t(session.language).invalid}\n${t(session.language).mainMenu}` };
  }

  // ─── Step: Category selection ────────────────────────────────────────────────
  if (session.step === 'category') {
    const catIdx = parseInt(lastStep);

    if (lastStep === '0') {
      // Next page
      session.step = 'category2';
      let menu = 'More types:\n';
      CATEGORIES.slice(8).forEach((c, i) => (menu += `${i + 1}. ${c.label}\n`));
      menu += '\n0. Back';
      return { action: 'CON', text: menu };
    }

    if (catIdx >= 1 && catIdx <= 8) {
      session.selectedCategory = CATEGORIES[catIdx - 1].value;
      session.step = 'description';
      return { action: 'CON', text: t(session.language).enterDesc };
    }

    return { action: 'CON', text: `${t(session.language).invalid}\n${t(session.language).selectCategory}` };
  }

  // ─── Step: Category page 2 ─────────────────────────────────────────────────
  if (session.step === 'category2') {
    const catIdx = parseInt(lastStep);

    if (lastStep === '0') {
      session.step = 'category';
      let menu = t(session.language).selectCategory;
      CATEGORIES.slice(0, 8).forEach((c, i) => (menu += `${i + 1}. ${c.label}\n`));
      menu += t(session.language).nextPage;
      return { action: 'CON', text: menu };
    }

    if (catIdx >= 1 && catIdx <= 7) {
      session.selectedCategory = CATEGORIES[catIdx + 7].value;
      session.step = 'description';
      return { action: 'CON', text: t(session.language).enterDesc };
    }

    return { action: 'CON', text: `${t(session.language).invalid}\nMore types:` };
  }

  // ─── Step: Description entry ─────────────────────────────────────────────────
  if (session.step === 'description') {
    if (!lastStep || lastStep.length < 3) {
      return { action: 'CON', text: 'Too short. Enter at least 3 characters:' };
    }
    session.description = lastStep;
    session.step = 'confirm';

    const cat = CATEGORIES.find((c) => c.value === session.selectedCategory);
    return {
      action: 'CON',
      text: `${t(session.language).confirm}\n\nType: ${cat?.label}\nDesc: ${session.description?.slice(0, 60)}...`,
    };
  }

  // ─── Step: Confirm ─────────────────────────────────────────────────────────
  if (session.step === 'confirm') {
    if (lastStep === '1') {
      // Submit
      try {
        const dto: CreateIncidentDto = {
          category: session.selectedCategory!,
          description: session.description!,
          geo: { lng: 8.05, lat: 7.2 }, // Default to Benue South centroid (USSD has no GPS)
          channel: Channel.USSD,
          anonymous: true, // USSD reports are anonymous by default
        };
        const result = await submitIncident(dto, body.phoneNumber);
        endSession(body.sessionId);
        return { action: 'END', text: `${t(session.language).submitted}${result.reference}` };
      } catch {
        endSession(body.sessionId);
        return { action: 'END', text: 'Error submitting. Please try again or call 112.' };
      }
    } else {
      endSession(body.sessionId);
      return { action: 'END', text: t(session.language).cancelled };
    }
  }

  // Fallback
  endSession(body.sessionId);
  return { action: 'END', text: 'Session ended.' };
}

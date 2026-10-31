export type Role = 'user' | 'admin';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  photoURL?: string | null;
  role: Role;
  createdAt: number;
}

export type SeasonType = 'summer' | 'winter';

export interface Season {
  id: string;
  name: string;
  type: SeasonType;
  active: boolean;
  startedAt: number;
  endedAt?: number | null;
}

export interface Team {
  id: string;
  name: string;
  /** Points earned by the team; every player in the team gets them. */
  points: number;
  playerIds: string[];
}

export interface EventSummary {
  /** Snapshot of who attended, saved when the event is finished. */
  attendees: { id: string; name: string; uid: string | null }[];
  /** Final points per attendee id (team points + adjustment). */
  points: Record<string, number>;
}

export interface FootballEvent {
  id: string;
  seasonId: string;
  startsAt: number;
  location: string;
  note?: string;
  status: 'open' | 'finished';
  createdBy: string;
  createdAt: number;
  teams?: Team[];
  /** Per-attendee bonus (+) or penalty (−). */
  adjustments?: Record<string, number>;
  summary?: EventSummary | null;
  finishedAt?: number | null;
}

export interface Attendee {
  id: string;
  kind: 'user' | 'guest';
  /** For users: their uid. For guests: null. */
  uid: string | null;
  name: string;
  photoURL?: string | null;
  /** Who added the attendee (the user themself, or the host of a guest). */
  addedBy: string;
  addedByName: string;
  createdAt: number;
}

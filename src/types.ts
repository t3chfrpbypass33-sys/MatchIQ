/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Team {
  id: string;
  name: string;
  flag: string; // Emoji flags like 🇫🇷, 🇧🇷, 🇺🇸, etc.
  fifaRank: number;
  recentForm: ('W' | 'D' | 'L')[];
  group: string;
  logoColor: string; // CSS color or hex representing team color
  crest?: string;
}

export interface Player {
  id: string;
  name: string;
  position: 'Gardien' | 'Défenseur' | 'Milieu' | 'Attaquant';
  teamId: string;
  goalsSeason: number;
  assistsSeason: number;
  status: 'probable' | 'injured' | 'suspended' | 'doubtful';
}

export interface Stadium {
  name: string;
  city: string;
  country: 'USA' | 'Mexique' | 'Canada';
  capacity: number;
  surface: string;
  gps: { lat: number; lng: number };
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  stadium: Stadium;
  group: string;
  status: 'upcoming' | 'live' | 'completed';
  score: {
    home: number;
    away: number;
  } | null;
  minute?: number | string; // Only if live
}

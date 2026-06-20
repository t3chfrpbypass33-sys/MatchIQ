/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Match, Team, Player, Stadium } from './types';

export const teams: { [key: string]: Team } = {
  FRA: {
    id: 'FRA',
    name: 'France',
    flag: '🇫🇷',
    fifaRank: 2,
    recentForm: ['W', 'W', 'D', 'W', 'L'],
    group: 'Group A',
    logoColor: 'from-blue-600 to-indigo-800'
  },
  BRA: {
    id: 'BRA',
    name: 'Brésil',
    flag: '🇧🇷',
    fifaRank: 5,
    recentForm: ['W', 'D', 'W', 'W', 'W'],
    group: 'Group C',
    logoColor: 'from-yellow-500 to-green-600'
  },
  ARG: {
    id: 'ARG',
    name: 'Argentine',
    flag: '🇦🇷',
    fifaRank: 1,
    recentForm: ['W', 'W', 'W', 'L', 'W'],
    group: 'Group B',
    logoColor: 'from-sky-400 to-blue-600'
  },
  GER: {
    id: 'GER',
    name: 'Allemagne',
    flag: '🇩🇪',
    fifaRank: 11,
    recentForm: ['D', 'W', 'W', 'L', 'W'],
    group: 'Group D',
    logoColor: 'from-neutral-800 to-neutral-600'
  },
  ESP: {
    id: 'ESP',
    name: 'Espagne',
    flag: '🇪🇸',
    fifaRank: 3,
    recentForm: ['W', 'W', 'D', 'W', 'W'],
    group: 'Group E',
    logoColor: 'from-red-600 to-yellow-500'
  },
  ENG: {
    id: 'ENG',
    name: 'Angleterre',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    fifaRank: 4,
    recentForm: ['W', 'L', 'W', 'D', 'W'],
    group: 'Group F',
    logoColor: 'from-slate-200 to-blue-800'
  },
  POR: {
    id: 'POR',
    name: 'Portugal',
    flag: '🇵🇹',
    fifaRank: 7,
    recentForm: ['W', 'W', 'L', 'W', 'W'],
    group: 'Group D',
    logoColor: 'from-red-700 to-green-700'
  },
  USA: {
    id: 'USA',
    name: 'États-Unis',
    flag: '🇺🇸',
    fifaRank: 16,
    recentForm: ['W', 'D', 'L', 'W', 'D'],
    group: 'Group A',
    logoColor: 'from-blue-800 to-red-650'
  },
  MEX: {
    id: 'MEX',
    name: 'Mexique',
    flag: '🇲🇽',
    fifaRank: 15,
    recentForm: ['D', 'W', 'L', 'W', 'W'],
    group: 'Group B',
    logoColor: 'from-green-700 to-red-600'
  },
  CAN: {
    id: 'CAN',
    name: 'Canada',
    flag: '🇨🇦',
    fifaRank: 38,
    recentForm: ['L', 'W', 'D', 'W', 'L'],
    group: 'Group C',
    logoColor: 'from-red-600 to-rose-700'
  }
};

export const stadiums: { [key: string]: Stadium } = {
  METLIFE: {
    name: 'MetLife Stadium',
    city: 'East Rutherford (New York)',
    country: 'USA',
    capacity: 82500,
    surface: 'Pelouse Artificielle',
    gps: { lat: 40.8135, lng: -74.0745 }
  },
  SOFI: {
    name: 'SoFi Stadium',
    city: 'Inglewood (Los Angeles)',
    country: 'USA',
    capacity: 70240,
    surface: 'Pelouse Artificielle',
    gps: { lat: 33.9534, lng: -118.3392 }
  },
  AZTECA: {
    name: 'Estadio Azteca',
    city: 'Mexico City',
    country: 'Mexique',
    capacity: 87523,
    surface: 'Pelouse Naturelle',
    gps: { lat: 19.3029, lng: -99.1505 }
  },
  BC_PLACE: {
    name: 'BC Place',
    city: 'Vancouver',
    country: 'Canada',
    capacity: 54500,
    surface: 'Pelouse Artificielle',
    gps: { lat: 49.2768, lng: -123.1120 }
  },
  MERCEDES: {
    name: 'Mercedes-Benz Stadium',
    city: 'Atlanta',
    country: 'USA',
    capacity: 71000,
    surface: 'Pelouse Artificielle',
    gps: { lat: 33.7573, lng: -84.4010 }
  },
  HARD_ROCK: {
    name: 'Hard Rock Stadium',
    city: 'Miami',
    country: 'USA',
    capacity: 65326,
    surface: 'Pelouse Naturelle',
    gps: { lat: 25.9580, lng: -80.2389 }
  },
  AKRON: {
    name: 'Estadio Akron',
    city: 'Guadalajara',
    country: 'Mexique',
    capacity: 48070,
    surface: 'Pelouse Naturelle',
    gps: { lat: 20.6811, lng: -103.4626 }
  },
  BMO_FIELD: {
    name: 'BMO Field',
    city: 'Toronto',
    country: 'Canada',
    capacity: 30000,
    surface: 'Pelouse Hybride',
    gps: { lat: 43.6328, lng: -79.4186 }
  }
};

export const players: Player[] = [
  // France
  { id: 'f1', name: 'Kylian Mbappé', position: 'Attaquant', teamId: 'FRA', goalsSeason: 44, assistsSeason: 15, status: 'probable' },
  { id: 'f2', name: 'Antoine Griezmann', position: 'Milieu', teamId: 'FRA', goalsSeason: 16, assistsSeason: 12, status: 'probable' },
  { id: 'f3', name: 'Aurélien Tchouaméni', position: 'Milieu', teamId: 'FRA', goalsSeason: 4, assistsSeason: 3, status: 'doubtful' },
  { id: 'f4', name: 'William Saliba', position: 'Défenseur', teamId: 'FRA', goalsSeason: 2, assistsSeason: 1, status: 'probable' },
  { id: 'f5', name: 'Mike Maignan', position: 'Gardien', teamId: 'FRA', goalsSeason: 0, assistsSeason: 0, status: 'probable' },
  { id: 'f6', name: 'Lucas Hernandez', position: 'Défenseur', teamId: 'FRA', goalsSeason: 1, assistsSeason: 2, status: 'injured' },

  // Brésil
  { id: 'b1', name: 'Vinícius Júnior', position: 'Attaquant', teamId: 'BRA', goalsSeason: 26, assistsSeason: 11, status: 'probable' },
  { id: 'b2', name: 'Rodrygo', position: 'Attaquant', teamId: 'BRA', goalsSeason: 17, assistsSeason: 9, status: 'probable' },
  { id: 'b3', name: 'Bruno Guimarães', position: 'Milieu', teamId: 'BRA', goalsSeason: 7, assistsSeason: 8, status: 'probable' },
  { id: 'b4', name: 'Neymar Jr', position: 'Milieu', teamId: 'BRA', goalsSeason: 5, assistsSeason: 4, status: 'injured' },
  { id: 'b5', name: 'Marquinhos', position: 'Défenseur', teamId: 'BRA', goalsSeason: 3, assistsSeason: 1, status: 'probable' },
  { id: 'b6', name: 'Alisson Becker', position: 'Gardien', teamId: 'BRA', goalsSeason: 0, assistsSeason: 0, status: 'doubtful' },

  // Argentine
  { id: 'a1', name: 'Lionel Messi', position: 'Attaquant', teamId: 'ARG', goalsSeason: 25, assistsSeason: 18, status: 'probable' },
  { id: 'a2', name: 'Lautaro Martínez', position: 'Attaquant', teamId: 'ARG', goalsSeason: 28, assistsSeason: 6, status: 'probable' },
  { id: 'a3', name: 'Alexis Mac Allister', position: 'Milieu', teamId: 'ARG', goalsSeason: 9, assistsSeason: 7, status: 'probable' },
  { id: 'a4', name: 'Enzo Fernández', position: 'Milieu', teamId: 'ARG', goalsSeason: 7, assistsSeason: 5, status: 'doubtful' },
  { id: 'a5', name: 'Cristian Romero', position: 'Défenseur', teamId: 'ARG', goalsSeason: 3, assistsSeason: 0, status: 'probable' },
  { id: 'a6', name: 'Emiliano Martínez', position: 'Gardien', teamId: 'ARG', goalsSeason: 0, assistsSeason: 0, status: 'probable' },

  // États-Unis
  { id: 'u1', name: 'Christian Pulisic', position: 'Attaquant', teamId: 'USA', goalsSeason: 15, assistsSeason: 10, status: 'probable' },
  { id: 'u2', name: 'Folarin Balogun', position: 'Attaquant', teamId: 'USA', goalsSeason: 12, assistsSeason: 4, status: 'probable' },
  { id: 'u3', name: 'Weston McKennie', position: 'Milieu', teamId: 'USA', goalsSeason: 3, assistsSeason: 8, status: 'probable' },
  { id: 'u4', name: 'Tyler Adams', position: 'Milieu', teamId: 'USA', goalsSeason: 1, assistsSeason: 2, status: 'suspended' },
  { id: 'u5', name: 'Antonee Robinson', position: 'Défenseur', teamId: 'USA', goalsSeason: 2, assistsSeason: 6, status: 'probable' },

  // Mexique
  { id: 'm1', name: 'Santiago Giménez', position: 'Attaquant', teamId: 'MEX', goalsSeason: 22, assistsSeason: 5, status: 'probable' },
  { id: 'm2', name: 'Edson Álvarez', position: 'Milieu', teamId: 'MEX', goalsSeason: 4, assistsSeason: 3, status: 'probable' },
  { id: 'm3', name: 'Hirving Lozano', position: 'Attaquant', teamId: 'MEX', goalsSeason: 10, assistsSeason: 6, status: 'doubtful' },
  { id: 'm4', name: 'César Montes', position: 'Défenseur', teamId: 'MEX', goalsSeason: 2, assistsSeason: 1, status: 'probable' },

  // Canada
  { id: 'c1', name: 'Jonathan David', position: 'Attaquant', teamId: 'CAN', goalsSeason: 26, assistsSeason: 7, status: 'probable' },
  { id: 'c2', name: 'Alphonso Davies', position: 'Défenseur', teamId: 'CAN', goalsSeason: 6, assistsSeason: 12, status: 'probable' },
  { id: 'c3', name: 'Stephen Eustáquio', position: 'Milieu', teamId: 'CAN', goalsSeason: 5, assistsSeason: 4, status: 'probable' },
  { id: 'c4', name: 'Tajon Buchanan', position: 'Attaquant', teamId: 'CAN', goalsSeason: 4, assistsSeason: 3, status: 'injured' }
];

// Generates simulated match analysis details or specific sections for visual placeholders
export interface MatchDetailsPlaceholder {
  h2h: {
    totalPlayed: number;
    homeWins: number;
    awayWins: number;
    draws: number;
    lastMatches: { date: string; score: string; winner: string }[];
  };
  weather: {
    temp: number;
    condition: string;
    humidity: number;
    wind: string;
  };
  prediction: {
    homeWinPct: number;
    drawPct: number;
    awayWinPct: number;
    aiKeyInsight: string;
  };
}

export const matchDetailsData: { [matchId: string]: MatchDetailsPlaceholder } = {
  'm-1': {
    h2h: {
      totalPlayed: 8,
      homeWins: 3,
      awayWins: 4,
      draws: 1,
      lastMatches: [
        { date: '18/12/2022', score: 'Arg 3-3 Fra (Pens 4-2)', winner: 'Argentine' },
        { date: '30/06/2018', score: 'Fra 4-3 Arg', winner: 'France' },
        { date: '11/02/2009', score: 'Fra 0-2 Arg', winner: 'Argentine' }
      ]
    },
    weather: { temp: 24, condition: 'Dégagé', humidity: 45, wind: '12 km/h' },
    prediction: { homeWinPct: 40, drawPct: 30, awayWinPct: 30, aiKeyInsight: "Le retour d'un classique de la Coupe du Monde. La France cherche sa revanche de 2022." }
  },
  'm-2': {
    h2h: {
      totalPlayed: 4,
      homeWins: 1,
      awayWins: 2,
      draws: 1,
      lastMatches: [
        { date: '27/11/2022', score: 'Esp 1-1 Ger', winner: 'Nul' },
        { date: '17/11/2020', score: 'Esp 6-0 Ger', winner: 'Espagne' }
      ]
    },
    weather: { temp: 18, condition: 'Couvert', humidity: 70, wind: '15 km/h' },
    prediction: { homeWinPct: 38, drawPct: 28, awayWinPct: 34, aiKeyInsight: "L'Espagne domine historiquement les dernières confrontations en compétition officielle." }
  },
  'm-3': {
    h2h: {
      totalPlayed: 12,
      homeWins: 7,
      awayWins: 2,
      draws: 3,
      lastMatches: [
        { date: '05/03/2024', score: 'Mex 0-2 Usa', winner: 'États-Unis' },
        { date: '16/06/2023', score: 'Usa 3-0 Mex', winner: 'États-Unis' }
      ]
    },
    weather: { temp: 28, condition: 'Ensoleillé', humidity: 40, wind: '8 km/h' },
    prediction: { homeWinPct: 45, drawPct: 35, awayWinPct: 20, aiKeyInsight: "Le 'Clásico' de la CONCACAF sous haute tension dans un Estadio Azteca bouillant." }
  },
  'm-4': {
    h2h: {
      totalPlayed: 3,
      homeWins: 2,
      awayWins: 0,
      draws: 1,
      lastMatches: [
        { date: '12/10/2023', score: 'Bra 1-1 Can', winner: 'Nul' }
      ]
    },
    weather: { temp: 16, condition: 'Pluie faible', humidity: 85, wind: '22 km/h' },
    prediction: { homeWinPct: 65, drawPct: 20, awayWinPct: 15, aiKeyInsight: "Le Brésil est largement favori mais le Canada est redoutable sur terrain humide de Vancouver." }
  }
};

// Generates 8 realistic matches scheduled for World Cup 2026.
// Grouped nicely across the next week (using local time 2026-06-19 / 20).
// Match statuses: combination of live, upcoming, completed
export const matches: Match[] = [
  {
    id: 'm-1',
    homeTeam: teams.ARG,
    awayTeam: teams.FRA,
    date: '2026-06-20',
    time: '18:00',
    stadium: stadiums.SOFI,
    group: 'Group B',
    status: 'live',
    score: { home: 2, away: 1 },
    minute: 68
  },
  {
    id: 'm-2',
    homeTeam: teams.ESP,
    awayTeam: teams.GER,
    date: '2026-06-21',
    time: '21:00',
    stadium: stadiums.METLIFE,
    group: 'Group E',
    status: 'upcoming',
    score: null
  },
  {
    id: 'm-3',
    homeTeam: teams.USA,
    awayTeam: teams.MEX,
    date: '2026-06-22',
    time: '20:00',
    stadium: stadiums.AZTECA,
    group: 'Group A',
    status: 'upcoming',
    score: null
  },
  {
    id: 'm-4',
    homeTeam: teams.BRA,
    awayTeam: teams.CAN,
    date: '2026-06-23',
    time: '19:30',
    stadium: stadiums.BC_PLACE,
    group: 'Group C',
    status: 'upcoming',
    score: null
  },
  {
    id: 'm-5',
    homeTeam: teams.ENG,
    awayTeam: teams.POR,
    date: '2026-06-24',
    time: '17:00',
    stadium: stadiums.MERCEDES,
    group: 'Group F',
    status: 'upcoming',
    score: null
  },
  {
    id: 'm-6',
    homeTeam: teams.FRA,
    awayTeam: teams.USA,
    date: '2026-06-25',
    time: '15:00',
    stadium: stadiums.HARD_ROCK,
    group: 'Group A',
    status: 'upcoming',
    score: null
  },
  {
    id: 'm-7',
    homeTeam: teams.MEX,
    awayTeam: teams.GER,
    date: '2026-06-26',
    time: '18:00',
    stadium: stadiums.AKRON,
    group: 'Group D',
    status: 'upcoming',
    score: null
  },
  {
    id: 'm-8',
    homeTeam: teams.ARG,
    awayTeam: teams.CAN,
    date: '2026-06-19', // completed yesterday / earlier today
    time: '20:00',
    stadium: stadiums.BMO_FIELD,
    group: 'Group C',
    status: 'completed',
    score: { home: 3, away: 1 }
  }
];

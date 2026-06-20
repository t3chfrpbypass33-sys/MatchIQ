import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Token definitions - prioritize BSD_API_KEY secret, fallback to default if not defined
const bsdApiKeyDetected = !!process.env.BSD_API_KEY;
if (bsdApiKeyDetected) {
  console.log("✅ Success: BSD_API_KEY successfully detected in server environment.");
} else {
  console.warn("⚠️ Warning: BSD_API_KEY not found in server env variables. Using hardcoded token.");
}
const BSD_TOKEN = process.env.BSD_API_KEY || "8851391eaade2e6388777a5f27a5b3f5747d6882";

// Server-side cache for match details and lists
interface CacheEntry {
  data: any;
  timestamp: number;
}
const cacheMap: { [key: string]: CacheEntry } = {};
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Safe endpoint caller helper
async function fetchWithBsdAuth(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Token ${BSD_TOKEN}`,
        'Accept': 'application/json'
      }
    });
    if (!res.ok) {
      console.warn(`BSD API error on fetch ${url}: ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`Fetch failure on BSD URL ${url}:`, err);
    return null;
  }
}

// Map of our m-IDs to discovered BSD events
const MATCH_MAPPINGS: { [key: string]: number } = {
  "m-2": 209239, // Spain vs Germany (Euros 2024)
  "m-3": 209411, // USA vs Mexico (Gold Cup 2025)
  "m-7": 190233, // Germany vs Mexico (World Cup 2018)
  "m-8": 209274, // Argentina vs Canada (Copa America 2024)
};

// Weather fetcher with OpenWeather API
async function fetchWeather(city: string, lat: number, lng: number) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.log("No OPENWEATHER_API_KEY environment variable found. Falling back to default.");
    return null;
  }
  
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&lang=fr`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`OpenWeather returned error for ${city}: ${res.status}`);
      return null;
    }
    const data = await res.json();
    return {
      temp: Math.round(data.main?.temp ?? 22),
      condition: data.weather?.[0]?.description ?? "Dégagé",
      humidity: data.main?.humidity ?? 50,
      wind: `${Math.round((data.wind?.speed ?? 3) * 3.6)} km/h`,
      icon: data.weather?.[0]?.icon ?? "01d"
    };
  } catch (err) {
    console.error("Failed to fetch from OpenWeather:", err);
    return null;
  }
}

// ----------------------------------------------------
// API ROUTES First
// ----------------------------------------------------

// Endpoint to fetch list of matches (augmented with live updates from BSD if available)
app.get("/api/matches", async (req, res) => {
  try {
    const cacheKey = "matches_list";
    const now = Date.now();
    
    if (cacheMap[cacheKey] && (now - cacheMap[cacheKey].timestamp < CACHE_TTL_MS)) {
      return res.json(cacheMap[cacheKey].data);
    }

    // Pull events from BSD to see if we have any active or fresh live statuses
    const listData = await fetchWithBsdAuth("https://sports.bzzoiro.com/api/v2/events/?limit=50");
    const bsdEvents = listData?.results || [];

    // We will return a static list but augment any matching scores/statuses beautifully
    const baseMatches = [
      {
        id: 'm-1',
        homeTeam: { id: 'ARG', name: 'Argentine', flag: '🇦🇷', fifaRank: 1, recentForm: ['W', 'W', 'W', 'L', 'W'], group: 'Group B', logoColor: 'from-sky-400 to-blue-600' },
        awayTeam: { id: 'FRA', name: 'France', flag: '🇫🇷', fifaRank: 2, recentForm: ['W', 'W', 'D', 'W', 'L'], group: 'Group A', logoColor: 'from-blue-600 to-indigo-800' },
        date: '2026-06-20',
        time: '18:00',
        stadium: { name: 'SoFi Stadium', city: 'Inglewood (Los Angeles)', country: 'USA', capacity: 70240, surface: 'Pelouse Artificielle', gps: { lat: 33.9534, lng: -118.3392 } },
        group: 'Group B',
        status: 'live',
        score: { home: 2, away: 1 },
        minute: 68
      },
      {
        id: 'm-2',
        homeTeam: { id: 'ESP', name: 'Espagne', flag: '🇪🇸', fifaRank: 3, recentForm: ['W', 'W', 'D', 'W', 'W'], group: 'Group E', logoColor: 'from-red-650 to-yellow-500' },
        awayTeam: { id: 'GER', name: 'Allemagne', flag: '🇩🇪', fifaRank: 11, recentForm: ['D', 'W', 'W', 'L', 'W'], group: 'Group D', logoColor: 'from-neutral-800 to-neutral-600' },
        date: '2026-06-21',
        time: '21:00',
        stadium: { name: 'MetLife Stadium', city: 'East Rutherford (New York)', country: 'USA', capacity: 82500, surface: 'Pelouse Artificielle', gps: { lat: 40.8135, lng: -74.0745 } },
        group: 'Group E',
        status: 'upcoming',
        score: null
      },
      {
        id: 'm-3',
        homeTeam: { id: 'USA', name: 'États-Unis', flag: '🇺🇸', fifaRank: 16, recentForm: ['W', 'D', 'L', 'W', 'D'], group: 'Group A', logoColor: 'from-blue-800 to-red-600' },
        awayTeam: { id: 'MEX', name: 'Mexique', flag: '🇲🇽', fifaRank: 15, recentForm: ['D', 'W', 'L', 'W', 'W'], group: 'Group B', logoColor: 'from-green-700 to-red-600' },
        date: '2026-06-22',
        time: '20:00',
        stadium: { name: 'Estadio Azteca', city: 'Mexico City', country: 'Mexique', capacity: 87523, surface: 'Pelouse Naturelle', gps: { lat: 19.3029, lng: -99.1505 } },
        group: 'Group A',
        status: 'upcoming',
        score: null
      },
      {
        id: 'm-4',
        homeTeam: { id: 'BRA', name: 'Brésil', flag: '🇧🇷', fifaRank: 5, recentForm: ['W', 'D', 'W', 'W', 'W'], group: 'Group C', logoColor: 'from-yellow-500 to-green-600' },
        awayTeam: { id: 'CAN', name: 'Canada', flag: '🇨🇦', fifaRank: 38, recentForm: ['L', 'W', 'D', 'W', 'L'], group: 'Group C', logoColor: 'from-red-600 to-rose-700' },
        date: '2026-06-23',
        time: '19:30',
        stadium: { name: 'BC Place', city: 'Vancouver', country: 'Canada', capacity: 54500, surface: 'Pelouse Artificielle', gps: { lat: 49.2768, lng: -123.1120 } },
        group: 'Group C',
        status: 'upcoming',
        score: null
      },
      {
        id: 'm-5',
        homeTeam: { id: 'ENG', name: 'Angleterre', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', fifaRank: 4, recentForm: ['W', 'L', 'W', 'D', 'W'], group: 'Group F', logoColor: 'from-slate-200 to-blue-800' },
        awayTeam: { id: 'POR', name: 'Portugal', flag: '🇵🇹', fifaRank: 7, recentForm: ['W', 'W', 'L', 'W', 'W'], group: 'Group D', logoColor: 'from-red-700 to-green-700' },
        date: '2026-06-24',
        time: '17:00',
        stadium: { name: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'USA', capacity: 71000, surface: 'Pelouse Artificielle', gps: { lat: 33.7573, lng: -84.4010 } },
        group: 'Group F',
        status: 'upcoming',
        score: null
      },
      {
        id: 'm-6',
        homeTeam: { id: 'FRA', name: 'France', flag: '🇫🇷', fifaRank: 2, recentForm: ['W', 'W', 'D', 'W', 'L'], group: 'Group A', logoColor: 'from-blue-600 to-indigo-800' },
        awayTeam: { id: 'USA', name: 'États-Unis', flag: '🇺🇸', fifaRank: 16, recentForm: ['W', 'D', 'L', 'W', 'D'], group: 'Group A', logoColor: 'from-blue-800 to-red-650' },
        date: '2026-06-25',
        time: '15:00',
        stadium: { name: 'Hard Rock Stadium', city: 'Miami', country: 'USA', capacity: 65326, surface: 'Pelouse Naturelle', gps: { lat: 25.9580, lng: -80.2389 } },
        group: 'Group A',
        status: 'upcoming',
        score: null
      },
      {
        id: 'm-7',
        homeTeam: { id: 'MEX', name: 'Mexique', flag: '🇲🇽', fifaRank: 15, recentForm: ['D', 'W', 'L', 'W', 'W'], group: 'Group B', logoColor: 'from-green-700 to-red-600' },
        awayTeam: { id: 'GER', name: 'Allemagne', flag: '🇩🇪', fifaRank: 11, recentForm: ['D', 'W', 'W', 'L', 'W'], group: 'Group D', logoColor: 'from-neutral-800 to-neutral-600' },
        date: '2026-06-26',
        time: '18:00',
        stadium: { name: 'Estadio Akron', city: 'Guadalajara', country: 'Mexique', capacity: 48070, surface: 'Pelouse Naturelle', gps: { lat: 20.6811, lng: -103.4626 } },
        group: 'Group D',
        status: 'upcoming',
        score: null
      },
      {
        id: 'm-8',
        homeTeam: { id: 'ARG', name: 'Argentine', flag: '🇦🇷', fifaRank: 1, recentForm: ['W', 'W', 'W', 'L', 'W'], group: 'Group B', logoColor: 'from-sky-400 to-blue-600' },
        awayTeam: { id: 'CAN', name: 'Canada', flag: '🇨🇦', fifaRank: 38, recentForm: ['L', 'W', 'D', 'W', 'L'], group: 'Group C', logoColor: 'from-red-600 to-rose-700' },
        date: '2026-06-19',
        time: '20:00',
        stadium: { name: 'BMO Field', city: 'Toronto', country: 'Canada', capacity: 30000, surface: 'Pelouse Hybride', gps: { lat: 43.6328, lng: -79.4186 } },
        group: 'Group C',
        status: 'completed',
        score: { home: 3, away: 1 }
      }
    ];

    // For any match in our mappings, let's overlay actual current score and status from BSD
    for (const match of baseMatches) {
      const bsdId = MATCH_MAPPINGS[match.id];
      if (bsdId) {
        const foundBsd = bsdEvents.find((e: any) => e.id === bsdId);
        if (foundBsd) {
          if (foundBsd.status === "inprogress") {
            match.status = "live";
            match.minute = foundBsd.current_minute ?? 45;
          } else if (foundBsd.status === "finished") {
            match.status = "completed";
          }
          if (foundBsd.home_score !== null && foundBsd.away_score !== null) {
            match.score = {
              home: foundBsd.home_score,
              away: foundBsd.away_score
            };
          }
        }
      }
    }

    cacheMap[cacheKey] = { data: baseMatches, timestamp: now };
    return res.json(baseMatches);
  } catch (err) {
    console.error("Failed to load listings:", err);
    res.status(500).json({ error: "Failed to reload matches list" });
  }
});

// Endpoint to fetch specific details of a match (lineups, unavailable, weather, h2h, predictions)
app.get("/api/match-data/:matchId", async (req, res) => {
  try {
    const { matchId } = req.params;
    const cacheKey = `match_detail_${matchId}`;
    const now = Date.now();
    
    if (cacheMap[cacheKey] && (now - cacheMap[cacheKey].timestamp < CACHE_TTL_MS)) {
      return res.json(cacheMap[cacheKey].data);
    }

    // Static mapping or simulated default state in case BSD has no data
    const STADIUM_COORDS: { [key: string]: { lat: number; lng: number, city: string } } = {
      'm-1': { lat: 33.9534, lng: -118.3392, city: 'Los Angeles' },
      'm-2': { lat: 40.8135, lng: -74.0745, city: 'East Rutherford' },
      'm-3': { lat: 19.3029, lng: -99.1505, city: 'Mexico City' },
      'm-4': { lat: 49.2768, lng: -123.1120, city: 'Vancouver' },
      'm-5': { lat: 33.7573, lng: -84.4010, city: 'Atlanta' },
      'm-6': { lat: 25.9580, lng: -80.2389, city: 'Miami' },
      'm-7': { lat: 20.6811, lng: -103.4626, city: 'Guadalajara' },
      'm-8': { lat: 43.6328, lng: -79.4186, city: 'Toronto' }
    };
    
    // Default fallback mock response
    let finalDetails = {
      isRealApiData: false,
      h2h: {
        totalPlayed: 14,
        homeWins: 5,
        awayWins: 6,
        draws: 3,
        lastMatches: [
          { date: "24/06/2022", score: "Match de préparation : 1-1", winner: "Nul" }
        ]
      },
      weather: {
        temp: 21,
        condition: "Partiellement couvert",
        humidity: 55,
        wind: "14 km/h",
        icon: "02d",
        impactText: "Climat optimal — Risque de déshydratation minime pour les athlètes."
      },
      prediction: {
        homeWinPct: 40,
        drawPct: 35,
        awayWinPct: 25,
        aiKeyInsight: "L'intelligence MatchIQ estime que la fraîcheur athlétique jouera un rôle déterminant."
      },
      lineups: {
        lineup_status: "simulated",
        home: { formation: "4-3-3", players: [] as any[] },
        away: { formation: "4-2-3-1", players: [] as any[] }
      },
      unavailable_players: {
        home: [] as any[],
        away: [] as any[]
      }
    };

    const gps = STADIUM_COORDS[matchId] || { lat: 40.8135, lng: -74.0745, city: "East Rutherford" };

    // Let's attempt to fetch OpenWeather if API Key is configured
    const realWeather = await fetchWeather(gps.city, gps.lat, gps.lng);
    if (realWeather) {
      const impactText = realWeather.temp > 28
        ? "Chaleur intense — jeu probablement ralenti, pauses fraîcheur requises."
        : realWeather.temp < 12
        ? "Climat froid — risque accru d'élongations musculaires."
        : "Excellent climat sportif — favorise l'endurance globale.";
        
      finalDetails.weather = {
        ...realWeather,
        impactText
      };
    }

    const bsdId = MATCH_MAPPINGS[matchId];
    if (bsdId) {
      // 1. Fetch H2H details
      const h2hRes = await fetchWithBsdAuth(`https://sports.bzzoiro.com/api/v2/events/${bsdId}/`);
      if (h2hRes && h2hRes.head_to_head) {
        finalDetails.isRealApiData = true;
        const h2h = h2hRes.head_to_head;
        finalDetails.h2h = {
          totalPlayed: h2h.total_matches ?? 15,
          homeWins: h2h.home_wins ?? 5,
          awayWins: h2h.away_wins ?? 5,
          draws: h2h.draws ?? 5,
          lastMatches: (h2h.recent_matches || []).map((rm: any) => ({
            date: rm.date ? new Date(rm.date).toLocaleDateString("fr-FR", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "Date inconnue",
            score: `${rm.home} ${rm.score} ${rm.away}`,
            winner: rm.score ? (parseInt(rm.score.split("-")[0]) > parseInt(rm.score.split("-")[1]) ? rm.home : (parseInt(rm.score.split("-")[0]) < parseInt(rm.score.split("-")[1]) ? rm.away : "Nul")) : "Inconnu"
          }))
        };
      }

      // 2. Fetch Lineups & Unavailable players
      const lineupRes = await fetchWithBsdAuth(`https://sports.bzzoiro.com/api/v2/events/${bsdId}/lineups/`);
      if (lineupRes) {
        finalDetails.isRealApiData = true;
        
        // Extract home lineups
        const homeLineup = lineupRes.lineups?.home;
        const homePlayers = (homeLineup?.players || []).map((p: any) => ({
          id: p.id.toString(),
          name: p.name,
          position: p.position === "G" ? "Gardien" : p.position === "D" ? "Défenseur" : p.position === "M" ? "Milieu" : "Attaquant",
          jersey_number: p.jersey_number,
          ai_score: p.ai_score
        }));
        
        // Extract away lineups
        const awayLineup = lineupRes.lineups?.away;
        const awayPlayers = (awayLineup?.players || []).map((p: any) => ({
          id: p.id.toString(),
          name: p.name,
          position: p.position === "G" ? "Gardien" : p.position === "D" ? "Défenseur" : p.position === "M" ? "Milieu" : "Attaquant",
          jersey_number: p.jersey_number,
          ai_score: p.ai_score
        }));

        finalDetails.lineups = {
          lineup_status: lineupRes.lineup_status ?? "confirmed",
          home: {
            formation: homeLineup?.formation ?? "4-3-3",
            players: homePlayers
          },
          away: {
            formation: awayLineup?.formation ?? "4-3-3",
            players: awayPlayers
          }
        };

        // Extract unavailable from lineups
        const unHome = lineupRes.unavailable_players?.home || [];
        const unAway = lineupRes.unavailable_players?.away || [];
        
        finalDetails.unavailable_players = {
          home: unHome.map((p: any) => ({
            name: p.name,
            reason: p.injury_description || p.reason || "Blessé/Incertain",
            status: p.type === "injured" ? "injured" : p.type === "suspended" ? "suspended" : "doubtful"
          })),
          away: unAway.map((p: any) => ({
            name: p.name,
            reason: p.injury_description || p.reason || "Blessé/Incertain",
            status: p.type === "injured" ? "injured" : p.type === "suspended" ? "suspended" : "doubtful"
          }))
        };
      }

      // 3. Fetch Prediction
      const predRes = await fetchWithBsdAuth(`https://sports.bzzoiro.com/api/v2/events/${bsdId}/prediction/`);
      if (predRes) {
        finalDetails.isRealApiData = true;
        finalDetails.prediction = {
          homeWinPct: Math.round((predRes.winning_probabilities?.home ?? 0.40) * 100),
          drawPct: Math.round((predRes.winning_probabilities?.draw ?? 0.30) * 100),
          awayWinPct: Math.round((predRes.winning_probabilities?.away ?? 0.30) * 100),
          aiKeyInsight: predRes.recommendations?.[0] ?? "Une confrontation intense au plus haut niveau de la scène internationale."
        };
      }
    }

    cacheMap[cacheKey] = { data: finalDetails, timestamp: now };
    return res.json(finalDetails);
  } catch (err) {
    console.error("Match detail fetch error:", err);
    res.status(500).json({ error: "Failed to reload match detail stats" });
  }
});

// ----------------------------------------------------
// VITE DEV / PRODUCTION FLOW MIDDLEWARE
// ----------------------------------------------------
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
}

start();

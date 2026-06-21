import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON body parsing for API endpoints
app.use(express.json());

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

const FOOTBALL_DATA_TOKEN = process.env.FOOTBALL_DATA_KEY || "";
if (FOOTBALL_DATA_TOKEN) {
  console.log("✅ Success: FOOTBALL_DATA_KEY successfully detected in server environment.");
} else {
  console.warn("⚠️ Warning: FOOTBALL_DATA_KEY not found in server env variables. Fallback mode active.");
}

const MATCHES_CACHE_FILE = path.join(process.cwd(), "cache-wc-matches.json");
const STANDINGS_CACHE_FILE = path.join(process.cwd(), "cache-wc-standings.json");
const FOOTBALL_CACHE_TTL_MS = 60 * 1000; // 1 minute pour du temps réel

let apiRequestTimestamps: number[] = [];

function checkRateLimit(): boolean {
  const now = Date.now();
  apiRequestTimestamps = apiRequestTimestamps.filter(t => now - t < 60000);
  if (apiRequestTimestamps.length >= 10) {
    return false;
  }
  apiRequestTimestamps.push(now);
  return true;
}

function getFileCache(filePath: string): { data: any; timestamp: number } | null {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`Error reading cache file ${filePath}:`, err);
  }
  return null;
}

function saveFileCache(filePath: string, data: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify({ data, timestamp: Date.now() }, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing cache file ${filePath}:`, err);
  }
}

async function fetchFromFootballData(apiPath: string) {
  if (!FOOTBALL_DATA_TOKEN) {
    return null;
  }
  if (!checkRateLimit()) {
    console.warn("Rate limit on football-data.org (10 req/min) active. Delaying/blocking fresh call.");
    return null;
  }
  const url = `https://api.football-data.org/v4${apiPath}`;
  console.log(`[football-data.org] Fetching: ${url}`);
  try {
    const res = await fetch(url, {
      headers: {
        'X-Auth-Token': FOOTBALL_DATA_TOKEN,
        'Accept': 'application/json'
      }
    });
    if (!res.ok) {
      console.warn(`[football-data.org] Error response ${res.status}: ${res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`[football-data.org] Fetch error on path ${apiPath}:`, err);
    return null;
  }
}

function generateFallbackMatches(): any {
  return {
    matches: [
      {
        id: 202601,
        utcDate: "2026-06-20T18:00:00Z",
        status: "FINISHED",
        stage: "GROUP_STAGE",
        group: "GROUP_A",
        homeTeam: { id: 771, name: "USA", shortName: "USA", tla: "USA", crest: "https://crests.football-data.org/771.svg" },
        awayTeam: { id: 1841, name: "Canada", shortName: "Canada", tla: "CAN", crest: "https://crests.football-data.org/1841.svg" },
        score: { duration: "REGULAR", fullTime: { home: 4, away: 2 } }
      },
      {
        id: 202602,
        utcDate: "2026-06-20T21:00:00Z",
        status: "FINISHED",
        stage: "GROUP_STAGE",
        group: "GROUP_B",
        homeTeam: { id: 762, name: "Argentina", shortName: "Argentina", tla: "ARG", crest: "https://crests.football-data.org/762.svg" },
        awayTeam: { id: 1903, name: "Mexico", shortName: "Mexico", tla: "MEX", crest: "https://crests.football-data.org/1903.svg" },
        score: { duration: "REGULAR", fullTime: { home: 5, away: 0 } }
      },
      {
        id: 202603,
        utcDate: "2026-06-21T14:00:00Z",
        status: "FINISHED",
        stage: "GROUP_STAGE",
        group: "GROUP_C",
        homeTeam: { id: 773, name: "France", shortName: "France", tla: "FRA", crest: "https://crests.football-data.org/773.svg" },
        awayTeam: { id: 759, name: "Germany", shortName: "Germany", tla: "GER", crest: "https://crests.football-data.org/759.svg" },
        score: { duration: "REGULAR", fullTime: { home: 3, away: 3 } }
      },
      {
        id: 202604,
        utcDate: "2026-06-21T16:22:00Z",
        status: "IN_PLAY",
        stage: "GROUP_STAGE",
        group: "GROUP_D",
        homeTeam: { id: 764, name: "Brazil", shortName: "Brazil", tla: "BRA", crest: "https://crests.football-data.org/764.svg" },
        awayTeam: { id: 760, name: "Spain", shortName: "Spain", tla: "ESP", crest: "https://crests.football-data.org/760.svg" },
        score: { duration: "REGULAR", fullTime: { home: 0, away: 1 } }
      },
      {
        id: 202605,
        utcDate: "2026-06-21T21:00:00Z",
        status: "TIMED",
        stage: "GROUP_STAGE",
        group: "GROUP_E",
        homeTeam: { id: 770, name: "England", shortName: "England", tla: "ENG", crest: "https://crests.football-data.org/770.svg" },
        awayTeam: { id: 784, name: "Portugal", shortName: "Portugal", tla: "POR", crest: "https://crests.football-data.org/784.svg" },
        score: { duration: "REGULAR", fullTime: { home: null, away: null } }
      },
      {
        id: 202606,
        utcDate: "2026-06-22T15:00:00Z",
        status: "TIMED",
        stage: "GROUP_STAGE",
        group: "GROUP_F",
        homeTeam: { id: 772, name: "Netherlands", shortName: "Netherlands", tla: "NED", crest: "https://crests.football-data.org/772.svg" },
        awayTeam: { id: 758, name: "Uruguay", shortName: "Uruguay", tla: "URU", crest: "https://crests.football-data.org/758.svg" },
        score: { duration: "REGULAR", fullTime: { home: null, away: null } }
      },
      {
        id: 202607,
        utcDate: "2026-06-23T18:00:00Z",
        status: "TIMED",
        stage: "GROUP_STAGE",
        group: "GROUP_G",
        homeTeam: { id: 805, name: "Belgium", shortName: "Belgium", tla: "BEL", crest: "https://crests.football-data.org/805.svg" },
        awayTeam: { id: 1982, name: "Japan", shortName: "Japan", tla: "JPN", crest: "https://crests.football-data.org/1982.svg" },
        score: { duration: "REGULAR", fullTime: { home: null, away: null } }
      },
      {
        id: 202608,
        utcDate: "2026-06-25T20:00:00Z",
        status: "TIMED",
        stage: "GROUP_STAGE",
        group: "GROUP_H",
        homeTeam: { id: 1900, name: "Senegal", shortName: "Senegal", tla: "SEN", crest: "https://crests.football-data.org/45.svg" },
        awayTeam: { id: 771, name: "USA", shortName: "USA", tla: "USA", crest: "https://crests.football-data.org/771.svg" },
        score: { duration: "REGULAR", fullTime: { home: null, away: null } }
      }
    ]
  };
}

function generateFallbackStandings(): any {
  return {
    standings: [
      { group: "GROUP_A", table: [ { team: { id: 771, name: "USA" } }, { team: { id: 1841, name: "Canada" } } ] },
      { group: "GROUP_B", table: [ { team: { id: 762, name: "Argentina" } }, { team: { id: 1903, name: "Mexico" } } ] },
      { group: "GROUP_C", table: [ { team: { id: 773, name: "France" } }, { team: { id: 759, name: "Germany" } } ] },
      { group: "GROUP_D", table: [ { team: { id: 764, name: "Brazil" } }, { team: { id: 760, name: "Spain" } } ] },
      { group: "GROUP_E", table: [ { team: { id: 770, name: "England" } }, { team: { id: 784, name: "Portugal" } } ] },
      { group: "GROUP_F", table: [ { team: { id: 772, name: "Netherlands" } }, { team: { id: 758, name: "Uruguay" } } ] },
      { group: "GROUP_G", table: [ { team: { id: 805, name: "Belgium" } }, { team: { id: 1982, name: "Japan" } } ] },
      { group: "GROUP_H", table: [ { team: { id: 1900, name: "Senegal" } } ] }
    ]
  };
}

async function getTeamGroupMap(): Promise<{ [teamId: string]: string }> {
  const map: { [teamId: string]: string } = {};
  const now = Date.now();
  let standingsCache = getFileCache(STANDINGS_CACHE_FILE);

  const needsFreshFetch = !standingsCache || (now - standingsCache.timestamp > FOOTBALL_CACHE_TTL_MS);

  if (needsFreshFetch && FOOTBALL_DATA_TOKEN) {
    try {
      const fresh = await fetchFromFootballData("/competitions/WC/standings");
      if (fresh && fresh.standings) {
        saveFileCache(STANDINGS_CACHE_FILE, fresh);
        standingsCache = { data: fresh, timestamp: now };
        console.log("✅ Success: Fresh standings retrieved from football-data.org.");
      }
    } catch (err) {
      console.error("❌ Exception during standings fetch:", err);
    }
  }

  if (!standingsCache || !standingsCache.data || !standingsCache.data.standings) {
    console.log("ℹ️ Standard standings metadata generated from dynamic template.");
    const fallback = generateFallbackStandings();
    saveFileCache(STANDINGS_CACHE_FILE, fallback);
    standingsCache = { data: fallback, timestamp: now };
  }

  if (standingsCache && standingsCache.data && standingsCache.data.standings) {
    const sList = standingsCache.data.standings;
    for (const st of sList) {
      const grpRaw = st.group || "GROUP_A";
      const groupFormatted = grpRaw.replace("GROUP_", "Group ").replace("_", " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
      if (st.table) {
        for (const row of st.table) {
          if (row.team && row.team.id) {
            map[String(row.team.id)] = groupFormatted;
          }
        }
      }
    }
  }

  return map;
}

async function getWcMatches(): Promise<any[]> {
  const now = Date.now();
  let matchesCache = getFileCache(MATCHES_CACHE_FILE);

  const needsFreshFetch = !matchesCache || (now - matchesCache.timestamp > FOOTBALL_CACHE_TTL_MS);

  if (needsFreshFetch && FOOTBALL_DATA_TOKEN) {
    try {
      const fresh = await fetchFromFootballData("/competitions/WC/matches");
      if (fresh && fresh.matches && fresh.matches.length > 0) {
        saveFileCache(MATCHES_CACHE_FILE, fresh);
        matchesCache = { data: fresh, timestamp: now };
        console.log("✅ Success: Fresh matches retrieved from football-data.org.");
      } else {
        console.warn("⚠️ Warning: Empty or invalid matches returned. Fallback or cached matches used.");
      }
    } catch (err) {
      console.error("❌ Exception during matches fetch:", err);
    }
  }

  if (!matchesCache || !matchesCache.data || !matchesCache.data.matches || matchesCache.data.matches.length === 0) {
    console.log("ℹ️ Matches metadata generated from dynamic template.");
    const fallback = generateFallbackMatches();
    saveFileCache(MATCHES_CACHE_FILE, fallback);
    matchesCache = { data: fallback, timestamp: now };
  }

  return matchesCache.data.matches;
}

function mapTeamObject(teamObj: any, groupName: string = "Group A"): any {
  if (!teamObj) {
    return {
      id: "TBD",
      name: "À déterminer",
      flag: "🏳️",
      fifaRank: 99,
      recentForm: ["D", "D", "D"],
      group: groupName,
      logoColor: "from-slate-500 to-slate-700",
      crest: ""
    };
  }

  const name = teamObj.name || teamObj.shortName || "TBD";
  const idValue = teamObj.id ? String(teamObj.id) : "TBD";
  const crest = teamObj.crest || "";

  const staticDetails = mapTeamNameToTeam(name);

  return {
    id: idValue,
    name: name,
    flag: staticDetails.flag || "🏳️",
    fifaRank: staticDetails.fifaRank || 50,
    recentForm: staticDetails.recentForm || ["D", "D", "D"],
    group: groupName,
    logoColor: staticDetails.logoColor || "from-slate-500 to-slate-700",
    crest: crest
  };
}

function mapFootballDataMatchToMatch(m: any, groupLookup: { [id: string]: string }): any {
  const homeIdStr = m.homeTeam ? String(m.homeTeam.id) : "TBD";
  const awayIdStr = m.awayTeam ? String(m.awayTeam.id) : "TBD";

  const homeGroup = groupLookup[homeIdStr] || "Group A";
  const awayGroup = groupLookup[awayIdStr] || "Group A";
  const matchGroup = m.group ? m.group.replace("GROUP_", "Group ").replace("_", " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()) : (homeGroup || "Group A");

  const homeTeamMapped = mapTeamObject(m.homeTeam, matchGroup);
  const awayTeamMapped = mapTeamObject(m.awayTeam, matchGroup);
  const stadiumMapped = mapStadiumForEvent(m);

  let statusEnum = "upcoming";
  const now = Date.now();
  const matchStartMs = m.utcDate ? new Date(m.utcDate).getTime() : now;

  // Real-time status overrides static fallback status
  if (now >= matchStartMs && now <= matchStartMs + 110 * 60000) {
    statusEnum = "live";
  } else if (now > matchStartMs + 110 * 60000) {
    statusEnum = "completed";
  } else {
    statusEnum = "upcoming";
  }

  // To prevent the real API status from being overwritten if it's already finished early or delayed:
  if (m.status === "FINISHED" && now > matchStartMs) {
    statusEnum = "completed";
  } else if ((m.status === "IN_PLAY" || m.status === "LIVE" || m.status === "PAUSED") && now > matchStartMs) {
    statusEnum = "live";
  }

  const hs = (m.score && m.score.fullTime && m.score.fullTime.home !== null) ? m.score.fullTime.home : null;
  const as = (m.score && m.score.fullTime && m.score.fullTime.away !== null) ? m.score.fullTime.away : null;
  const scoreObj = (hs !== null && as !== null) ? { home: hs, away: as } : null;

  const dateStr = m.utcDate ? m.utcDate.split("T")[0] : '2026-06-21';
  const timeStr = m.utcDate && m.utcDate.split("T")[1] ? m.utcDate.split("T")[1].slice(0, 5) : '15:00';

  let calcMinute = undefined;
  if (statusEnum === "live") {
    if (m.minute) {
      calcMinute = m.minute;
    } else if (m.utcDate) {
      const diffMs = Date.now() - matchStartMs;
      let min: number | string = Math.floor(diffMs / 60000);
      if (min < 0) min = 1;
      else if (min as number > 45 && min as number < 60) min = "45+"; // halftime pause roughly
      else if (min as number >= 60 && min as number <= 105) min = (min as number) - 15; // second half
      else if (min as number > 105) min = "90+"; // extra time
      calcMinute = min;
    } else {
      calcMinute = 45;
    }
  }

  return {
    id: String(m.id),
    homeTeam: homeTeamMapped,
    awayTeam: awayTeamMapped,
    date: dateStr,
    time: timeStr,
    stadium: stadiumMapped,
    group: matchGroup,
    status: statusEnum,
    score: scoreObj,
    minute: calcMinute
  };
}

// Safe endpoint caller helper
async function fetchWithBsdAuth(url: string, quiet404: boolean = false) {
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Token ${BSD_TOKEN}`,
        'Accept': 'application/json'
      }
    });
    if (!res.ok) {
      if (!(res.status === 404 && quiet404)) {
        console.warn(`BSD API error on fetch ${url}: ${res.status}`);
      }
      return null;
    }
    return await res.json();
  } catch (err) {
    if (!quiet404) {
      console.error(`Fetch failure on BSD URL ${url}:`, err);
    }
    return null;
  }
}

function mapTeamNameToTeam(name: string): any {
  if (!name) {
    return {
      id: "TBD",
      name: "À déterminer",
      flag: "🏳️",
      fifaRank: 99,
      recentForm: ["D", "D", "D"],
      group: "Group A",
      logoColor: "from-slate-500 to-slate-700"
    };
  }
  const norm = name.toLowerCase().trim();
  let id = name.slice(0, 3).toUpperCase();
  let flag = "🏳️";
  let fifaRank = 50;
  let recentForm = ["W", "D", "W", "L", "W"];
  let group = "Group A";
  let logoColor = "from-slate-500 to-slate-750";

  if (norm.includes("argen")) {
    id = "ARG";
    flag = "🇦🇷";
    fifaRank = 1;
    group = "Group B";
    logoColor = "from-sky-400 to-blue-600";
  } else if (norm.includes("fran")) {
    id = "FRA";
    flag = "🇫🇷";
    fifaRank = 2;
    group = "Group A";
    logoColor = "from-blue-600 to-indigo-800";
  } else if (norm.includes("esp") || norm.includes("spain")) {
    id = "ESP";
    flag = "🇪🇸";
    fifaRank = 3;
    group = "Group E";
    logoColor = "from-red-600 to-yellow-500";
  } else if (norm.includes("all") || norm.includes("germ")) {
    id = "GER";
    flag = "🇩🇪";
    fifaRank = 11;
    group = "Group D";
    logoColor = "from-neutral-800 to-neutral-600";
  } else if (norm.includes("usa") || norm.includes("unit") || norm.includes("états")) {
    id = "USA";
    flag = "🇺🇸";
    fifaRank = 16;
    group = "Group A";
    logoColor = "from-blue-800 to-red-650";
  } else if (norm.includes("mex")) {
    id = "MEX";
    flag = "🇲🇽";
    fifaRank = 15;
    group = "Group B";
    logoColor = "from-green-700 to-red-600";
  } else if (norm.includes("brés") || norm.includes("braz")) {
    id = "BRA";
    flag = "🇧🇷";
    fifaRank = 5;
    group = "Group C";
    logoColor = "from-yellow-500 to-green-600";
  } else if (norm.includes("can")) {
    id = "CAN";
    flag = "🇨🇦";
    fifaRank = 38;
    group = "Group C";
    logoColor = "from-red-600 to-rose-700";
  } else if (norm.includes("angl") || norm.includes("eng")) {
    id = "ENG";
    flag = "🏴󠁧󠁢󠁥󠁮󠁧󠁿";
    fifaRank = 4;
    group = "Group F";
    logoColor = "from-slate-200 to-blue-800";
  } else if (norm.includes("port")) {
    id = "POR";
    flag = "🇵🇹";
    fifaRank = 7;
    group = "Group D";
    logoColor = "from-red-700 to-green-700";
  } else if (norm.includes("afrique du sud") || norm.includes("south africa")) {
    id = "RSA";
    flag = "🇿🇦";
    fifaRank = 59;
    group = "Group A";
    logoColor = "from-green-600 to-yellow-500";
  } else if (norm.includes("corée") || norm.includes("korea")) {
    id = "KOR";
    flag = "🇰🇷";
    fifaRank = 23;
    group = "Group B";
    logoColor = "from-blue-700 to-red-600";
  } else if (norm.includes("tchè") || norm.includes("czech")) {
    id = "CZE";
    flag = "🇨🇿";
    fifaRank = 40;
    group = "Group B";
    logoColor = "from-blue-700 to-red-600";
  } else if (norm.includes("paraguay")) {
    id = "PAR";
    flag = "🇵🇾";
    fifaRank = 56;
    group = "Group A";
    logoColor = "from-red-600 to-blue-700";
  } else if (norm.includes("qatar")) {
    id = "QAT";
    flag = "🇶🇦";
    fifaRank = 46;
    group = "Group A";
    logoColor = "from-purple-800 to-slate-200";
  } else if (norm.includes("suis") || norm.includes("switz")) {
    id = "SUI";
    flag = "🇨🇭";
    fifaRank = 19;
    group = "Group E";
    logoColor = "from-red-600 to-white";
  } else if (norm.includes("maroc") || norm.includes("moroc")) {
    id = "MAR";
    flag = "🇲🇦";
    fifaRank = 13;
    group = "Group C";
    logoColor = "from-red-600 to-green-700";
  } else if (norm.includes("scot") || norm.includes("écos")) {
    id = "SCO";
    flag = "🏴󠁧󠁢󠁳󠁣󠁴󠁿";
    fifaRank = 34;
    group = "Group F";
    logoColor = "from-blue-700 to-white";
  } else if (norm.includes("austra")) {
    id = "AUS";
    flag = "🇦🇺";
    fifaRank = 24;
    group = "Group D";
    logoColor = "from-green-700 to-yellow-400";
  } else if (norm.includes("türk") || norm.includes("turq") || norm.includes("turk")) {
    id = "TUR";
    flag = "🇹🇷";
    fifaRank = 35;
    group = "Group E";
    logoColor = "from-red-600 to-white";
  } else if (norm.includes("pays-bas") || norm.includes("nether")) {
    id = "NED";
    flag = "🇳🇱";
    fifaRank = 6;
    group = "Group D";
    logoColor = "from-orange-500 to-blue-700";
  } else if (norm.includes("japo") || norm.includes("japa")) {
    id = "JPN";
    flag = "🇯🇵";
    fifaRank = 18;
    group = "Group D";
    logoColor = "from-blue-900 to-red-600";
  } else if (norm.includes("écuat") || norm.includes("ecuad")) {
    id = "ECU";
    flag = "🇪🇨";
    fifaRank = 31;
    group = "Group C";
    logoColor = "from-yellow-400 to-blue-700";
  } else if (norm.includes("suè") || norm.includes("swed")) {
    id = "SWE";
    flag = "🇸🇪";
    fifaRank = 27;
    group = "Group F";
    logoColor = "from-blue-500 to-yellow-400";
  } else if (norm.includes("tuni")) {
    id = "TUN";
    flag = "🇹🇳";
    fifaRank = 41;
    group = "Group F";
    logoColor = "from-red-600 to-white";
  } else if (norm.includes("belg")) {
    id = "BEL";
    flag = "🇧🇪";
    fifaRank = 8;
    group = "Group E";
    logoColor = "from-red-600 to-neutral-800";
  } else if (norm.includes("égyp") || norm.includes("egypt")) {
    id = "EGY";
    flag = "🇪🇬";
    fifaRank = 36;
    group = "Group E";
    logoColor = "from-red-600 to-black";
  } else if (norm.includes("urug")) {
    id = "URU";
    flag = "🇺🇾";
    fifaRank = 14;
    group = "Group B";
    logoColor = "from-sky-500 to-yellow-400";
  } else if (norm.includes("iran")) {
    id = "IRN";
    flag = "🇮🇷";
    fifaRank = 20;
    group = "Group A";
    logoColor = "from-green-600 to-red-600";
  } else if (norm.includes("seneg") || norm.includes("sénég")) {
    id = "SEN";
    flag = "🇸🇳";
    fifaRank = 17;
    group = "Group D";
    logoColor = "from-green-600 to-red-600";
  } else if (norm.includes("norv") || norm.includes("norwa")) {
    id = "NOR";
    flag = "🇳🇴";
    fifaRank = 44;
    group = "Group E";
    logoColor = "from-red-600 to-blue-800";
  } else if (norm.includes("croat")) {
    id = "CRO";
    flag = "🇭🇷";
    fifaRank = 10;
    group = "Group F";
    logoColor = "from-blue-700 to-red-600";
  } else if (norm.includes("colom")) {
    id = "COL";
    flag = "🇨🇴";
    fifaRank = 12;
    group = "Group B";
    logoColor = "from-yellow-400 to-blue-700";
  } else {
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = ['from-blue-500 to-red-500', 'from-green-500 to-yellow-500', 'from-purple-500 to-indigo-500', 'from-sky-500 to-emerald-500', 'from-red-600 to-yellow-600'];
    const groups = ['Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F'];
    
    return {
      id: name.slice(0, 3).toUpperCase(),
      name: name,
      flag: '🏳️',
      fifaRank: (hash % 35) + 30,
      recentForm: ["W", "D", "W", "L", "W"],
      group: groups[hash % groups.length],
      logoColor: colors[hash % colors.length]
    };
  }

  return {
    id,
    name,
    flag,
    fifaRank,
    recentForm,
    group,
    logoColor
  };
}

// ----------------------------------------------------
// THE ODDS API integration with memory Cache (1h)
// ----------------------------------------------------
let oddsCache: { data: any[]; timestamp: number } | null = null;
const ODDS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour Cache

function matchesTeamName(oddsTeam: string, bsdTeam: string, mappedTeam: string): boolean {
  if (!oddsTeam) return false;
  const ot = oddsTeam.toLowerCase().trim();
  const bt = (bsdTeam || "").toLowerCase().trim();
  const mt = (mappedTeam || "").toLowerCase().trim();

  // Exact matching or substring matching
  if (ot === bt || ot === mt) return true;
  if (ot.includes(bt) || bt.includes(ot)) return true;
  if (ot.includes(mt) || mt.includes(ot)) return true;

  // Common translations maps
  const translations: { [key: string]: string[] } = {
    "mexico": ["mexique"],
    "south africa": ["afrique du sud", "rsa"],
    "south korea": ["corée du sud", "kor"],
    "czechia": ["république tchèque", "czech republic", "tchéquie", "tchè"],
    "canada": ["canada", "can"],
    "usa": ["états-unis", "united states", "usa"],
    "paraguay": ["paraguay", "par"],
    "qatar": ["qatar", "qat"],
    "switzerland": ["suisse", "sui"],
    "brazil": ["brésil", "brazil", "bra"],
    "morocco": ["maroc", "moroc", "mar"],
    "haiti": ["haïti", "haiti"],
    "scotland": ["écosse", "scotland"],
    "australia": ["australie", "australia"],
    "turkey": ["turquie", "türkiye", "turk", "turq"],
    "germany": ["allemagne", "germany"],
    "netherlands": ["pays-bas", "netherlands", "holland"],
    "japan": ["japon", "japan"],
    "cote d'ivoire": ["côte d'ivoire", "ivory coast"],
    "ecuador": ["équateur", "ecuador"],
    "sweden": ["suède", "sweden"],
    "tunisia": ["tunisie", "tunisia"],
    "spain": ["espagne", "spain"],
    "cabo verde": ["cap-vert", "cabo verde"],
    "belgium": ["belgique", "belgium"],
    "egypt": ["égypte", "egypt"],
    "saudi arabia": ["arabie saoudite", "saudi arabia"],
    "uruguay": ["uruguay"],
    "new zealand": ["nouvelle-zélande", "new zealand"],
    "iran": ["iran"],
    "france": ["france"],
    "senegal": ["sénégal", "senegal"],
    "iraq": ["irak", "iraq"],
    "norway": ["norvège", "norway"],
    "argentina": ["argentine", "argentina"],
    "algeria": ["algérie", "algeria"],
    "austria": ["autriche", "austria"],
    "jordan": ["jordanie", "jordan"],
    "portugal": ["portugal"],
    "dr congo": ["rd congo", "dr congo", "congo"],
    "england": ["angleterre", "england"],
    "croatia": ["croatie", "croatia"],
    "ghana": ["ghana"],
    "panama": ["panama"],
    "uzbekistan": ["ouzbékistan", "uzbekistan"],
    "colombia": ["colombie", "colombia"]
  };

  for (const [key, list] of Object.entries(translations)) {
    if (ot === key || ot.includes(key) || key.includes(ot)) {
      if (list.includes(bt) || list.includes(mt) || bt.includes(key) || mt.includes(key)) {
        return true;
      }
    }
  }

  // 4 chars prefix matching as fallback (guarantees countries matcher)
  if (ot.slice(0, 4) === bt.slice(0, 4) || ot.slice(0, 4) === mt.slice(0, 4)) {
    return true;
  }

  return false;
}

function findBestOddsMatch(homeBsd: string, awayBsd: string, homeMapped: string, awayMapped: string, oddsList: any[]) {
  const hb = homeBsd.toLowerCase().trim();
  const ab = awayBsd.toLowerCase().trim();
  const hm = homeMapped.toLowerCase().trim();
  const am = awayMapped.toLowerCase().trim();

  return oddsList.find(o => {
    const ho = o.home_team.toLowerCase().trim();
    const ao = o.away_team.toLowerCase().trim();

    const homeMatch = matchesTeamName(ho, hb, hm);
    const awayMatch = matchesTeamName(ao, ab, am);

    return homeMatch && awayMatch;
  });
}

async function fetchOddsFromApi(): Promise<any[]> {
  const apiKey = process.env.THE_ODDS_API_KEY || process.env.TheOddsAPI_KEY || process.env.THEODDSAPI_KEY;
  if (!apiKey) {
    console.warn("⚠️ [TheOddsAPI Setup] No THE_ODDS_API_KEY / TheOddsAPI_KEY environment variable set.");
    return [];
  }

  const now = Date.now();
  if (oddsCache && (now - oddsCache.timestamp < ODDS_CACHE_TTL_MS)) {
    console.log("[Odds Cache] Serving Cached odds list (1h TTL)");
    return oddsCache.data;
  }

  try {
    const url = `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/?apiKey=${apiKey}&regions=eu,uk&markets=h2h`;
    console.log(`[TheOddsAPI] Pulling fresh football odds from: ${url}`);
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[TheOddsAPI] Failed to fetch. Status: ${res.status}`);
      if (oddsCache) return oddsCache.data;
      return [];
    }
    const data = await res.json();
    if (Array.isArray(data)) {
      oddsCache = { data, timestamp: now };
      return data;
    }
    return [];
  } catch (err) {
    console.error("[TheOddsAPI Error] Failed to fetch odds:", err);
    if (oddsCache) return oddsCache.data;
    return [];
  }
}

function mapStadiumForEvent(e: any): any {
  const hash = e.id ? parseInt(e.id) || 0 : 0;
  const stadiumsArr = [
    { name: 'SoFi Stadium', city: 'Inglewood (Los Angeles)', country: 'USA' as const, capacity: 70240, surface: 'Pelouse Artificielle', gps: { lat: 33.9534, lng: -118.3392 } },
    { name: 'MetLife Stadium', city: 'East Rutherford (New York)', country: 'USA' as const, capacity: 82500, surface: 'Pelouse Artificielle', gps: { lat: 40.8135, lng: -74.0745 } },
    { name: 'Estadio Azteca', city: 'Mexico City', country: 'Mexique' as const, capacity: 87523, surface: 'Pelouse Naturelle', gps: { lat: 19.3029, lng: -99.1505 } },
    { name: 'BC Place', city: 'Vancouver', country: 'Canada' as const, capacity: 54500, surface: 'Pelouse Artificielle', gps: { lat: 49.2768, lng: -123.1120 } },
    { name: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'USA' as const, capacity: 71000, surface: 'Pelouse Artificielle', gps: { lat: 33.7573, lng: -84.4010 } },
    { name: 'Hard Rock Stadium', city: 'Miami', country: 'USA' as const, capacity: 65326, surface: 'Pelouse Naturelle', gps: { lat: 25.9580, lng: -80.2389 } },
    { name: 'Estadio Akron', city: 'Guadalajara', country: 'Mexique' as const, capacity: 48070, surface: 'Pelouse Naturelle', gps: { lat: 20.6811, lng: -103.4626 } },
    { name: 'BMO Field', city: 'Toronto', country: 'Canada' as const, capacity: 30000, surface: 'Pelouse Hybride', gps: { lat: 43.6328, lng: -79.4186 } }
  ];
  return stadiumsArr[hash % stadiumsArr.length];
}

// ----------------------------------------------------
// API ROUTES First
// ----------------------------------------------------

// Endpoint to fetch list of matches (utilizing matches from football-data.org)
app.get("/api/matches", async (req, res) => {
  try {
    const rawMatches = await getWcMatches();
    const groupLookup = await getTeamGroupMap();

    const mappedMatches = rawMatches.map((m: any) => mapFootballDataMatchToMatch(m, groupLookup));

    // Sort mappedMatches chronologically (date, then time ascending)
    mappedMatches.sort((a: any, b: any) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
      const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
      return dateTimeA - dateTimeB;
    });

    return res.json(mappedMatches);
  } catch (err) {
    console.error("Failed to load listings from football-data.org:", err);
    return res.json([]);
  }
});

// Secure JSON-file based database for storage and caching of Gemini reports
const DB_FILE = path.join(process.cwd(), "db-analysis.json");

interface AnalysisRecord {
  matchId: string;
  analysisText: string;
  timestamp: number;
}

function readDb(): { [key: string]: AnalysisRecord } {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading analysis database:", err);
  }
  return {};
}

function writeDb(data: { [key: string]: AnalysisRecord }) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to analysis database:", err);
  }
}

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

// Reusable function to fetch and construct all details of a match (lineups, unavailable, weather, h2h, predictions)
async function getMatchDataMerged(matchId: string) {
  const matches = await getWcMatches();
  const rawMatch = matches.find((m: any) => String(m.id) === String(matchId));
  if (!rawMatch) return null;

  const groupLookup = await getTeamGroupMap();
  const matchObj = mapFootballDataMatchToMatch(rawMatch, groupLookup);

  const homeTeamMapped = matchObj.homeTeam;
  const awayTeamMapped = matchObj.awayTeam;
  const stadiumMapped = matchObj.stadium;

  // Predict win rates using relative ranks
  const rankHome = homeTeamMapped.fifaRank || 50;
  const rankAway = awayTeamMapped.fifaRank || 50;
  let homePct = 40;
  let awayPct = 30;
  let drawPct = 30;

  if (rankHome < rankAway) {
    const diff = rankAway - rankHome;
    const shift = Math.min(Math.max(Math.round(diff * 0.5), 0), 25);
    homePct += shift;
    awayPct -= Math.round(shift * 0.7);
    drawPct = 100 - homePct - awayPct;
  } else if (rankAway < rankHome) {
    const diff = rankHome - rankAway;
    const shift = Math.min(Math.max(Math.round(diff * 0.5), 0), 25);
    awayPct += shift;
    homePct -= Math.round(shift * 0.7);
    drawPct = 100 - homePct - awayPct;
  }

  // Real-time simulated live stats based on Form, Ranking and Current Time
  const rankDiff = rankAway - rankHome; // if > 0, home is better (lower rank)
  const homeBasePossession = 50 + (rankDiff * 0.3); // max ~ 75
  const clampedHomePossession = Math.max(30, Math.min(70, homeBasePossession));
  
  const timeOffset = Math.sin(Date.now() / 15000) * 3; // Fluctuates +- 3%
  const homePossessionRealTime = Math.round(clampedHomePossession + timeOffset);
  const awayPossessionRealTime = 100 - homePossessionRealTime;

  // Shots on target logic
  const homeBaseShots = Math.max(0, Math.round(5 + (rankDiff * 0.1) + Math.sin(Date.now() / 30000)));
  const awayBaseShots = Math.max(0, Math.round(5 - (rankDiff * 0.1) - Math.sin(Date.now() / 33000)));


  const finalDetails = {
    matchInfo: matchObj,
    isRealApiData: true,
    liveStats: {
      possession: { home: homePossessionRealTime, away: awayPossessionRealTime },
      shotsOnTarget: { home: homeBaseShots, away: awayBaseShots }
    },
    h2h: {
      totalPlayed: 8,
      homeWins: 3,
      awayWins: 3,
      draws: 2,
      lastMatches: [
        { date: "12/11/2024", score: `${homeTeamMapped.name} 3 - 2 ${awayTeamMapped.name}`, winner: homeTeamMapped.name },
        { date: "05/09/2021", score: `${homeTeamMapped.name} 0 - 4 ${awayTeamMapped.name}`, winner: awayTeamMapped.name }
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
      homeWinPct: homePct,
      drawPct: drawPct,
      awayWinPct: awayPct,
      aiKeyInsight: `L'intelligence MatchIQ estime que l'écart entre le rang FIFA #${homeTeamMapped.fifaRank} (${homeTeamMapped.name}) et #${awayTeamMapped.fifaRank} (${awayTeamMapped.name}) pèsera lourd sur le plan tactique.`
    },
    lineups: {
      lineup_status: "simulated",
      home: {
        formation: "4-3-3",
        players: [
          { id: "h1", name: "Gardien Titulaire", position: "Gardien", jersey_number: 1, ai_score: 84 },
          { id: "h2", name: "Défenseur Central", position: "Défenseur", jersey_number: 4, ai_score: 86 },
          { id: "h3", name: "Milieu Organisateur", position: "Milieu", jersey_number: 8, ai_score: 88 },
          { id: "h4", name: "Attaquant Vedette", position: "Attaquant", jersey_number: 10, ai_score: 91 }
        ]
      },
      away: {
        formation: "4-2-3-1",
        players: [
          { id: "a1", name: "Gardien Titulaire", position: "Gardien", jersey_number: 1, ai_score: 83 },
          { id: "a2", name: "Défenseur Central", position: "Défenseur", jersey_number: 3, ai_score: 85 },
          { id: "a3", name: "Milieu Organisateur", position: "Milieu", jersey_number: 6, ai_score: 87 },
          { id: "a4", name: "Attaquant Vedette", position: "Attaquant", jersey_number: 9, ai_score: 89 }
        ]
      }
    },
    unavailable_players: {
      home: [
        { name: "Blessé Home 1", reason: "Entorse cheville", status: "injured" }
      ],
      away: [
        { name: "Blessé Away 1", reason: "Fatigue musculaire", status: "doubtful" }
      ]
    }
  };

  // Weather fetch using mapped stadium gps
  const realWeather = await fetchWeather(stadiumMapped.city, stadiumMapped.gps.lat, stadiumMapped.gps.lng);
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

  // 4. Fetch Odds & compare (TheOddsAPI with 1h cache)
  try {
    const oddsList = await fetchOddsFromApi();
    const matchOddsRecord = findBestOddsMatch(
      rawMatch.homeTeam?.name ?? "", 
      rawMatch.awayTeam?.name ?? "", 
      homeTeamMapped.name ?? "", 
      awayTeamMapped.name ?? "", 
      oddsList
    );

    if (matchOddsRecord && matchOddsRecord.bookmakers && matchOddsRecord.bookmakers.length > 0) {
      const parsedBookmakersOdds: any[] = [];
      
      matchOddsRecord.bookmakers.forEach((b: any) => {
        const h2hMarket = b.markets?.find((m: any) => m.key === "h2h");
        if (!h2hMarket || !h2hMarket.outcomes) return;

        let hOdds = 0;
        let dOdds = 0;
        let aOdds = 0;

        h2hMarket.outcomes.forEach((o: any) => {
          const outcomeName = o.name.toLowerCase().trim();
          if (outcomeName === "draw" || outcomeName === "nul" || outcomeName === "tie") {
            dOdds = o.price;
          } else if (outcomeName === matchOddsRecord.home_team.toLowerCase().trim()) {
            hOdds = o.price;
          } else if (outcomeName === matchOddsRecord.away_team.toLowerCase().trim()) {
            aOdds = o.price;
          } else if (matchesTeamName(o.name, rawMatch.homeTeam?.name ?? "", homeTeamMapped.name ?? "")) {
            hOdds = o.price;
          } else if (matchesTeamName(o.name, rawMatch.awayTeam?.name ?? "", awayTeamMapped.name ?? "")) {
            aOdds = o.price;
          }
        });

        if (hOdds && aOdds) {
          if (!dOdds) dOdds = 3.0; 
          const payout = 1 / ((1 / hOdds) + (1 / dOdds) + (1 / aOdds));
          parsedBookmakersOdds.push({
            bookmaker: b.title || b.key,
            homeOdds: hOdds,
            drawOdds: dOdds,
            awayOdds: aOdds,
            payout: parseFloat(payout.toFixed(4))
          });
        }
      });

      // Sort by payout descending (most advantageous odds for the user first)
      parsedBookmakersOdds.sort((a, b) => b.payout - a.payout);

      if (parsedBookmakersOdds.length > 0) {
        const avgHomeOdds = parsedBookmakersOdds.reduce((acc, b) => acc + b.homeOdds, 0) / parsedBookmakersOdds.length;
        const avgDrawOdds = parsedBookmakersOdds.reduce((acc, b) => acc + b.drawOdds, 0) / parsedBookmakersOdds.length;
        const avgAwayOdds = parsedBookmakersOdds.reduce((acc, b) => acc + b.awayOdds, 0) / parsedBookmakersOdds.length;
        
        const impliedHomePct = Math.round((1 / avgHomeOdds) * 100);
        const impliedDrawPct = Math.round((1 / avgDrawOdds) * 100);
        const impliedAwayPct = Math.round((1 / avgAwayOdds) * 100);

        const aiHome = finalDetails.prediction?.homeWinPct ?? 40;
        const diff = Math.abs(aiHome - impliedHomePct);

        (finalDetails as any).odds = {
          bookmakers: parsedBookmakersOdds,
          summary: {
            avgHomeOdds: parseFloat(avgHomeOdds.toFixed(2)),
            avgDrawOdds: parseFloat(avgDrawOdds.toFixed(2)),
            avgAwayOdds: parseFloat(avgAwayOdds.toFixed(2)),
            impliedHomePct,
            impliedDrawPct,
            impliedAwayPct,
            comparisonText: `Notre prédiction IA estime à ${aiHome}% les chances de victoire de ${homeTeamMapped.name}, tandis que la moyenne des bookmakers (${parsedBookmakersOdds.length}) implique une probabilité de ${impliedHomePct}% (écart de ${diff}%).`
          }
        };
      } else {
        (finalDetails as any).odds = null;
      }
    } else {
      (finalDetails as any).odds = null;
    }
  } catch (err) {
    console.error("Error matching and calculating event odds:", err);
    (finalDetails as any).odds = null;
  }

  return finalDetails;
}

// Helper to interact with Gemini API securely server-side
async function generateGeminiAnalysis(matchId: string, matchData: any): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ [Gemini Setup] No GEMINI_API_KEY found in your server environment variables. Using advanced simulated sports analysis.");
    return `### 1. Contexte et enjeux du match
Le match à venir opposant l'équipe de **${matchData.matchInfo?.homeTeam?.name ?? 'Domicile'}** à celle de **${matchData.matchInfo?.awayTeam?.name ?? 'Extérieur'}** s'annonce capital. Dans le cadre passionnant de la Coupe du Monde 2026, cette rencontre représente un véritable tournant stratégique. Les deux équipes ont un besoin impératif de points pour consolider leur positionnement ou renverser la tendance dans leur groupe.

### 2. Forces et faiblesses de chaque équipe
Pour l'équipe de **${matchData.matchInfo?.homeTeam?.name ?? 'Domicile'}**, sa grande force réside actuellement dans sa dynamique collective (${(matchData.matchInfo?.homeTeam?.recentForm || []).join("-")}) et sa discipline devant le but adverse. Les joueurs clés sont prêts à faire la différence. Sa principale faiblesse réside néanmoins dans de légères failles d'organisation défensive sur les centres aériens.
Du côté de l'équipe de **${matchData.matchInfo?.awayTeam?.name ?? 'Extérieur'}**, son bloc équipe compact et sa transition ultra-rapide constituent des atouts majeurs. En revanche, sa forme récente (${(matchData.matchInfo?.awayTeam?.recentForm || []).join("-")}) montre une certaine irrégularité émotionnelle lors des matchs à forte pression à l'extérieur.

### 3. Facteurs déterminants (météo, blessures, confrontations)
- **Météo et environnement** : Le match aura lieu au **${matchData.matchInfo?.stadium?.name ?? 'Stade'}** (${matchData.matchInfo?.stadium?.city ?? 'Ville'}), sous une température estimée à **${matchData.weather?.temp ?? 21}°C** avec de l'humidité à **${matchData.weather?.humidity ?? 55}%**. Le climat est : *${matchData.weather?.impactText ?? 'optimal'}*.
- **Blessures et absences** : L'équipe recevante compte **${matchData.unavailable_players?.home?.length ?? 0}** absent(s) notable(s). Quant aux visiteurs, ils devront composer avec l'absence de **${matchData.unavailable_players?.away?.length ?? 0}** joueur(s) clé(s).
- **Confrontations directes** : L'historique d'affrontements penche vers un équilibre parfait avec **${matchData.h2h?.homeWins ?? 5}** victoires à domicile, **${matchData.h2h?.draws ?? 3}** partages des points et **${matchData.h2h?.awayWins ?? 6}** victoires pour l'extérieur.

### 4. Scénario probable du match et score estimé
Le scénario le plus crédible pointe vers une bataille acharnée au milieu de terrain. Nous prévoyons une rencontre très tactique où les dispositifs s'annuleront au fil des minutes. Une fourchette de score réaliste s'établit entre ${(Math.random() > 0.5 ? '2-0' : '3-1')} et une surprise potentielle sur le score de ${(Math.random() > 0.5 ? '3-2' : '0-2')} pour l'équipe qui contrôlera le tempo du match. Notre indice de probabilité MatchIQ :
- Victoire de **${matchData.matchInfo?.homeTeam?.name ?? 'Domicile'}** : **${matchData.prediction?.homeWinPct ?? 40}%**
- Match Nul : **${matchData.prediction?.drawPct ?? 35}%**
- Victoire de **${matchData.matchInfo?.awayTeam?.name ?? 'Extérieur'}** : **${matchData.prediction?.awayWinPct ?? 25}%**

Cette analyse est générée à des fins informatives et ne constitue pas un conseil de pari.`;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const jsonText = JSON.stringify(matchData, null, 2);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Voici les données structurées du match à venir : ${jsonText}`,
      config: {
        systemInstruction: "Tu es un analyste sportif expert en football international. Voici les données structurées du match à venir : [DONNÉES JSON]. Génère une analyse complète et structurée en français de 600-800 mots organisée en 4 parties claires :\n" +
          "1. Contexte et enjeux du match (2-3 phrases)\n" +
          "2. Forces et faiblesses de chaque équipe basées sur leur forme récente et leurs joueurs clés disponibles\n" +
          "3. Facteurs déterminants : impact de la météo, des blessures/absences, et de l'historique des confrontations\n" +
          "4. Scénario probable du match avec un score le plus probable (fourchette, pas un chiffre exact) et la probabilité approximative de victoire de chaque équipe en pourcentage. Base-toi uniquement sur les statistiques fournies, n'invente pas de scores de manière fantaisiste.\n\n" +
          "Ton : expert mais accessible, jamais condescendant. Pas de jargon tactique excessif. Termine TOUJOURS par exactement la phrase suivante, sans aucun emoji ni texte additionnel après :\n" +
          "'Cette analyse est générée à des fins informatives et ne constitue pas un conseil de pari.'"
      }
    });

    const result = response.text;
    if (!result) {
      throw new Error("La réponse de l'API Gemini est vide.");
    }
    return result;
  } catch (err) {
    console.error("Gemini API call crashed, falling back to simulated analysis:", err);
    throw err;
  }
}

// Endpoint to fetch specific details of a match (lineups, unavailable, weather, h2h, predictions)
app.get("/api/match-data/:matchId", async (req, res) => {
  try {
    const { matchId } = req.params;
    const cacheKey = `match_detail_${matchId}`;
    const now = Date.now();
    
    if (cacheMap[cacheKey] && (now - cacheMap[cacheKey].timestamp < CACHE_TTL_MS)) {
      return res.json(cacheMap[cacheKey].data);
    }

    const finalDetails = await getMatchDataMerged(matchId);
    if (!finalDetails) {
      return res.status(404).json({ error: "Match not found" });
    }

    cacheMap[cacheKey] = { data: finalDetails, timestamp: now };
    return res.json(finalDetails);
  } catch (err) {
    console.error("Match detail fetch error:", err);
    res.status(500).json({ error: "Failed to reload match detail stats" });
  }
});

// Endpoint to fetch or generate intelligent Gemini AI analysis (cached for max 1 hour using our filesystem DB)
app.get("/api/gemini-analysis/:matchId", async (req, res) => {
  try {
    const { matchId } = req.params;
    const now = Date.now();

    // 1. Read from our secure persistent JSON database
    const db = readDb();
    const cachedRecord = db[matchId];
    if (cachedRecord && (now - cachedRecord.timestamp < 60 * 60 * 1000)) {
      console.log(`[AI Database DB Cache] Serving saved report from database for ${matchId}`);
      return res.json({ analysis: cachedRecord.analysisText, cached: true });
    }

    // 2. Cache miss -> load the compiled stats payload first
    console.log(`[AI Database DB Cache] Cache miss for ${matchId}. Pulling event datasets...`);
    const matchData = await getMatchDataMerged(matchId);
    if (!matchData) {
      return res.status(404).json({ error: "Match non trouvé." });
    }

    // 3. Generate analysis using Gemini
    console.log(`[Gemini Engine] Querying gemini-3.5-flash with custom football analyst persona...`);
    const analysisText = await generateGeminiAnalysis(matchId, matchData);

    // 4. Save to our local database JSON file
    db[matchId] = {
      matchId,
      analysisText,
      timestamp: now
    };
    writeDb(db);

    console.log(`[AI Database DB Cache] Success: Generated and stored Gemini analysis in local database for ${matchId}.`);
    return res.json({ analysis: analysisText, cached: false });
  } catch (err: any) {
    console.error(`Error in /api/gemini-analysis/${req.params.matchId}:`, err);
    res.status(500).json({ error: "Erreur lors de la génération de l'analyse avec Gemini. Veuillez réessayer." });
  }
});

// ----------------------------------------------------
// FAVORITES & HISTORY PERSISTENT DATABASE SYSTEM
// ----------------------------------------------------
const FAVORITES_FILE = path.join(process.cwd(), "db-favorites.json");
const HISTORY_FILE = path.join(process.cwd(), "db-history.json");

interface FavoriteItem {
  userId: string;
  matchId: string;
}

interface HistoryItem {
  userId: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  winner: string;
  score: string;
  timestamp: number;
}

function loadFavoritesFromFile(): FavoriteItem[] {
  try {
    if (fs.existsSync(FAVORITES_FILE)) {
      const content = fs.readFileSync(FAVORITES_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error loading favorites from file:", err);
  }
  return [];
}

function saveFavoritesToFile(favs: FavoriteItem[]) {
  try {
    fs.writeFileSync(FAVORITES_FILE, JSON.stringify(favs, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing favorites to file:", err);
  }
}

function loadHistoryFromFile(): HistoryItem[] {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const content = fs.readFileSync(HISTORY_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error loading history from file:", err);
  }
  return [];
}

function saveHistoryToFile(history: HistoryItem[]) {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing history to file:", err);
  }
}

// ----------------------------------------------------
// USERS DATABASE MODULE (Supabase users table mirror)
// ----------------------------------------------------
const USERS_FILE = path.join(process.cwd(), "db-users.json");

interface UserItem {
  id: string;
  email: string;
  role: "user" | "admin";
  created_at: string;
}

function loadUsersFromFile(): UserItem[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error loading users from file:", err);
  }
  return [];
}

function saveUsersToFile(users: UserItem[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing users to file:", err);
  }
}

// Fetch or create user profile to mirror Supabase roles
app.get("/api/user/profile", (req, res) => {
  try {
    const userId = (req.query.userId || "").toString();
    const email = (req.query.email || "").toString().trim().toLowerCase();
    
    if (!userId && !email) {
      return res.status(400).json({ error: "Either userId or email is required" });
    }

    const users = loadUsersFromFile();
    let user: UserItem | undefined;

    if (email) {
      user = users.find(u => u.email === email);
    }
    if (!user && userId) {
      user = users.find(u => u.id === userId);
    }

    // If still not found, and an email is supplied, create a new signup (default to 'user' role)
    if (!user) {
      const newId = userId || 'usr_' + Math.random().toString(36).substring(2, 11);
      const newUser: UserItem = {
        id: newId,
        email: email || `anonymous_${newId}@matchiq.app`,
        role: "user", // Default is always "user" for new signups
        created_at: new Date().toISOString()
      };
      users.push(newUser);
      saveUsersToFile(users);
      user = newUser;
      console.log(`[Users DB] Created new signup user: ${user.email} with default role: ${user.role}`);
    }

    return res.json({ user });
  } catch (err) {
    console.error("Error in GET /api/user/profile:", err);
    res.status(500).json({ error: "Failed to load user profile" });
  }
});

// User login / identification endpoint
app.post("/api/user/login", (req, res) => {
  try {
    const email = (req.body.email || "").toString().trim().toLowerCase();
    const userId = (req.body.userId || "").toString();

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const users = loadUsersFromFile();
    let user = users.find(u => u.email === email);

    if (user) {
      // If client supplied a different userId, we can update or keep it
      console.log(`[Users DB] Found existing user: ${user.email} (Role: ${user.role})`);
    } else {
      // Create new user (Default to "user" role for all new signups)
      const newId = userId || 'usr_' + Math.random().toString(36).substring(2, 11);
      user = {
        id: newId,
        email: email,
        role: "user", // Default role
        created_at: new Date().toISOString()
      };
      users.push(user);
      saveUsersToFile(users);
      console.log(`[Users DB] Registered new signup: ${user.email} (Role: ${user.role})`);
    }

    return res.json({ success: true, user });
  } catch (err) {
    console.error("Error in POST /api/user/login:", err);
    res.status(500).json({ error: "Failed to authenticate user" });
  }
});

// Admin promotion API simulation (performs role changes on the db-users table)
app.post("/api/user/promote", (req, res) => {
  try {
    const email = (req.body.email || "").toString().trim().toLowerCase();
    const role = (req.body.role || "user").toString();
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    if (role !== "admin" && role !== "user") {
      return res.status(400).json({ error: "Invalid role. Must be 'user' or 'admin'" });
    }

    const users = loadUsersFromFile();
    let user = users.find(u => u.email === email);

    if (!user) {
      const newId = 'usr_' + Math.random().toString(36).substring(2, 11);
      user = {
        id: newId,
        email: email,
        role: role as "user" | "admin",
        created_at: new Date().toISOString()
      };
      users.push(user);
    } else {
      user.role = role as "user" | "admin";
    }

    saveUsersToFile(users);
    console.log(`[Admin Role Change] Manually set role of ${email} to ${role}`);
    return res.json({ success: true, user });
  } catch (err) {
    console.error("Error in POST /api/user/promote:", err);
    res.status(500).json({ error: "Failed to update user role" });
  }
});

// 1. Get favorite match IDs of an active user session
app.get("/api/favorites", (req, res) => {
  try {
    const userId = (req.query.userId || "").toString();
    if (!userId) {
      return res.status(400).json({ error: "userId query parameter is required" });
    }
    const allFavs = loadFavoritesFromFile();
    const userFavIds = allFavs
      .filter(item => item.userId === userId)
      .map(item => item.matchId);
    
    return res.json({ favorites: userFavIds });
  } catch (err) {
    console.error("Error in GET /api/favorites:", err);
    res.status(500).json({ error: "Failed to load user favorites" });
  }
});

// 2. Toggle or set favorite state for a specific match and user
app.post("/api/favorites", (req, res) => {
  try {
    const { userId, matchId, isFavorite } = req.body;
    if (!userId || !matchId) {
      return res.status(400).json({ error: "userId and matchId are required in body" });
    }

    let allFavs = loadFavoritesFromFile();
    
    // Remove if exists
    allFavs = allFavs.filter(item => !(item.userId === userId && item.matchId === matchId));
    
    // Add if favorited
    if (isFavorite) {
      allFavs.push({ userId, matchId });
    }

    saveFavoritesToFile(allFavs);

    const userFavIds = allFavs
      .filter(item => item.userId === userId)
      .map(item => item.matchId);

    return res.json({ success: true, favorites: userFavIds });
  } catch (err) {
    console.error("Error in POST /api/favorites:", err);
    res.status(500).json({ error: "Failed to update user favorite status" });
  }
});

// 3. Get view prediction analysis history of user
app.get("/api/history", (req, res) => {
  try {
    const userId = (req.query.userId || "").toString();
    if (!userId) {
      return res.status(400).json({ error: "userId query parameter is required" });
    }
    const allHistory = loadHistoryFromFile();
    const userHistory = allHistory
      .filter(item => item.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first
    
    return res.json({ history: userHistory });
  } catch (err) {
    console.error("Error in GET /api/history:", err);
    res.status(500).json({ error: "Failed to load user prediction history" });
  }
});

// 4. Save a prediction view entry
app.post("/api/history", (req, res) => {
  try {
    const { userId, matchId, homeTeam, awayTeam, homeFlag, awayFlag, winner, score } = req.body;
    if (!userId || !matchId) {
      return res.status(400).json({ error: "userId and matchId are required inside body" });
    }

    const allHistory = loadHistoryFromFile();
    
    // Check if we already registered this match ID within the past minute to avoid double submissions
    const now = Date.now();
    const isDuplicate = allHistory.some(h => 
      h.userId === userId && 
      h.matchId === matchId && 
      (now - h.timestamp < 10000) // 10 seconds debounce
    );

    if (!isDuplicate) {
      const newItem: HistoryItem = {
        userId,
        matchId,
        homeTeam: homeTeam || "Équipe Home",
        awayTeam: awayTeam || "Équipe Away",
        homeFlag: homeFlag || "🏳️",
        awayFlag: awayFlag || "🏳️",
        winner: winner || "À déterminer",
        score: score || "N/A",
        timestamp: now
      };
      allHistory.push(newItem);
      saveHistoryToFile(allHistory);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Error in POST /api/history:", err);
    res.status(500).json({ error: "Failed to record prediction analysis history" });
  }
});

// ----------------------------------------------------
// VITE DEV / PRODUCTION FLOW MIDDLEWARE
// ----------------------------------------------------
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false // Disable HMR to prevent WebSocket console errors
      },
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

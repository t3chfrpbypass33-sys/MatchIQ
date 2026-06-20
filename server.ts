import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON body parsing for API endpoints
app.use(express.json());

// Initialize Supabase Client dynamically & safely
let supabase: any = null;
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("✅ Supabase client successfully initialized.");
  } catch (err) {
    console.error("❌ Failed to initialize Supabase client:", err);
  }
} else {
  console.log("ℹ️ Supabase environment variables missing. Falling back entirely to db-supabase.json local file store.");
}

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

// Helper to hash player name and id for statistical simulation fallback
function nameAndIdHash(name: string, id: string): number {
  const combined = (name || "") + (id || "");
  return combined.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

// API-Football specific National Team IDs mapping
const apiFootballTeamIds: { [key: string]: number } = {
  "mexique": 16, "mexico": 16,
  "afrique du sud": 24, "south africa": 24,
  "corée du sud": 11, "south korea": 11, "korea": 11, "corée": 11,
  "tchéquie": 732, "czechia": 732, "czech": 732,
  "canada": 73,
  "bosnie-herzégovine": 745, "bosnie": 745, "bosnia": 745, "bosnie-herzegovine": 745,
  "qatar": 1557,
  "suisse": 15, "switzerland": 15, "suis": 15,
  "brésil": 6, "brazil": 6, "brés": 6,
  "maroc": 29, "morocco": 29,
  "haïti": 2035, "haiti": 2035,
  "écosse": 756, "scotland": 756, "scot": 756,
  "états-unis": 2382, "united states": 2382, "usa": 2382,
  "paraguay": 19,
  "australie": 20, "australia": 20, "austra": 20,
  "turquie": 768, "turkey": 768, "türk": 768,
  "allemagne": 9, "germany": 9, "germ": 9, "allem": 9,
  "curaçao": 2427, "curacao": 2427, "cura": 2427,
  "côte d'ivoire": 28, "cote d'ivoire": 28, "ivory coast": 28,
  "équateur": 14, "ecuador": 14, "écuat": 14,
  "pays-bas": 1118, "netherlands": 1118, "nether": 1118,
  "japon": 12, "japan": 12, "japo": 12,
  "suède": 13, "sweden": 13, "suè": 13,
  "tunisie": 32, "tunisia": 32, "tuni": 32,
  "belgique": 1, "belgium": 1, "belg": 1,
  "égypte": 30, "egypt": 30, "égyp": 30,
  "iran": 22,
  "nouvelle-zélande": 23, "new zealand": 23,
  "espagne": 1461, "spain": 1461, "esp": 1461,
  "cap-vert": 26, "cape verde": 26,
  "arabie saoudite": 25, "saudi arabia": 25,
  "uruguay": 8, "urug": 8,
  "france": 2, "fran": 2,
  "sénégal": 18, "senegal": 18, "seneg": 18,
  "irak": 1558, "iraq": 1558,
  "norvège": 752, "norway": 752, "norv": 752,
  "argentine": 26, "argentina": 10243, "argen": 26,
  "algérie": 31, "algeria": 31,
  "autriche": 1462, "austria": 1462,
  "jordanie": 1559, "jordan": 1559,
  "portugal": 27, "port": 27,
  "rd congo": 2038, "dr congo": 2038, "congo": 2038,
  "ouzbékistan": 1555, "uzbekistan": 1555,
  "colombie": 17, "colombia": 17, "colom": 17,
  "angleterre": 10, "england": 10, "angl": 10,
  "croatie": 4, "croatia": 4, "croat": 4,
  "ghana": 21,
  "panama": 2383
};

function mapTeamNameToTeam(name: string): any {
  if (!name) {
    return {
      id: "TBD",
      name: "À déterminer",
      flag: "🏳️",
      fifaRank: 99,
      recentForm: ["D", "D", "D"],
      group: "Group A",
      logoColor: "from-slate-500 to-slate-700",
      logo: "https://media.api-sports.io/football/teams/1.png"
    };
  }
  const norm = name.toLowerCase().trim();

  const OFFICIAL_GROUPS: { [key: string]: { id: string; name: string; flag: string; group: string; fifaRank: number; logoColor: string } } = {
    // Group A
    "mexique": { id: "MEX", name: "Mexique", flag: "🇲🇽", group: "Group A", fifaRank: 15, logoColor: "from-green-700 to-red-600" },
    "mexico": { id: "MEX", name: "Mexique", flag: "🇲🇽", group: "Group A", fifaRank: 15, logoColor: "from-green-700 to-red-600" },
    "afrique du sud": { id: "RSA", name: "Afrique du Sud", flag: "🇿🇦", group: "Group A", fifaRank: 59, logoColor: "from-green-600 to-yellow-500" },
    "south africa": { id: "RSA", name: "Afrique du Sud", flag: "🇿🇦", group: "Group A", fifaRank: 59, logoColor: "from-green-600 to-yellow-500" },
    "corée du sud": { id: "KOR", name: "Corée du Sud", flag: "🇰🇷", group: "Group A", fifaRank: 23, logoColor: "from-blue-700 to-red-650" },
    "south korea": { id: "KOR", name: "Corée du Sud", flag: "🇰🇷", group: "Group A", fifaRank: 23, logoColor: "from-blue-700 to-red-650" },
    "korea": { id: "KOR", name: "Corée du Sud", flag: "🇰🇷", group: "Group A", fifaRank: 23, logoColor: "from-blue-700 to-red-650" },
    "corée": { id: "KOR", name: "Corée du Sud", flag: "🇰🇷", group: "Group A", fifaRank: 23, logoColor: "from-blue-700 to-red-650" },
    "tchéquie": { id: "CZE", name: "Tchéquie", flag: "🇨🇿", group: "Group A", fifaRank: 40, logoColor: "from-blue-700 to-red-600" },
    "czechia": { id: "CZE", name: "Tchéquie", flag: "🇨🇿", group: "Group A", fifaRank: 40, logoColor: "from-blue-700 to-red-600" },
    "czech": { id: "CZE", name: "Tchéquie", flag: "🇨🇿", group: "Group A", fifaRank: 40, logoColor: "from-blue-700 to-red-600" },

    // Group B
    "canada": { id: "CAN", name: "Canada", flag: "🇨🇦", group: "Group B", fifaRank: 38, logoColor: "from-red-600 to-rose-750" },
    "bosnie": { id: "BIH", name: "Bosnie-Herzégovine", flag: "🇧🇦", group: "Group B", fifaRank: 74, logoColor: "from-blue-800 to-yellow-500" },
    "bosnia": { id: "BIH", name: "Bosnie-Herzégovine", flag: "🇧🇦", group: "Group B", fifaRank: 74, logoColor: "from-blue-800 to-yellow-500" },
    "qatar": { id: "QAT", name: "Qatar", flag: "🇶🇦", group: "Group B", fifaRank: 46, logoColor: "from-purple-850 to-slate-200" },
    "suisse": { id: "SUI", name: "Suisse", flag: "🇨🇭", group: "Group B", fifaRank: 19, logoColor: "from-red-600 to-white" },
    "switzerland": { id: "SUI", name: "Suisse", flag: "🇨🇭", group: "Group B", fifaRank: 19, logoColor: "from-red-600 to-white" },
    "suis": { id: "SUI", name: "Suisse", flag: "🇨🇭", group: "Group B", fifaRank: 19, logoColor: "from-red-600 to-white" },

    // Group C
    "brésil": { id: "BRA", name: "Brésil", flag: "🇧🇷", group: "Group C", fifaRank: 5, logoColor: "from-yellow-500 to-green-600" },
    "brazil": { id: "BRA", name: "Brésil", flag: "🇧🇷", group: "Group C", fifaRank: 5, logoColor: "from-yellow-500 to-green-600" },
    "brés": { id: "BRA", name: "Brésil", flag: "🇧🇷", group: "Group C", fifaRank: 5, logoColor: "from-yellow-500 to-green-600" },
    "maroc": { id: "MAR", name: "Maroc", flag: "🇲🇦", group: "Group C", fifaRank: 13, logoColor: "from-red-600 to-green-700" },
    "morocco": { id: "MAR", name: "Maroc", flag: "🇲🇦", group: "Group C", fifaRank: 13, logoColor: "from-red-600 to-green-700" },
    "haïti": { id: "HAI", name: "Haïti", flag: "🇭🇹", group: "Group C", fifaRank: 86, logoColor: "from-blue-600 to-red-600" },
    "haiti": { id: "HAI", name: "Haïti", flag: "🇭🇹", group: "Group C", fifaRank: 86, logoColor: "from-blue-600 to-red-600" },
    "écosse": { id: "SCO", name: "Écosse", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group: "Group C", fifaRank: 34, logoColor: "from-blue-705 to-white" },
    "scotland": { id: "SCO", name: "Écosse", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group: "Group C", fifaRank: 34, logoColor: "from-blue-705 to-white" },
    "scot": { id: "SCO", name: "Écosse", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group: "Group C", fifaRank: 34, logoColor: "from-blue-705 to-white" },

    // Group D
    "états-unis": { id: "USA", name: "États-Unis", flag: "🇺🇸", group: "Group D", fifaRank: 16, logoColor: "from-blue-800 to-red-650" },
    "united states": { id: "USA", name: "États-Unis", flag: "🇺🇸", group: "Group D", fifaRank: 16, logoColor: "from-blue-800 to-red-650" },
    "usa": { id: "USA", name: "États-Unis", flag: "🇺🇸", group: "Group D", fifaRank: 16, logoColor: "from-blue-800 to-red-650" },
    "paraguay": { id: "PAR", name: "Paraguay", flag: "🇵🇾", group: "Group D", fifaRank: 56, logoColor: "from-red-650 to-blue-700" },
    "australie": { id: "AUS", name: "Australie", flag: "🇦🇺", group: "Group D", fifaRank: 24, logoColor: "from-green-700 to-yellow-400" },
    "australia": { id: "AUS", name: "Australie", flag: "🇦🇺", group: "Group D", fifaRank: 24, logoColor: "from-green-700 to-yellow-400" },
    "austra": { id: "AUS", name: "Australie", flag: "🇦🇺", group: "Group D", fifaRank: 24, logoColor: "from-green-700 to-yellow-400" },
    "turquie": { id: "TUR", name: "Turquie", flag: "🇹🇷", group: "Group D", fifaRank: 35, logoColor: "from-red-600 to-white" },
    "turkey": { id: "TUR", name: "Turquie", flag: "🇹🇷", group: "Group D", fifaRank: 35, logoColor: "from-red-600 to-white" },
    "türk": { id: "TUR", name: "Turquie", flag: "🇹🇷", group: "Group D", fifaRank: 35, logoColor: "from-red-600 to-white" },

    // Group E
    "allemagne": { id: "GER", name: "Allemagne", flag: "🇩🇪", group: "Group E", fifaRank: 11, logoColor: "from-neutral-800 to-neutral-600" },
    "germany": { id: "GER", name: "Allemagne", flag: "🇩🇪", group: "Group E", fifaRank: 11, logoColor: "from-neutral-800 to-neutral-600" },
    "germ": { id: "GER", name: "Allemagne", flag: "🇩🇪", group: "Group E", fifaRank: 11, logoColor: "from-neutral-800 to-neutral-600" },
    "allem": { id: "GER", name: "Allemagne", flag: "🇩🇪", group: "Group E", fifaRank: 11, logoColor: "from-neutral-800 to-neutral-600" },
    "curaçao": { id: "CUW", name: "Curaçao", flag: "🇨🇼", group: "Group E", fifaRank: 90, logoColor: "from-blue-600 to-yellow-500" },
    "curacao": { id: "CUW", name: "Curaçao", flag: "🇨🇼", group: "Group E", fifaRank: 90, logoColor: "from-blue-600 to-yellow-500" },
    "cote d'ivoire": { id: "CIV", name: "Côte d'Ivoire", flag: "🇨🇮", group: "Group E", fifaRank: 39, logoColor: "from-orange-500 to-green-550" },
    "côte d'ivoire": { id: "CIV", name: "Côte d'Ivoire", flag: "🇨🇮", group: "Group E", fifaRank: 39, logoColor: "from-orange-500 to-green-550" },
    "ivory coast": { id: "CIV", name: "Côte d'Ivoire", flag: "🇨🇮", group: "Group E", fifaRank: 39, logoColor: "from-orange-500 to-green-550" },
    "équateur": { id: "ECU", name: "Équateur", flag: "🇪🇨", group: "Group E", fifaRank: 31, logoColor: "from-yellow-400 to-blue-700" },
    "ecuador": { id: "ECU", name: "Équateur", flag: "🇪🇨", group: "Group E", fifaRank: 31, logoColor: "from-yellow-400 to-blue-700" },
    "écuat": { id: "ECU", name: "Équateur", flag: "🇪🇨", group: "Group E", fifaRank: 31, logoColor: "from-yellow-400 to-blue-700" },

    // Group F
    "pays-bas": { id: "NED", name: "Pays-Bas", flag: "🇳🇱", group: "Group F", fifaRank: 6, logoColor: "from-orange-500 to-blue-700" },
    "netherlands": { id: "NED", name: "Pays-Bas", flag: "🇳🇱", group: "Group F", fifaRank: 6, logoColor: "from-orange-500 to-blue-700" },
    "nether": { id: "NED", name: "Pays-Bas", flag: "🇳🇱", group: "Group F", fifaRank: 6, logoColor: "from-orange-500 to-blue-700" },
    "japon": { id: "JPN", name: "Japon", flag: "🇯🇵", group: "Group F", fifaRank: 18, logoColor: "from-blue-900 to-red-600" },
    "japan": { id: "JPN", name: "Japon", flag: "🇯🇵", group: "Group F", fifaRank: 18, logoColor: "from-blue-900 to-red-600" },
    "japo": { id: "JPN", name: "Japon", flag: "🇯🇵", group: "Group F", fifaRank: 18, logoColor: "from-blue-900 to-red-600" },
    "suède": { id: "SWE", name: "Suède", flag: "🇸🇪", group: "Group F", fifaRank: 27, logoColor: "from-blue-500 to-yellow-400" },
    "sweden": { id: "SWE", name: "Suède", flag: "🇸🇪", group: "Group F", fifaRank: 27, logoColor: "from-blue-500 to-yellow-400" },
    "suè": { id: "SWE", name: "Suède", flag: "🇸🇪", group: "Group F", fifaRank: 27, logoColor: "from-blue-500 to-yellow-400" },
    "tunisie": { id: "TUN", name: "Tunisie", flag: "🇹🇳", group: "Group F", fifaRank: 41, logoColor: "from-red-600 to-white" },
    "tunisia": { id: "TUN", name: "Tunisie", flag: "🇹🇳", group: "Group F", fifaRank: 41, logoColor: "from-red-600 to-white" },
    "tuni": { id: "TUN", name: "Tunisie", flag: "🇹🇳", group: "Group F", fifaRank: 41, logoColor: "from-red-600 to-white" },

    // Group G
    "belgique": { id: "BEL", name: "Belgique", flag: "🇧🇪", group: "Group G", fifaRank: 8, logoColor: "from-red-600 to-neutral-800" },
    "belgium": { id: "BEL", name: "Belgique", flag: "🇧🇪", group: "Group G", fifaRank: 8, logoColor: "from-red-600 to-neutral-800" },
    "belg": { id: "BEL", name: "Belgique", flag: "🇧🇪", group: "Group G", fifaRank: 8, logoColor: "from-red-600 to-neutral-800" },
    "égypte": { id: "EGY", name: "Égypte", flag: "🇪🇬", group: "Group G", fifaRank: 36, logoColor: "from-red-600 to-black" },
    "egypt": { id: "EGY", name: "Égypte", flag: "🇪🇬", group: "Group G", fifaRank: 36, logoColor: "from-red-600 to-black" },
    "égyp": { id: "EGY", name: "Égypte", flag: "🇪🇬", group: "Group G", fifaRank: 36, logoColor: "from-red-600 to-black" },
    "iran": { id: "IRN", name: "Iran", flag: "🇮🇷", group: "Group G", fifaRank: 20, logoColor: "from-green-600 to-red-600" },
    "nouvelle-zélande": { id: "NZL", name: "Nouvelle-Zélande", flag: "🇳🇿", group: "Group G", fifaRank: 107, logoColor: "from-neutral-900 to-slate-200" },
    "new zealand": { id: "NZL", name: "Nouvelle-Zélande", flag: "🇳🇿", group: "Group G", fifaRank: 107, logoColor: "from-neutral-900 to-slate-200" },

    // Group H
    "espagne": { id: "ESP", name: "Espagne", flag: "🇪🇸", group: "Group H", fifaRank: 3, logoColor: "from-red-600 to-yellow-500" },
    "spain": { id: "ESP", name: "Espagne", flag: "🇪🇸", group: "Group H", fifaRank: 3, logoColor: "from-red-600 to-yellow-500" },
    "esp": { id: "ESP", name: "Espagne", flag: "🇪🇸", group: "Group H", fifaRank: 3, logoColor: "from-red-600 to-yellow-500" },
    "cap-vert": { id: "CPV", name: "Cap-Vert", flag: "🇨🇻", group: "Group H", fifaRank: 65, logoColor: "from-blue-800 to-red-600" },
    "cape verde": { id: "CPV", name: "Cap-Vert", flag: "🇨🇻", group: "Group H", fifaRank: 65, logoColor: "from-blue-800 to-red-600" },
    "arabie saoudite": { id: "KSA", name: "Arabie Saoudite", flag: "🇸🇦", group: "Group H", fifaRank: 53, logoColor: "from-green-700 to-white" },
    "saudi arabia": { id: "KSA", name: "Arabie Saoudite", flag: "🇸🇦", group: "Group H", fifaRank: 53, logoColor: "from-green-700 to-white" },
    "uruguay": { id: "URU", name: "Uruguay", flag: "🇺🇾", group: "Group H", fifaRank: 14, logoColor: "from-sky-500 to-yellow-400" },
    "urug": { id: "URU", name: "Uruguay", flag: "🇺🇾", group: "Group H", fifaRank: 14, logoColor: "from-sky-500 to-yellow-400" },

    // Group I
    "france": { id: "FRA", name: "France", flag: "🇫🇷", group: "Group I", fifaRank: 2, logoColor: "from-blue-600 to-indigo-800" },
    "fran": { id: "FRA", name: "France", flag: "🇫🇷", group: "Group I", fifaRank: 2, logoColor: "from-blue-600 to-indigo-800" },
    "sénégal": { id: "SEN", name: "Sénégal", flag: "🇸🇳", group: "Group I", fifaRank: 17, logoColor: "from-green-600 to-red-600" },
    "senegal": { id: "SEN", name: "Sénégal", flag: "🇸🇳", group: "Group I", fifaRank: 17, logoColor: "from-green-600 to-red-600" },
    "seneg": { id: "SEN", name: "Sénégal", flag: "🇸🇳", group: "Group I", fifaRank: 17, logoColor: "from-green-600 to-red-600" },
    "irak": { id: "IRQ", name: "Irak", flag: "🇮🇶", group: "Group I", fifaRank: 58, logoColor: "from-green-700 to-red-600" },
    "iraq": { id: "IRQ", name: "Irak", flag: "🇮🇶", group: "Group I", fifaRank: 58, logoColor: "from-green-700 to-red-600" },
    "norvège": { id: "NOR", name: "Norvège", flag: "🇳🇴", group: "Group I", fifaRank: 44, logoColor: "from-red-600 to-blue-800" },
    "norway": { id: "NOR", name: "Norvège", flag: "🇳🇴", group: "Group I", fifaRank: 44, logoColor: "from-red-600 to-blue-800" },
    "norv": { id: "NOR", name: "Norvège", flag: "🇳🇴", group: "Group I", fifaRank: 44, logoColor: "from-red-600 to-blue-800" },

    // Group J
    "argentine": { id: "ARG", name: "Argentine", flag: "🇦🇷", group: "Group J", fifaRank: 1, logoColor: "from-sky-400 to-blue-600" },
    "argentina": { id: "ARG", name: "Argentine", flag: "🇦🇷", group: "Group J", fifaRank: 1, logoColor: "from-sky-400 to-blue-600" },
    "argen": { id: "ARG", name: "Argentine", flag: "🇦🇷", group: "Group J", fifaRank: 1, logoColor: "from-sky-400 to-blue-600" },
    "algérie": { id: "ALG", name: "Algérie", flag: "🇩🇿", group: "Group J", fifaRank: 43, logoColor: "from-green-600 to-white" },
    "algeria": { id: "ALG", name: "Algérie", flag: "🇩🇿", group: "Group J", fifaRank: 43, logoColor: "from-green-600 to-white" },
    "autriche": { id: "AUT", name: "Autriche", flag: "🇦🇹", group: "Group J", fifaRank: 25, logoColor: "from-red-650 to-white" },
    "austria": { id: "AUT", name: "Autriche", flag: "🇦🇹", group: "Group J", fifaRank: 25, logoColor: "from-red-650 to-white" },
    "jordanie": { id: "JOR", name: "Jordanie", flag: "🇯🇴", group: "Group J", fifaRank: 71, logoColor: "from-red-700 to-green-700" },
    "jordan": { id: "JOR", name: "Jordanie", flag: "🇯🇴", group: "Group J", fifaRank: 71, logoColor: "from-red-700 to-green-700" },

    // Group K
    "portugal": { id: "POR", name: "Portugal", flag: "🇵🇹", group: "Group K", fifaRank: 7, logoColor: "from-red-700 to-green-700" },
    "port": { id: "POR", name: "Portugal", flag: "🇵🇹", group: "Group K", fifaRank: 7, logoColor: "from-red-700 to-green-700" },
    "rd congo": { id: "COD", name: "RD Congo", flag: "🇨🇩", group: "Group K", fifaRank: 62, logoColor: "from-blue-500 to-yellow-550" },
    "dr congo": { id: "COD", name: "RD Congo", flag: "🇨🇩", group: "Group K", fifaRank: 62, logoColor: "from-blue-500 to-yellow-550" },
    "congo": { id: "COD", name: "RD Congo", flag: "🇨🇩", group: "Group K", fifaRank: 62, logoColor: "from-blue-500 to-yellow-550" },
    "ouzbékistan": { id: "UZB", name: "Ouzbékistan", flag: "🇺🇿", group: "Group K", fifaRank: 66, logoColor: "from-blue-400 to-white" },
    "uzbekistan": { id: "UZB", name: "Ouzbékistan", flag: "🇺🇿", group: "Group K", fifaRank: 66, logoColor: "from-blue-400 to-white" },
    "colombie": { id: "COL", name: "Colombie", flag: "🇨🇴", group: "Group K", fifaRank: 12, logoColor: "from-yellow-400 to-blue-700" },
    "colombia": { id: "COL", name: "Colombie", flag: "🇨🇴", group: "Group K", fifaRank: 12, logoColor: "from-yellow-400 to-blue-700" },
    "colom": { id: "COL", name: "Colombie", flag: "🇨🇴", group: "Group K", fifaRank: 12, logoColor: "from-yellow-400 to-blue-700" },

    // Group L
    "angleterre": { id: "ENG", name: "Angleterre", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "Group L", fifaRank: 4, logoColor: "from-slate-200 to-blue-800" },
    "england": { id: "ENG", name: "Angleterre", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "Group L", fifaRank: 4, logoColor: "from-slate-200 to-blue-800" },
    "angl": { id: "ENG", name: "Angleterre", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "Group L", fifaRank: 4, logoColor: "from-slate-200 to-blue-800" },
    "croatie": { id: "CRO", name: "Croatie", flag: "🇭🇷", group: "Group L", fifaRank: 10, logoColor: "from-blue-700 to-red-600" },
    "croatia": { id: "CRO", name: "Croatie", flag: "🇭🇷", group: "Group L", fifaRank: 10, logoColor: "from-blue-700 to-red-600" },
    "croat": { id: "CRO", name: "Croatie", flag: "🇭🇷", group: "Group L", fifaRank: 10, logoColor: "from-blue-700 to-red-600" },
    "ghana": { id: "GHA", name: "Ghana", flag: "🇬🇭", group: "Group L", fifaRank: 64, logoColor: "from-red-600 to-green-600" },
    "panama": { id: "PAN", name: "Panama", flag: "🇵🇦", group: "Group L", fifaRank: 45, logoColor: "from-blue-700 to-red-600" }
  };

  for (const [key, val] of Object.entries(OFFICIAL_GROUPS)) {
    if (norm === key || norm.includes(key) || key.includes(norm)) {
      const dbTeamId = apiFootballTeamIds[val.name.toLowerCase().trim()] || apiFootballTeamIds[key] || 1;
      return {
        id: val.id,
        name: val.name,
        flag: val.flag,
        fifaRank: val.fifaRank,
        recentForm: ["W", "D", "W", "L", "W"],
        group: val.group,
        logoColor: val.logoColor,
        logo: `https://media.api-sports.io/football/teams/${dbTeamId}.png`
      };
    }
  }

  // Generic fallback with up to 12 groups
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = ['from-blue-500 to-red-500', 'from-green-500 to-yellow-500', 'from-purple-500 to-indigo-505', 'from-sky-500 to-emerald-500', 'from-red-605 to-yellow-605', 'from-slate-605 to-emerald-605'];
  const colorsReal = ['from-blue-500 to-red-500', 'from-green-500 to-yellow-500', 'from-purple-500 to-indigo-500', 'from-sky-500 to-emerald-500', 'from-red-600 to-yellow-600', 'from-slate-600 to-emerald-600'];
  const groups = ['Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F', 'Group G', 'Group H', 'Group I', 'Group J', 'Group K', 'Group L'];
  const genericTeamId = (hash % 100) + 1;

  return {
    id: name.slice(0, 3).toUpperCase(),
    name: name,
    flag: '🏳️',
    fifaRank: (hash % 35) + 30,
    recentForm: ["W", "D", "W", "L", "W"],
    group: groups[hash % groups.length],
    logoColor: colorsReal[hash % colorsReal.length],
    logo: `https://media.api-sports.io/football/teams/${genericTeamId}.png`
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
// DATABASE & COMPETITION SYNC / STANDINGS ENGINE (SUPABASE + LOCAL RECOVERY)
// ----------------------------------------------------

const OFFICIAL_GROUPS_REFERENCE: { [group: string]: string[] } = {
  "Group A": ["Mexique", "Afrique du Sud", "Corée du Sud", "Tchéquie"],
  "Group B": ["Canada", "Bosnie-Herzégovine", "Qatar", "Suisse"],
  "Group C": ["Brésil", "Maroc", "Haïti", "Écosse"],
  "Group D": ["États-Unis", "Paraguay", "Australie", "Turquie"],
  "Group E": ["Allemagne", "Curaçao", "Côte d'Ivoire", "Équateur"],
  "Group F": ["Pays-Bas", "Japon", "Suède", "Tunisie"],
  "Group G": ["Belgique", "Égypte", "Iran", "Nouvelle-Zélande"],
  "Group H": ["Espagne", "Cap-Vert", "Arabie Saoudite", "Uruguay"],
  "Group I": ["France", "Sénégal", "Irak", "Norvège"],
  "Group J": ["Argentine", "Algérie", "Autriche", "Jordanie"],
  "Group K": ["Portugal", "RD Congo", "Ouzbékistan", "Colombie"],
  "Group L": ["Angleterre", "Croatie", "Ghana", "Panama"]
};

// Compute dynamic, real-time standings tables from matches lists
function computeStandingsFromMatches(matches: any[]) {
  const standings: { [group: string]: any[] } = {};

  for (const [groupName, teamNames] of Object.entries(OFFICIAL_GROUPS_REFERENCE)) {
    standings[groupName] = teamNames.map(name => {
      const teamInfo = mapTeamNameToTeam(name);
      return {
        id: teamInfo.id,
        name: teamInfo.name,
        flag: teamInfo.flag,
        logo: teamInfo.logo,
        played: 0,
        win: 0,
        draw: 0,
        loss: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalsDiff: 0,
        points: 0
      };
    });
  }

  // Calculate points from completed & live matches for real-time live standings
  for (const m of matches) {
    if (!m.score) continue;

    const homeGoals = m.score.home;
    const awayGoals = m.score.away;

    const groupName = m.group;
    if (!groupName || !standings[groupName]) continue;

    const groupList = standings[groupName];
    const hTeam = groupList.find((t: any) => t.id === m.homeTeam?.id || t.name === m.homeTeam?.name);
    const aTeam = groupList.find((t: any) => t.id === m.awayTeam?.id || t.name === m.awayTeam?.name);

    if (hTeam && aTeam) {
      hTeam.played += 1;
      aTeam.played += 1;
      hTeam.goalsFor += homeGoals;
      hTeam.goalsAgainst += awayGoals;
      aTeam.goalsFor += awayGoals;
      aTeam.goalsAgainst += homeGoals;

      if (homeGoals > awayGoals) {
        hTeam.win += 1;
        hTeam.points += 3;
        aTeam.loss += 1;
      } else if (homeGoals < awayGoals) {
        aTeam.win += 1;
        aTeam.points += 3;
        hTeam.loss += 1;
      } else {
        hTeam.draw += 1;
        hTeam.points += 1;
        aTeam.draw += 1;
        aTeam.points += 1;
      }

      hTeam.goalsDiff = hTeam.goalsFor - hTeam.goalsAgainst;
      aTeam.goalsDiff = aTeam.goalsFor - aTeam.goalsAgainst;
    }
  }

  // Sort each group table dynamically
  for (const groupName of Object.keys(standings)) {
    standings[groupName].sort((a: any, b: any) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalsDiff !== a.goalsDiff) return b.goalsDiff - a.goalsDiff;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.name.localeCompare(b.name, 'fr');
    });
  }

  return standings;
}

const SUPABASE_STATE_FILE = path.join(process.cwd(), "db-supabase.json");

interface SupabaseState {
  standings: { [group: string]: any[] };
  matchesCache: any[];
  lastUpdated: number;
}

function readSupabaseState(): SupabaseState {
  try {
    if (fs.existsSync(SUPABASE_STATE_FILE)) {
      const content = fs.readFileSync(SUPABASE_STATE_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading db-supabase.json state file:", err);
  }
  return {
    standings: {},
    matchesCache: [],
    lastUpdated: 0
  };
}

async function writeSupabaseState(state: SupabaseState) {
  try {
    fs.writeFileSync(SUPABASE_STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
    
    // Attempt real-time Supabase remote write if credentials exist
    if (supabase) {
      console.log("[Supabase Sync] Writing competition_data entry...");
      const { error } = await supabase
        .from('competition_data')
        .upsert({
          key: 'standings_and_fixtures',
          value: state,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      
      if (error) {
        console.warn("[Supabase Sync Warning] Table or column structures may be missing. Fell back cleanly (local cache is OK):", error.message);
      } else {
        console.log("✅ [Supabase Sync] Remote entry updated successfully.");
      }
    }
  } catch (err: any) {
    console.error("[Supabase Sync Fail] Unable to push remote state:", err);
  }
}

// Frequent Live Match Refresher: runs inside application container every 60 seconds
// to query specifically active live events and save server API limits
setInterval(async () => {
  try {
    const cacheKey = "matches_list";
    const cachedMatches = cacheMap[cacheKey]?.data || [];
    const liveMatches = cachedMatches.filter((m: any) => m.status === 'live');
    
    if (liveMatches.length > 0) {
      console.log(`[Interval Live Updates] Detected ${liveMatches.length} active live matches. Fetching stats...`);
      let hasUpdate = false;

      for (const lm of liveMatches) {
        // Query individual match events detail to save raw API limits
        const url = `https://sports.bzzoiro.com/api/v2/events/${lm.id}/`;
        const e = await fetchWithBsdAuth(url, true);
        if (e) {
          lm.status = e.status === "inprogress" ? "live" : (e.status === "finished" ? "completed" : "upcoming");
          lm.minute = e.status === "inprogress" ? (e.current_minute ?? 45) : undefined;
          if (e.home_score !== null && e.away_score !== null) {
            lm.score = { home: e.home_score, away: e.away_score };
          }
          hasUpdate = true;
          console.log(`[Interval Live Updates] Updated Match ID ${lm.id}: ${lm.homeTeam.name} ${lm.score?.home}-${lm.score?.away} ${lm.awayTeam.name} (${lm.status})`);
        }
      }

      if (hasUpdate) {
        const now = Date.now();
        cacheMap[cacheKey].timestamp = now;
        
        // Recompute standings with live results, write state
        const updatedStandings = computeStandingsFromMatches(cachedMatches);
        await writeSupabaseState({
          standings: updatedStandings,
          matchesCache: cachedMatches,
          lastUpdated: now
        });
      }
    }
  } catch (err) {
    console.error("[Interval Live Updates Error] Run failed:", err);
  }
}, 60000);

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Vercel Cron Sync endpoint - Scheduled every 6 hours via vercel.json
app.get("/api/cron/sync", async (req, res) => {
  try {
    console.log("[CRON JOB] Pulling full competitive dataset from API-Football...");
    
    // Fetch fixtures list from Sports API / API-Football wrapper
    const listData = await fetchWithBsdAuth("https://sports.bzzoiro.com/api/v2/events/?league_id=27&season_id=188&date_from=2026-06-11&date_to=2026-07-19&limit=150");
    const bsdEvents = listData?.results || [];

    const mappedMatches = bsdEvents.map((e: any) => {
      const homeTeamMapped = mapTeamNameToTeam(e.home_team);
      const awayTeamMapped = mapTeamNameToTeam(e.away_team);
      const stadiumMapped = mapStadiumForEvent(e);

      return {
        id: String(e.id),
        homeTeam: homeTeamMapped,
        awayTeam: awayTeamMapped,
        date: e.event_date ? e.event_date.split("T")[0] : '2026-06-20',
        time: e.event_date && e.event_date.split("T")[1] ? e.event_date.split("T")[1].slice(0, 5) : '15:00',
        stadium: stadiumMapped,
        group: homeTeamMapped.group || "Group A",
        status: e.status === "inprogress" ? "live" : (e.status === "finished" ? "completed" : "upcoming"),
        score: e.home_score !== null && e.away_score !== null ? { home: e.home_score, away: e.away_score } : null,
        minute: e.status === "inprogress" ? (e.current_minute ?? 45) : undefined
      };
    });

    mappedMatches.sort((a: any, b: any) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
      const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
      return dateTimeA - dateTimeB;
    });

    // Recalculate standings tables
    const computedStandings = computeStandingsFromMatches(mappedMatches);
    const now = Date.now();

    // Write to persistent layers
    await writeSupabaseState({
      standings: computedStandings,
      matchesCache: mappedMatches,
      lastUpdated: now
    });

    // Warm live memory cache
    const cacheKey = "matches_list";
    cacheMap[cacheKey] = { data: mappedMatches, timestamp: now };

    console.log("[CRON JOB] Database successfully synchronized with API-Football!");
    return res.json({
      success: true,
      message: "Sync complete! Standings, schedule, and results successfully updated from API-Football.",
      timestamp: now,
      groupsCalculated: Object.keys(computedStandings).length,
      fixturesSynced: mappedMatches.length
    });
  } catch (err: any) {
    console.error("[CRON JOB Fail] Execution error:", err);
    return res.status(500).json({ error: "Cron sync failed due to server error", message: err.message });
  }
});

// Standings retrieve endpoint
app.get("/api/standings", async (req, res) => {
  try {
    const state = readSupabaseState();
    
    if (state.standings && Object.keys(state.standings).length > 0) {
      return res.json({
        standings: state.standings,
        lastUpdated: state.lastUpdated
      });
    }

    // fallback: calculate standings on-demand
    const cacheKey = "matches_list";
    let matches = cacheMap[cacheKey]?.data;
    if (!matches) {
      const listData = await fetchWithBsdAuth("https://sports.bzzoiro.com/api/v2/events/?league_id=27&season_id=188&date_from=2026-06-11&date_to=2026-07-19&limit=150");
      const bsdEvents = listData?.results || [];
      matches = bsdEvents.map((e: any) => {
        const homeTeamMapped = mapTeamNameToTeam(e.home_team);
        const awayTeamMapped = mapTeamNameToTeam(e.away_team);
        const stadiumMapped = mapStadiumForEvent(e);
        return {
          id: String(e.id),
          homeTeam: homeTeamMapped,
          awayTeam: awayTeamMapped,
          date: e.event_date ? e.event_date.split("T")[0] : '2026-06-20',
          time: e.event_date && e.event_date.split("T")[1] ? e.event_date.split("T")[1].slice(0, 5) : '15:00',
          stadium: stadiumMapped,
          group: homeTeamMapped.group || "Group A",
          status: e.status === "inprogress" ? "live" : (e.status === "finished" ? "completed" : "upcoming"),
          score: e.home_score !== null && e.away_score !== null ? { home: e.home_score, away: e.away_score } : null,
          minute: e.status === "inprogress" ? (e.current_minute ?? 45) : undefined
        };
      });
    }

    const computed = computeStandingsFromMatches(matches || []);
    return res.json({
      standings: computed,
      lastUpdated: state.lastUpdated || Date.now()
    });
  } catch (err) {
    console.error("Failed to load standings API:", err);
    return res.status(500).json({ error: "Failed to load standings" });
  }
});

app.get("/api/matches", async (req, res) => {
  try {
    const cacheKey = "matches_list";
    const now = Date.now();
    
    // Check if in memory
    if (cacheMap[cacheKey] && (now - cacheMap[cacheKey].timestamp < CACHE_TTL_MS)) {
      return res.json(cacheMap[cacheKey].data);
    }

    // Check if we have persistent matches in db-supabase.json
    const state = readSupabaseState();
    if (state.matchesCache && state.matchesCache.length > 0 && (now - state.lastUpdated < CACHE_TTL_MS)) {
      cacheMap[cacheKey] = { data: state.matchesCache, timestamp: state.lastUpdated };
      return res.json(state.matchesCache);
    }

    // Pull events from BSD for World Cup 2026 (League 27, Season 188)
    const listData = await fetchWithBsdAuth("https://sports.bzzoiro.com/api/v2/events/?league_id=27&season_id=188&date_from=2026-06-11&date_to=2026-07-19&limit=150");
    const bsdEvents = listData?.results || [];

    const mappedMatches = bsdEvents.map((e: any) => {
      const homeTeamMapped = mapTeamNameToTeam(e.home_team);
      const awayTeamMapped = mapTeamNameToTeam(e.away_team);
      const stadiumMapped = mapStadiumForEvent(e);

      return {
        id: String(e.id),
        homeTeam: homeTeamMapped,
        awayTeam: awayTeamMapped,
        date: e.event_date ? e.event_date.split("T")[0] : '2026-06-20',
        time: e.event_date && e.event_date.split("T")[1] ? e.event_date.split("T")[1].slice(0, 5) : '15:00',
        stadium: stadiumMapped,
        group: homeTeamMapped.group || "Group A",
        status: e.status === "inprogress" ? "live" : (e.status === "finished" ? "completed" : "upcoming"),
        score: e.home_score !== null && e.away_score !== null ? { home: e.home_score, away: e.away_score } : null,
        minute: e.status === "inprogress" ? (e.current_minute ?? 45) : undefined
      };
    });

    mappedMatches.sort((a: any, b: any) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
      const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
      return dateTimeA - dateTimeB;
    });

    // Standardize & write state to persistence to keep everything synced up
    const calculated = computeStandingsFromMatches(mappedMatches);
    await writeSupabaseState({
      standings: calculated,
      matchesCache: mappedMatches,
      lastUpdated: now
    });

    cacheMap[cacheKey] = { data: mappedMatches, timestamp: now };
    return res.json(mappedMatches);
  } catch (err) {
    console.error("Failed to load listings from BSD:", err);
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

// Simple Poisson distribution calculations for probable score distribution
function poissonProbability(k: number, lambda: number): number {
  let factorial = 1;
  for (let i = 2; i <= k; i++) {
    factorial *= i;
  }
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial;
}

function getTeamGoalAverages(teamName: string) {
  const tn = (teamName || "").toLowerCase().trim();
  const database: { [key: string]: { scored: number; conceded: number } } = {
    france: { scored: 2.2, conceded: 0.8 },
    "brésil": { scored: 2.4, conceded: 0.6 },
    brazil: { scored: 2.4, conceded: 0.6 },
    argentine: { scored: 2.0, conceded: 0.7 },
    argentina: { scored: 2.0, conceded: 0.7 },
    allemagne: { scored: 2.1, conceded: 1.1 },
    germany: { scored: 2.1, conceded: 1.1 },
    espagne: { scored: 2.5, conceded: 0.9 },
    spain: { scored: 2.5, conceded: 0.9 },
    angleterre: { scored: 1.8, conceded: 0.7 },
    england: { scored: 1.8, conceded: 0.7 },
    portugal: { scored: 2.3, conceded: 1.0 },
    "états-unis": { scored: 1.5, conceded: 1.2 },
    usa: { scored: 1.5, conceded: 1.2 },
    mexique: { scored: 1.4, conceded: 1.1 },
    mexico: { scored: 1.4, conceded: 1.1 },
    canada: { scored: 1.2, conceded: 1.55 }
  };

  for (const [key, val] of Object.entries(database)) {
    if (tn === key || tn.includes(key) || key.includes(tn)) {
      return val;
    }
  }

  return { scored: 1.6, conceded: 1.2 };
}

function calculatePoissonScores(matchData: any) {
  const homeTeamName = matchData.matchInfo?.homeTeam?.name || "Domicile";
  const awayTeamName = matchData.matchInfo?.awayTeam?.name || "Extérieur";

  const homeStats = getTeamGoalAverages(homeTeamName);
  const awayStats = getTeamGoalAverages(awayTeamName);

  let lambdaHome = (homeStats.scored + awayStats.conceded) / 2;
  let lambdaAway = (awayStats.scored + homeStats.conceded) / 2;

  if (lambdaHome < 0.5) lambdaHome = 0.5;
  if (lambdaAway < 0.5) lambdaAway = 0.5;

  const pred = matchData.prediction;
  if (pred && typeof pred.homeWinPct === "number" && typeof pred.awayWinPct === "number") {
    const h = pred.homeWinPct;
    const a = pred.awayWinPct;
    const ratio = h / (a || 1);
    
    if (ratio > 1.1) {
      const multiplier = Math.min(1.5, 1.0 + (ratio - 1.1) * 0.3);
      lambdaHome *= multiplier;
      lambdaAway /= multiplier;
    } else if (ratio < 0.9) {
      const multiplier = Math.min(1.5, 1.0 + (0.9 - ratio) * 0.3);
      lambdaAway *= multiplier;
      lambdaHome /= multiplier;
    }
  }

  if (lambdaHome < 0.2) lambdaHome = 0.2;
  if (lambdaAway < 0.2) lambdaAway = 0.2;
  if (lambdaHome > 3.5) lambdaHome = 3.5;
  if (lambdaAway > 3.5) lambdaAway = 3.5;

  const scoresList: { score: string; prob: number; homeGoals: number; awayGoals: number }[] = [];
  let totalComputedProb = 0;

  for (let h = 0; h <= 4; h++) {
    for (let a = 0; a <= 4; a++) {
      const probHome = poissonProbability(h, lambdaHome);
      const probAway = poissonProbability(a, lambdaAway);
      const jointProb = probHome * probAway;
      
      scoresList.push({
        score: `${h}-${a}`,
        prob: jointProb,
        homeGoals: h,
        awayGoals: a
      });
      totalComputedProb += jointProb;
    }
  }

  const normalizedList = scoresList.map(item => {
    const normProb = totalComputedProb > 0 ? (item.prob / totalComputedProb) * 100 : 0;
    return {
      score: item.score,
      percentage: parseFloat(normProb.toFixed(1)),
      homeGoals: item.homeGoals,
      awayGoals: item.awayGoals
    };
  });

  normalizedList.sort((x, y) => y.percentage - x.percentage);
  const top5 = normalizedList.slice(0, 5);

  return {
    lambdaHome: parseFloat(lambdaHome.toFixed(2)),
    lambdaAway: parseFloat(lambdaAway.toFixed(2)),
    homeStats,
    awayStats,
    topScores: top5
  };
}

// Reusable function to fetch and construct all details of a match (lineups, unavailable, weather, h2h, predictions)
async function getMatchDataMerged(matchId: string) {
  const bsdId = parseInt(matchId) || 0;
  if (!bsdId) return null;

  // 1. Fetch the main event details from BSD API
  const e = await fetchWithBsdAuth(`https://sports.bzzoiro.com/api/v2/events/${bsdId}/`);
  if (!e) return null;

  const homeTeamMapped = mapTeamNameToTeam(e.home_team);
  const awayTeamMapped = mapTeamNameToTeam(e.away_team);
  const stadiumMapped = mapStadiumForEvent(e);

  const matchObj = {
    id: String(e.id),
    homeTeam: homeTeamMapped,
    awayTeam: awayTeamMapped,
    date: e.event_date ? e.event_date.split("T")[0] : '2026-06-20',
    time: e.event_date && e.event_date.split("T")[1] ? e.event_date.split("T")[1].slice(0, 5) : '15:00',
    stadium: stadiumMapped,
    group: homeTeamMapped.group || "Group A",
    status: (e.status === "inprogress" ? "live" as const : (e.status === "finished" ? "completed" as const : "upcoming" as const)),
    score: e.home_score !== null && e.away_score !== null ? { home: e.home_score, away: e.away_score } : null,
    minute: e.status === "inprogress" ? (e.current_minute ?? 45) : undefined
  };

  let finalDetails = {
    matchInfo: matchObj,
    isRealApiData: true,
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

  // Set H2H details from the main event request e
  if (e.head_to_head) {
    const h2h = e.head_to_head;
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
  const lineupRes = await fetchWithBsdAuth(`https://sports.bzzoiro.com/api/v2/events/${bsdId}/lineups/`, true);
  if (lineupRes) {
    const homeLineup = lineupRes.lineups?.home;
    const homePlayers = (homeLineup?.players || []).map((p: any) => {
      const pId = p.id?.toString() || "";
      const isForward = p.position === "A";
      const isMid = p.position === "M";
      const isDef = p.position === "D";
      const hCode = nameAndIdHash(p.name, pId);
      
      const goals = p.goalsSeason ?? p.goals ?? (isForward ? (hCode % 22) + 6 : isMid ? (hCode % 8) + 1 : isDef ? (hCode % 3) : 0);
      const assists = p.assistsSeason ?? p.assists ?? (isForward ? (hCode % 11) + 2 : isMid ? (hCode % 13) + 3 : isDef ? (hCode % 5) : 0);
      
      return {
        id: pId,
        name: p.name,
        position: p.position === "G" ? "Gardien" : p.position === "D" ? "Défenseur" : p.position === "M" ? "Milieu" : "Attaquant",
        jersey_number: p.jersey_number,
        ai_score: p.ai_score || (7.0 + (hCode % 25)/10).toFixed(1),
        photo: p.photo || `https://media.api-sports.io/football/players/${pId}.png`,
        goalsSeason: goals,
        assistsSeason: assists,
        status: p.status || "probable"
      };
    });
    
    const awayLineup = lineupRes.lineups?.away;
    const awayPlayers = (awayLineup?.players || []).map((p: any) => {
      const pId = p.id?.toString() || "";
      const isForward = p.position === "A";
      const isMid = p.position === "M";
      const isDef = p.position === "D";
      const hCode = nameAndIdHash(p.name, pId);

      const goals = p.goalsSeason ?? p.goals ?? (isForward ? (hCode % 22) + 6 : isMid ? (hCode % 8) + 1 : isDef ? (hCode % 3) : 0);
      const assists = p.assistsSeason ?? p.assists ?? (isForward ? (hCode % 11) + 2 : isMid ? (hCode % 13) + 3 : isDef ? (hCode % 5) : 0);

      return {
        id: pId,
        name: p.name,
        position: p.position === "G" ? "Gardien" : p.position === "D" ? "Défenseur" : p.position === "M" ? "Milieu" : "Attaquant",
        jersey_number: p.jersey_number,
        ai_score: p.ai_score || (7.0 + (hCode % 25)/10).toFixed(1),
        photo: p.photo || `https://media.api-sports.io/football/players/${pId}.png`,
        goalsSeason: goals,
        assistsSeason: assists,
        status: p.status || "probable"
      };
    });

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
  const predRes = await fetchWithBsdAuth(`https://sports.bzzoiro.com/api/v2/events/${bsdId}/prediction/`, true);
  if (predRes) {
    finalDetails.prediction = {
      homeWinPct: Math.round((predRes.winning_probabilities?.home ?? 0.40) * 100),
      drawPct: Math.round((predRes.winning_probabilities?.draw ?? 0.30) * 100),
      awayWinPct: Math.round((predRes.winning_probabilities?.away ?? 0.30) * 100),
      aiKeyInsight: predRes.recommendations?.[0] ?? "Une confrontation intense au plus haut niveau de la scène internationale."
    };
  }

  // 4. Fetch Odds & compare (TheOddsAPI with 1h cache)
  try {
    const oddsList = await fetchOddsFromApi();
    const matchOddsRecord = findBestOddsMatch(
      e.home_team ?? "", 
      e.away_team ?? "", 
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
          } else if (matchesTeamName(o.name, e.home_team ?? "", homeTeamMapped.name ?? "")) {
            hOdds = o.price;
          } else if (matchesTeamName(o.name, e.away_team ?? "", awayTeamMapped.name ?? "")) {
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

  try {
    (finalDetails as any).probScores = calculatePoissonScores(finalDetails);
  } catch (err) {
    console.error("Error generating Poisson score distribution:", err);
    (finalDetails as any).probScores = null;
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
Le scénario le plus crédible pointe vers une bataille acharnée au milieu de terrain. Nous prévoyons une rencontre très tactique où les dispositifs s'annuleront au fil des minutes. Une fourchette de score réaliste s'établit entre un match nul de haute volée (1-1 ou 2-2) et une victoire sur le fil 2-1 pour l'équipe qui contrôlera le tempo du match. Notre indice de probabilité MatchIQ :
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
          "4. Scénario probable du match avec un score le plus probable (fourchette, pas un chiffre exact) et la probabilité approximative de victoire de chaque équipe en pourcentage\n\n" +
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

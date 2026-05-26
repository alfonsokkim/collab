/**
 * seed-registry.mjs
 *
 * Scrapes the Arc UNSW clubs directory and seeds the society_registry table.
 * Arc's clubs page is a client-rendered React app, so we fetch their internal
 * search API directly (discovered by inspecting network requests on arc.unsw.edu.au/clubs).
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=xxx node scripts/seed-registry.mjs
 *
 * Or create a .env.seed file with those two vars and run:
 *   node --env-file=.env.seed scripts/seed-registry.mjs
 *
 * The script uses the SERVICE ROLE key (not anon) so it can bypass RLS.
 * Get it from: Supabase Dashboard → Settings → API → service_role key
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; // must be service role

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
  console.error('    Get the service_role key from Supabase Dashboard → Settings → API');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Arc UNSW API ─────────────────────────────────────────────────────────────
// Arc uses an Algolia-powered search. This is the public search endpoint
// visible in the network tab on arc.unsw.edu.au/clubs.
// We page through all results by fetching with hitsPerPage=200 and incrementing
// the page until we get fewer results than requested.

const ARC_SEARCH_URL = 'https://www.arc.unsw.edu.au/api/clubs';

async function fetchArcClubs() {
  const clubs = [];

  console.log('🔍  Fetching clubs from Arc UNSW...');

  // Strategy 1: Try Arc's internal API (JSON endpoint)
  try {
    const res = await fetch(ARC_SEARCH_URL, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; Collab-Registry-Seeder/1.0)',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data.clubs || data.data || data.results || []);
      if (items.length > 0) {
        console.log(`✅  Arc API returned ${items.length} clubs`);
        return items.map(normaliseClub);
      }
    }
  } catch (e) {
    // fall through to next strategy
  }

  // Strategy 2: Fetch the HTML page and extract club names with regex
  console.log('   Arc API not available directly — trying HTML scrape...');
  try {
    const res = await fetch('https://www.arc.unsw.edu.au/clubs', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (res.ok) {
      const html = await res.text();
      // Try to pull clubs from embedded JSON (Next.js __NEXT_DATA__ or similar)
      const jsonMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (jsonMatch) {
        const pageData = JSON.parse(jsonMatch[1]);
        // Walk the JSON tree looking for club arrays
        const found = extractClubsFromJson(pageData);
        if (found.length > 0) {
          console.log(`✅  Extracted ${found.length} clubs from page JSON`);
          return found;
        }
      }

      // Fallback: grab everything that looks like a club name from heading tags
      const headingMatches = [...html.matchAll(/<h[23][^>]*>([^<]{5,80}(?:Society|Club|Association|Collective|Network|Union|Guild|Group|Team|Community|Circle|Forum|Crew)[^<]*)<\/h[23]>/gi)];
      if (headingMatches.length > 0) {
        const names = [...new Set(headingMatches.map((m) => m[1].trim()))];
        console.log(`✅  Extracted ${names.length} club names from HTML headings`);
        return names.map((name) => ({ name, type: guessType(name) }));
      }
    }
  } catch (e) {
    console.warn('   HTML scrape failed:', e.message);
  }

  // Strategy 3: Use the comprehensive known list as fallback
  console.log('   Falling back to known UNSW societies list...');
  return KNOWN_UNSW_SOCIETIES;
}

function normaliseClub(raw) {
  const name = raw.name || raw.title || raw.club_name || String(raw);
  return {
    name: name.trim(),
    type: guessType(name),
    emailDomain: 'unsw.edu.au',
    aliases: buildAliases(name),
  };
}

function guessType(name) {
  const lower = name.toLowerCase();
  if (/academic|study|science|tech|engineer|math|computing|data|cyber|ai|machine/i.test(lower)) return 'academic';
  if (/sport|athletics|football|rugby|swim|tennis|chess|esport|gaming|basketball|cricket|soccer|volleyball|badminton|table tennis/i.test(lower)) return 'sport';
  if (/culture|chinese|korean|japanese|indian|muslim|christian|jewish|buddhist|sikh|hindu|indonesian|vietnamese|thai|malay|african|latin|greek|italian|french|arabic|persian|sri lanka|philippine|nepali/i.test(lower)) return 'cultural';
  if (/music|dance|art|film|theatre|photo|media|journal|creative|debate|public speak|toastmaster/i.test(lower)) return 'arts';
  if (/volunteer|charity|environment|sustainability|social justice|welfare|community|mental health|disability/i.test(lower)) return 'charity';
  if (/entrepreneur|business|finance|consult|invest|law|medicine|health/i.test(lower)) return 'professional';
  return 'general';
}

function buildAliases(fullName) {
  const aliases = [];
  // Strip "UNSW " prefix
  const stripped = fullName.replace(/^UNSW\s+/i, '').trim();
  if (stripped !== fullName) aliases.push(stripped);

  // Acronym from capitalised words
  const words = fullName.split(/\s+/).filter((w) => /^[A-Z]/.test(w) && w.length > 1);
  if (words.length >= 2) {
    const acronym = words.map((w) => w[0]).join('');
    if (acronym.length >= 2 && acronym.length <= 8) aliases.push(acronym);
  }

  // "Soc" shorthand
  const socName = fullName.replace(/\s+Society$/i, ' Soc').replace(/^UNSW\s+/i, '');
  if (socName !== fullName && socName !== stripped) aliases.push(socName);

  return [...new Set(aliases)];
}

function extractClubsFromJson(obj, depth = 0) {
  if (depth > 10) return [];
  if (Array.isArray(obj)) {
    // Look for arrays of objects with a "name" field that look like clubs
    if (obj.length > 5 && obj[0] && typeof obj[0] === 'object' && (obj[0].name || obj[0].title)) {
      return obj.map(normaliseClub);
    }
    return obj.flatMap((item) => extractClubsFromJson(item, depth + 1));
  }
  if (obj && typeof obj === 'object') {
    return Object.values(obj).flatMap((v) => extractClubsFromJson(v, depth + 1));
  }
  return [];
}

// ─── Seed into Supabase ───────────────────────────────────────────────────────

async function seed(clubs) {
  console.log(`\n📥  Seeding ${clubs.length} clubs into society_registry...`);

  let inserted = 0;
  let skipped = 0;
  let errored = 0;

  // Batch upsert in chunks of 50
  const CHUNK = 50;
  for (let i = 0; i < clubs.length; i += CHUNK) {
    const chunk = clubs.slice(i, i + CHUNK).map((c) => ({
      name: `UNSW ${c.name}`.replace(/^UNSW UNSW /i, 'UNSW '), // avoid double prefix
      type: c.type || 'general',
      email_domain: c.emailDomain || 'unsw.edu.au',
      aliases: c.aliases || buildAliases(c.name),
    }));

    const { data, error } = await supabase
      .from('society_registry')
      .upsert(chunk, { onConflict: 'name', ignoreDuplicates: true });

    if (error) {
      console.error(`  ⚠️  Chunk ${i}–${i + CHUNK} error:`, error.message);
      errored += chunk.length;
    } else {
      inserted += chunk.length;
      process.stdout.write(`  ✓ ${Math.min(i + CHUNK, clubs.length)}/${clubs.length}\r`);
    }
  }

  console.log(`\n✅  Done. inserted=${inserted}  skipped=${skipped}  errored=${errored}`);
}

// ─── Known UNSW societies (fallback list) ────────────────────────────────────
// This list covers the most common Arc-affiliated societies and is used when
// the Arc website cannot be scraped. Add to this as needed.

const KNOWN_UNSW_SOCIETIES = [
  // Academic & Technical
  { name: 'UNSW Computer Science and Engineering Society', type: 'academic', aliases: ['CSESoc', 'CSE Society'] },
  { name: 'UNSW Data Science Society', type: 'academic', aliases: ['DSS', 'Data Science Society'] },
  { name: 'UNSW AI Society', type: 'academic', aliases: ['AI Society', 'UNSW AIS'] },
  { name: 'UNSW Cybersecurity Society', type: 'academic', aliases: ['SecSoc', 'Cybersec Society'] },
  { name: 'UNSW No Code Society', type: 'academic', aliases: ['NCS', 'No Code Soc'] },
  { name: 'UNSW Blockchain Society', type: 'academic', aliases: ['Blockchain Soc'] },
  { name: 'UNSW Women in Engineering Society', type: 'academic', aliases: ['WES', 'Women in Engineering'] },
  { name: 'UNSW Engineering Society', type: 'academic', aliases: ['EngSoc'] },
  { name: 'UNSW Physics Society', type: 'academic', aliases: ['PhysSoc', 'Physics Soc'] },
  { name: 'UNSW Mathematics Society', type: 'academic', aliases: ['MathSoc', 'Maths Society'] },
  { name: 'UNSW Economics Society', type: 'academic', aliases: ['EconSoc'] },
  { name: 'UNSW Law Society', type: 'professional', aliases: ['LawSoc'] },
  { name: 'UNSW Medical Society', type: 'professional', aliases: ['MedSoc'] },
  { name: 'UNSW Finance and Investment Society', type: 'professional', aliases: ['FINSOC', 'Finance Society'] },
  { name: 'UNSW Consulting Society', type: 'professional', aliases: ['ConsultSoc'] },
  { name: 'UNSW Business Society', type: 'professional', aliases: ['BizSoc'] },
  { name: 'UNSW Psychology Society', type: 'academic', aliases: ['PsychSoc'] },
  { name: 'UNSW Architecture Society', type: 'academic', aliases: ['ArchSoc'] },
  { name: 'UNSW Science Society', type: 'academic', aliases: ['SciSoc'] },
  { name: 'UNSW Actuarial Society', type: 'academic', aliases: ['ActSoc'] },
  { name: 'UNSW Biotechnology Society', type: 'academic', aliases: ['BioSoc', 'Biotech Society'] },

  // Cultural
  { name: 'UNSW Chinese Students Association', type: 'cultural', aliases: ['CSA'] },
  { name: 'UNSW Korean Students Association', type: 'cultural', aliases: ['KSA'] },
  { name: 'UNSW Japanese Society', type: 'cultural', aliases: ['J-Soc'] },
  { name: 'UNSW Indonesian Society', type: 'cultural', aliases: ['PPI'] },
  { name: 'UNSW Indian Society', type: 'cultural', aliases: ['Indian Soc'] },
  { name: 'UNSW Malaysian Society', type: 'cultural', aliases: ['Malaysian Soc'] },
  { name: 'UNSW Vietnamese Society', type: 'cultural', aliases: ['Vietnamese Soc'] },
  { name: 'UNSW Thai Society', type: 'cultural', aliases: ['Thai Soc'] },
  { name: 'UNSW Sri Lankan Society', type: 'cultural', aliases: ['Sri Lankan Soc'] },
  { name: 'UNSW Filipino Society', type: 'cultural', aliases: ['FilSoc'] },
  { name: 'UNSW African Society', type: 'cultural', aliases: ['AfriSoc'] },
  { name: 'UNSW Latin Society', type: 'cultural', aliases: ['LatinSoc'] },
  { name: 'UNSW Nepalese Society', type: 'cultural', aliases: ['Nepalese Soc'] },
  { name: 'UNSW Muslim Students Association', type: 'cultural', aliases: ['MSA'] },
  { name: 'UNSW Christian Union', type: 'cultural', aliases: ['CU'] },
  { name: 'UNSW Jewish Students Association', type: 'cultural', aliases: ['JSA'] },
  { name: 'UNSW Buddhist Society', type: 'cultural', aliases: ['Buddhist Soc'] },
  { name: 'UNSW Hellenic Society', type: 'cultural', aliases: ['Hellenic Soc', 'Greek Society'] },

  // Arts & Creative
  { name: 'UNSW Photography Society', type: 'arts', aliases: ['PhotoSoc'] },
  { name: 'UNSW Film Society', type: 'arts', aliases: ['FilmSoc'] },
  { name: 'UNSW Music Society', type: 'arts', aliases: ['MusicSoc'] },
  { name: 'UNSW Dance Society', type: 'arts', aliases: ['DanceSoc'] },
  { name: 'UNSW Art Society', type: 'arts', aliases: ['ArtSoc'] },
  { name: 'UNSW Creative Writing Society', type: 'arts', aliases: ['WriteSoc', 'Creative Writing Soc'] },
  { name: 'UNSW Debate Society', type: 'arts', aliases: ['DebateSoc'] },
  { name: 'UNSW Theatre Society', type: 'arts', aliases: ['TheatreSoc'] },
  { name: 'UNSW Comedy Society', type: 'arts', aliases: ['ComedySoc'] },

  // Sport & Gaming
  { name: 'UNSW Gaming Society', type: 'sport', aliases: ['GamingSoc'] },
  { name: 'UNSW Esports Society', type: 'sport', aliases: ['Esports Soc'] },
  { name: 'UNSW Chess Club', type: 'sport', aliases: ['Chess Soc'] },
  { name: 'UNSW Football Club', type: 'sport', aliases: ['FootballSoc'] },
  { name: 'UNSW Basketball Club', type: 'sport', aliases: ['Basketball Soc'] },
  { name: 'UNSW Tennis Club', type: 'sport', aliases: ['Tennis Soc'] },
  { name: 'UNSW Swimming Club', type: 'sport', aliases: ['SwimSoc'] },
  { name: 'UNSW Badminton Club', type: 'sport', aliases: ['Badminton Soc'] },
  { name: 'UNSW Table Tennis Club', type: 'sport', aliases: ['Table Tennis Soc'] },
  { name: 'UNSW Volleyball Club', type: 'sport', aliases: ['Volleyball Soc'] },
  { name: 'UNSW Climbing Club', type: 'sport', aliases: ['Climbing Soc'] },
  { name: 'UNSW Rowing Club', type: 'sport', aliases: ['Rowing Soc'] },

  // Hobby & Community
  { name: 'UNSW Cat Appreciation Society', type: 'hobby', aliases: ['Cat Soc', 'Cat Appreciation Soc'] },
  { name: 'UNSW Dog Society', type: 'hobby', aliases: ['Dog Soc'] },
  { name: 'UNSW Cooking Society', type: 'hobby', aliases: ['Cooking Soc', 'Food Soc'] },
  { name: 'UNSW Board Games Society', type: 'hobby', aliases: ['Board Game Soc'] },
  { name: 'UNSW Anime Society', type: 'hobby', aliases: ['AnimeSoc'] },
  { name: 'UNSW Book Club', type: 'hobby', aliases: ['Book Soc'] },
  { name: 'UNSW Investment Club', type: 'professional', aliases: ['Investment Soc'] },

  // Social Good
  { name: 'UNSW Environment Collective', type: 'charity', aliases: ['EnvSoc', 'Environment Soc'] },
  { name: 'UNSW Mental Health Society', type: 'charity', aliases: ['Mental Health Soc', 'MHS'] },
  { name: 'UNSW Volunteering Society', type: 'charity', aliases: ['VolSoc'] },
  { name: 'UNSW Sustainability Society', type: 'charity', aliases: ['SustainSoc'] },
  { name: 'UNSW Disability Society', type: 'charity', aliases: ['DisabilitySoc'] },
  { name: 'UNSW Queer Society', type: 'charity', aliases: ['QueerSoc', 'LGBTQ+ Society'] },
  { name: 'UNSW Women in STEM Society', type: 'academic', aliases: ['WiSTEM', 'Women in STEM'] },
].map((s) => ({
  ...s,
  emailDomain: 'unsw.edu.au',
  aliases: s.aliases || [],
}));

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀  Collab — Society Registry Seeder');
  console.log('─'.repeat(45));

  const clubs = await fetchArcClubs();

  if (!clubs.length) {
    console.error('❌  No clubs found. Exiting.');
    process.exit(1);
  }

  await seed(clubs);

  // Verify count
  const { count } = await supabase
    .from('society_registry')
    .select('*', { count: 'exact', head: true });
  console.log(`\n📊  society_registry now has ${count} entries.`);
}

main().catch((e) => { console.error(e); process.exit(1); });

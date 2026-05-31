/**
 * seed-registry.mjs
 *
 * Reads unsw_societies.csv (same directory) and seeds the society_registry table.
 *
 * Usage:
 *   node --env-file=.env.seed scripts/seed-registry.mjs
 *
 * .env.seed needs:
 *   SUPABASE_URL=https://xxx.supabase.co
 *   SUPABASE_SERVICE_KEY=xxx   ← service role key, not anon
 *
 * Get the service_role key from: Supabase Dashboard → Settings → API
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function guessType(name) {
  const lower = name.toLowerCase();
  if (/academic|study|science|tech|engineer|math|computing|data|cyber|ai|machine|physics|chemistry|biology|biotech|actuari|statistic|optometry|pharmacy|nursing|medicine|dental|pre-med|medical/i.test(lower)) return 'academic';
  if (/sport|athletics|football|rugby|swim|tennis|chess|esport|gaming|basketball|cricket|soccer|volleyball|badminton|table tennis|climbing|rowing|sailing|archery|fencing|judo|karate|jiu jitsu|frisbee|hockey|netball|touch/i.test(lower)) return 'sport';
  if (/culture|chinese|korean|japanese|indian|muslim|christian|jewish|buddhist|sikh|hindu|indonesian|vietnamese|thai|malay|african|latin|greek|italian|french|arabic|persian|sri lanka|philippine|nepali|bangladeshi|pakistani|lebanese|iranian|armenian|albanian|romanian|serbian|croatian|ukrainian|hungarian|tibetan|taiwanese|singaporean|turkish|kurdistan|egyptian|sudanese|colombian|brazilian|portuguese|spanish/i.test(lower)) return 'cultural';
  if (/music|dance|art|film|theatre|photo|media|journal|creative|debate|public speak|comedy|illustration|jazz|motion picture/i.test(lower)) return 'arts';
  if (/volunteer|charity|environment|sustainability|social justice|welfare|community|mental health|disability|refugee|global|habitat|amnesty|animal justice|climate/i.test(lower)) return 'charity';
  if (/entrepreneur|business|finance|consult|invest|law|property|real estate|tax|trading|venture|strategy|management|marketing|human resource|impact|social enterprise/i.test(lower)) return 'professional';
  return 'general';
}

function buildAliases(fullName) {
  const aliases = [];

  // Strip "UNSW " prefix
  const stripped = fullName.replace(/^UNSW\s+/i, '').trim();
  if (stripped !== fullName) aliases.push(stripped);

  // Acronym from capitalised words (skip short words like "in", "of", "and")
  const skipWords = new Set(['in', 'of', 'and', 'the', 'for', 'at', 'a']);
  const words = fullName.split(/\s+/).filter((w) => !skipWords.has(w.toLowerCase()) && /^[A-Z]/.test(w));
  if (words.length >= 2) {
    const acronym = words.map((w) => w[0]).join('');
    if (acronym.length >= 2 && acronym.length <= 8) aliases.push(acronym);
  }

  // "Soc" shorthand (without UNSW prefix)
  const socName = stripped.replace(/\s+Society$/i, ' Soc');
  if (socName !== stripped) aliases.push(socName);

  return [...new Set(aliases)];
}

function parseCSV(filePath) {
  const lines = readFileSync(filePath, 'utf8').trim().split('\n');
  // Skip header line
  return lines.slice(1).map((line) => line.trim()).filter(Boolean);
}

async function seed(names) {
  console.log(`Seeding ${names.length} societies into society_registry...`);

  const rows = names.map((name) => ({
    name,
    type: guessType(name),
    email_domain: null,
    aliases: buildAliases(name),
  }));

  let inserted = 0;
  let errored = 0;
  const CHUNK = 50;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase
      .from('society_registry')
      .upsert(chunk, { onConflict: 'name', ignoreDuplicates: true });

    if (error) {
      console.error(`  Chunk ${i}–${i + CHUNK} error:`, error.message);
      errored += chunk.length;
    } else {
      inserted += chunk.length;
      process.stdout.write(`  ${Math.min(i + CHUNK, rows.length)}/${rows.length}\r`);
    }
  }

  console.log(`\nDone. inserted=${inserted}  errored=${errored}`);
}

async function main() {
  const csvPath = join(__dirname, 'unsw_societies.csv');
  const names = parseCSV(csvPath);

  if (!names.length) {
    console.error('No societies found in CSV.');
    process.exit(1);
  }

  await seed(names);

  const { count } = await supabase
    .from('society_registry')
    .select('*', { count: 'exact', head: true });
  console.log(`society_registry now has ${count} entries.`);
}

main().catch((e) => { console.error(e); process.exit(1); });

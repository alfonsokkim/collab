import Fuse from 'fuse.js';
import { supabase } from '../lib/supabase';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface VerificationResult {
  status: VerificationStatus;
  trustScore: number;
  matchedRegistry?: { id: string; name: string; type: string };
  reasons: string[];
}

interface RegistryEntry {
  id: string;
  name: string;
  type: string;
  email_domain?: string;
  aliases?: string[];
}

// Compute a trust score 0–100 based on available signals
export function computeTrustScore(params: {
  email: string;
  societyName: string;
  societyType: string;
  registryMatch?: { score: number; entry: RegistryEntry };
}): { score: number; reasons: string[] } {
  const { email, societyName, societyType, registryMatch } = params;
  const reasons: string[] = [];
  let score = 0;

  // Email domain signals (max 30 pts)
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  if (domain === 'unsw.edu.au') {
    score += 30;
    reasons.push('UNSW email domain (+30)');
  } else if (domain.endsWith('.edu.au') || domain.endsWith('.edu')) {
    score += 15;
    reasons.push('Educational email domain (+15)');
  }

  // Fuzzy registry match (max 50 pts)
  if (registryMatch) {
    // Fuse score: 0 = perfect, 1 = no match. Invert to 0–1 where 1 = perfect.
    const matchQuality = 1 - registryMatch.score;
    const matchPoints = Math.round(matchQuality * 50);
    score += matchPoints;
    reasons.push(`Registry name match ${Math.round(matchQuality * 100)}% (+${matchPoints})`);

    // Bonus: type matches registry type
    if (registryMatch.entry.type.toLowerCase() === societyType.toLowerCase()) {
      score += 10;
      reasons.push('Society type matches registry (+10)');
    }

    // Bonus: email domain matches registry domain
    if (registryMatch.entry.email_domain && domain === registryMatch.entry.email_domain) {
      score += 10;
      reasons.push('Email domain matches registry (+10)');
    }
  } else {
    reasons.push('No registry match found (+0)');
  }

  // Society name quality check (basic spam filter)
  const nameWords = societyName.trim().split(/\s+/).length;
  if (nameWords >= 2) {
    score += 5;
    reasons.push('Multi-word society name (+5)');
  }
  if (societyName.length >= 5 && societyName.length <= 80) {
    score += 5;
    reasons.push('Reasonable name length (+5)');
  }

  return { score: Math.min(score, 100), reasons };
}

// Determine approval outcome from trust score
export function resolveApprovalStatus(trustScore: number): VerificationStatus {
  if (trustScore >= 75) return 'verified';
  if (trustScore >= 40) return 'pending';
  return 'unverified';
}

// Fetch society registry from DB and run fuzzy match
export async function findRegistryMatch(societyName: string): Promise<{
  score: number;
  entry: RegistryEntry;
} | undefined> {
  const { data, error } = await supabase
    .from('society_registry')
    .select('id, name, type, email_domain, aliases');

  if (error || !data?.length) return undefined;

  // Build a flat list of searchable entries (including aliases)
  const searchTargets: { name: string; entry: RegistryEntry }[] = [];
  for (const row of data as RegistryEntry[]) {
    searchTargets.push({ name: row.name, entry: row });
    for (const alias of row.aliases ?? []) {
      searchTargets.push({ name: alias, entry: row });
    }
  }

  const fuse = new Fuse(searchTargets, {
    keys: ['name'],
    threshold: 0.4,
    minMatchCharLength: 3,
    includeScore: true,
    ignoreLocation: true,
  });

  // Search with the original name AND common uni-prefix variants so
  // "Cat Appreciation Society" still matches "UNSW Cat Appreciation Society"
  const uniPrefixes = ['UNSW ', 'USyd ', 'UTS ', 'Macquarie ', 'Western Sydney '];
  const queries = [societyName, ...uniPrefixes.map((p) => p + societyName)];

  type FuseResult = ReturnType<typeof fuse.search>[0];
  let best: FuseResult | undefined;
  for (const q of queries) {
    const results = fuse.search(q);
    if (!results.length) continue;
    if (!best || (results[0].score ?? 1) < (best.score ?? 1)) best = results[0];
  }
  if (!best) return undefined;
  const matchQuality = 1 - (best.score ?? 1);
  if (matchQuality < 0.35) return undefined;

  // Secondary gate: word-overlap check.
  // At least half of the meaningful query words must appear as substrings
  // in the matched name. Prevents "cat soc" → "UNSW Data Science Society"
  // where only "soc" (from "Society") coincidentally matches.
  const queryWords = societyName.toLowerCase().split(/\s+/).filter((w) => w.length >= 3);
  const targetLower = best.item.name.toLowerCase();

  if (queryWords.length > 0) {
    const matchedWords = queryWords.filter((w) => targetLower.includes(w));
    const overlapRatio = matchedWords.length / queryWords.length;
    // Require majority of query words to actually appear in the target name
    if (overlapRatio < 0.5) return undefined;
  }

  return { score: best.score ?? 1, entry: best.item.entry };
}

// Full verification pipeline — call after user account is created
export async function runVerificationPipeline(params: {
  userId: string;
  email: string;
  societyName: string;
  societyType: string;
}): Promise<VerificationResult> {
  const { userId, email, societyName, societyType } = params;

  const registryMatch = await findRegistryMatch(societyName);
  console.log('[Verification] Registry match:', registryMatch ?? 'none');

  const { score: trustScore, reasons } = computeTrustScore({
    email,
    societyName,
    societyType,
    registryMatch,
  });
  const status = resolveApprovalStatus(trustScore);

  console.log('[Verification] Pipeline result:', {
    userId,
    societyName,
    societyType,
    email,
    trustScore,
    status,
    reasons,
    matchedRegistry: registryMatch?.entry ?? null,
  });

  // Persist verification record
  const { error: upsertError } = await supabase.from('verification_requests').upsert({
    user_id: userId,
    society_name: societyName,
    society_type: societyType,
    email,
    trust_score: trustScore,
    status,
    registry_match_id: registryMatch?.entry.id ?? null,
    reasons,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (upsertError) console.error('[Verification] Failed to save verification_requests:', upsertError);
  else console.log('[Verification] verification_requests upsert OK');

  // Update society verification_status
  const { error: societyError } = await supabase
    .from('societies')
    .update({ verification_status: status })
    .eq('user_id', userId);
  if (societyError) console.error('[Verification] Failed to update societies.verification_status:', societyError);
  else console.log('[Verification] societies.verification_status updated to:', status);

  return {
    status,
    trustScore,
    matchedRegistry: registryMatch
      ? { id: registryMatch.entry.id, name: registryMatch.entry.name, type: registryMatch.entry.type }
      : undefined,
    reasons,
  };
}

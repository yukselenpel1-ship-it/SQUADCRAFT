import { getCachedDraftPlayerPool } from '../src/lib/draft/playerPool';

export function runPoolAudit() {
  const pool = getCachedDraftPlayerPool();
  console.log('Total players in pool:', pool.length);

  const brackets = {
    '90-94': pool.filter(p => p.overall >= 90 && p.overall <= 94).length,
    '85-89': pool.filter(p => p.overall >= 85 && p.overall <= 89).length,
    '80-84': pool.filter(p => p.overall >= 80 && p.overall <= 84).length,
    '75-79': pool.filter(p => p.overall >= 75 && p.overall <= 79).length,
    '70-74': pool.filter(p => p.overall >= 70 && p.overall <= 74).length,
    '65-69': pool.filter(p => p.overall >= 65 && p.overall <= 69).length,
    '60-64': pool.filter(p => p.overall >= 60 && p.overall <= 64).length,
    '50-59': pool.filter(p => p.overall >= 50 && p.overall <= 59).length,
  };

  console.log('Bracket Counts:', JSON.stringify(brackets, null, 2));

  const ovrs = pool.map(p => p.overall).sort((a, b) => a - b);
  const pots = pool.map(p => p.potential);
  const ages = pool.map(p => p.age);
  const vals = pool.map(p => p.draftValue || 0);

  const avg = (arr: number[]) => (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
  const median = (arr: number[]) => arr[Math.floor(arr.length / 2)];

  console.log('Average OVR:', avg(ovrs));
  console.log('Median OVR:', median(ovrs));
  console.log('Average POT:', avg(pots));
  console.log('Average Age:', avg(ages));
  console.log('Average Value (€):', avg(vals));
  console.log('Min Value (€):', Math.min(...vals));
  console.log('Max Value (€):', Math.max(...vals));

  const rising = pool.filter(p => p.isRisingTalent);
  console.log('\n--- RISING TALENTS AUDIT ---');
  console.log('Rising Talents count in pool:', rising.length, `(${(rising.length / pool.length * 100).toFixed(1)}%)`);
  console.log('Rising Avg OVR:', avg(rising.map(p => p.overall)));
  console.log('Rising Avg POT:', avg(rising.map(p => p.potential)));
  console.log('Rising Avg Age:', avg(rising.map(p => p.age)));
  console.log('Rising Avg Value (€):', avg(rising.map(p => p.draftValue || 0)));

  // Sample values across OVR and Age
  console.log('\n--- SAMPLE VALUATIONS ---');
  const samples = [
    pool.find(p => p.overall >= 92),
    pool.find(p => p.overall >= 87 && p.age >= 30),
    pool.find(p => p.overall >= 87 && p.age <= 26),
    pool.find(p => p.overall >= 82 && p.age >= 31),
    pool.find(p => p.overall >= 82 && p.age <= 24),
    pool.find(p => p.overall >= 76 && p.age <= 20 && p.potential >= 86),
    pool.find(p => p.overall >= 76 && p.age >= 28),
    pool.find(p => p.overall >= 70 && p.age >= 26),
    pool.find(p => p.overall <= 60),
  ].filter(Boolean);

  for (const s of samples) {
    if (!s) continue;
    console.log(`- ${s.firstName} ${s.lastName} | Age: ${s.age} | Pos: ${s.position} | OVR: ${s.overall} | POT: ${s.potential} | Value: €${((s.draftValue || 0)/1_000_000).toFixed(2)}M | Rising: ${s.isRisingTalent}`);
  }
}

runPoolAudit();

const fs = require('fs');
const crypto = require('crypto');

const candidatesPath = 'd:\\Projects\\lyrathon\\db\\seeds\\candidates_small.sql';
const outputPath = 'd:\\Projects\\lyrathon\\db\\seeds\\verification_seeds.sql';

const content = fs.readFileSync(candidatesPath, 'utf8');
const idRegex = /'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'/g;
const ids = [];
let match;
while ((match = idRegex.exec(content)) !== null) {
    ids.push(match[1]);
}

// Filter out duplicates (the regex might catch other UUIDs if they exist, but in this file they are mostly candidate_ids)
// Actually, in candidates_small.sql, the first UUID in each tuple is the candidate_id.
// The file starts with INSERT INTO candidate ... VALUES ( 'id', ...
// Let's be more precise.
const candidateIds = [...new Set(ids)];

let sql = '-- Mock Verification Runs for candidates_small\n';
sql += 'INSERT INTO verification_runs (\n';
sql += '  verification_id, candidate_id, run_type, input_hash, status, confidence, rationale, metadata, web_search_used, link_overlap_count, link_notes, created_at, updated_at, started_at, finished_at\n';
sql += ') VALUES\n';

const runs = [];

candidateIds.forEach(candidateId => {
    const types = ['resume', 'transcript', 'project_links', 'full_profile'];

    types.forEach(type => {
        const verificationId = crypto.randomUUID();
        const confidence = (Math.random() * 0.4 + 0.55).toFixed(3); // 0.55 to 0.95
        const status = 'succeeded';
        const rationale = `Mock verification for ${type} completed with ${confidence} confidence.`;
        const metadata = JSON.stringify({ mock: true, source: type });
        const webSearchUsed = type === 'full_profile' || type === 'project_links';
        const linkOverlap = Math.floor(Math.random() * 5);
        const linkNotes = webSearchUsed ? 'Found matching social profiles.' : null;

        runs.push(`(
    '${verificationId}',
    '${candidateId}',
    '${type}',
    'mock-hash-${type}-${candidateId.slice(0, 8)}',
    '${status}',
    ${confidence},
    '${rationale}',
    '${metadata}',
    ${webSearchUsed},
    ${linkOverlap},
    ${linkNotes ? `'${linkNotes}'` : 'NULL'},
    now() - interval '${Math.floor(Math.random() * 10)} days',
    now(),
    now() - interval '1 hour',
    now()
)`);
    });
});

sql += runs.join(',\n') + '\nON CONFLICT (verification_id) DO NOTHING;\n\n';

// Also update candidate verifiable_confidence_score based on full_profile
sql += '-- Update candidate verifiable_confidence_score\n';
candidateIds.forEach(candidateId => {
    // We need to find the full_profile confidence we just generated
    // For simplicity, we can just use a subquery or do it in JS.
    // Let's do it in SQL for each candidate.
    sql += `UPDATE candidate SET verifiable_confidence_score = (
    SELECT confidence FROM verification_runs 
    WHERE candidate_id = '${candidateId}' AND run_type = 'full_profile' 
    ORDER BY finished_at DESC LIMIT 1
) WHERE candidate_id = '${candidateId}';\n`;
});

fs.writeFileSync(outputPath, sql);
console.log(`Generated ${candidateIds.length * 4} verification runs for ${candidateIds.length} candidates.`);

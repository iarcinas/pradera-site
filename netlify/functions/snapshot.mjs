/* The hourly job. Turns raw hit keys into one record per Philippine day.
 *
 * Written as a v2 function (export default, export const config) rather than
 * in the exports.handler style of the others. That is not a style choice: a v1
 * handler gets its blobs credentials from the invoking event, and a scheduled
 * invocation has no HTTP event to carry them. A v2 function reads them from the
 * environment, so getStore works the same whether Netlify's scheduler called
 * it or a person did. The schedule lives in the config export below, beside
 * the code it governs, rather than in netlify.toml.
 *
 * Hourly, not nightly. Three reasons, in order of how much they matter:
 *   - A nightly job means a day's figures appear the following morning, and
 *     "how did the long weekend go" is a Sunday-afternoon question.
 *   - Raw hits are pruned after two days, and a job that runs once a night has
 *     one chance to get a day right. This one has twenty-four.
 *   - It makes the hourly breakdown of the current day real, which is what
 *     tells Operations whether the 10am opening is being used.
 *
 * It recomputes today AND yesterday on every run. Yesterday because the run
 * just after Philippine midnight is the first that can see the whole previous
 * day, and the run before it saw all but the last minutes. Recomputing from
 * raw keys makes that free of consequence: aggregate() is a pure function of
 * the keys, so redoing a day gives the same answer, never a doubled one.
 */

import { getStore } from "@netlify/blobs";

/* ../lib/counter.js is CommonJS and shared with the beacon, which is a v1
   handler and must stay CommonJS. Node and esbuild both hand a CJS module's
   exports over as the default import, so this is the whole of the interop. */
import counter from "../lib/counter.js";

const { DATE_RE, manilaParts, aggregate } = counter;

const HITS = "hits";
const ANALYTICS = "analytics";

const DAY_MS = 86400000;

/* How much raw detail to keep. Two days back is enough to recompute any day
   the job could still have wrong, and no more: these are the only blobs on the
   site that grow with traffic, and the aggregated record is what we actually
   keep forever. */
const KEEP_DAYS = 2;

const dayKeys = async (hits, date) => {
  const { blobs } = await hits.list({ prefix: `${date}/` });
  return blobs.map((b) => b.key);
};

/* Delete in batches. Serially, a busy Saturday's few thousand keys would walk
   the function into its timeout; all at once would open as many sockets. */
async function deleteAll(hits, keys) {
  for (let i = 0; i < keys.length; i += 25) {
    await Promise.all(keys.slice(i, i + 25).map((k) => hits.delete(k)));
  }
}

export default async () => {
  const hits = getStore(HITS);
  const analytics = getStore(ANALYTICS);

  const now = Date.now();
  const fetchedAt = new Date(now).toISOString();
  const today = manilaParts(now).date;
  const yesterday = manilaParts(now - DAY_MS).date;

  const written = [];
  // Yesterday first, so that if the function runs out of time it is the day
  // nobody is watching that goes unfinished.
  for (const date of [yesterday, today]) {
    const keys = await dayKeys(hits, date);
    const [record] = aggregate(keys);
    /* No keys means no hits — or means the raw detail has already been pruned
       while an aggregated record for that date exists. Writing a zero row here
       would quietly erase a real day, so a day with nothing to count is left
       exactly as it is. */
    if (!record) continue;
    await analytics.setJSON(date, { ...record, fetchedAt, source: "counter" });
    written.push(`${date}: ${record.pageviews} views, ${record.visitors} visitors`);
  }

  /* Prune. The cutoff is a date label, compared as a string — ISO dates sort
     chronologically, which is the reason this whole scheme uses them. */
  const cutoff = manilaParts(now - KEEP_DAYS * DAY_MS).date;
  let pruned = 0;
  // directories: true lists the top level — one entry per date — without
  // walking every key underneath it.
  const { directories } = await hits.list({ directories: true });
  for (const dir of directories || []) {
    if (!DATE_RE.test(dir) || dir >= cutoff) continue;
    const stale = await dayKeys(hits, dir);
    await deleteAll(hits, stale);
    pruned += stale.length;
  }

  const summary = `snapshot: ${written.length ? written.join("; ") : "nothing to count"}; pruned ${pruned} raw hits older than ${cutoff}`;
  console.log(summary);
  return new Response(summary, { headers: { "Content-Type": "text/plain" } });
};

export const config = { schedule: "@hourly" };

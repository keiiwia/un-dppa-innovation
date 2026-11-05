// Builds a flat Markdown review sheet from the Source Map's data.js.
// Usage, from concepts/source-map: node tools/make-review-sheet.js data.js review-sheet.md
// Rebuilding keeps every Decision written so far, along with any lines directly under it.
const fs = require("fs");
const vm = require("vm");

const [dataPath, outPath] = process.argv.slice(2);
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(dataPath, "utf8"), ctx);
const root = ctx.window.SOURCE_MAP;
const check = ctx.window.LINK_CHECK || { date: null, results: {} };

const FROM = {
  kelly: "Kelly's visit notes",
  ethan: "Ethan's visit notes",
  meeting: "10/27 meeting notes",
  concept: "Concept README",
  added: "**Added in draft**",
};
const COST = { free: "Free", freemium: "Freemium", paid: "Paid" };
const ACCESS = { open: "Open", registration: "Registration", un: "UN or partner only" };
const TYPE = { tool: "Tool", source: "Source", practice: "Practice", case: "Case study", input: "Required input" };

// Keep what reviewers wrote in the previous sheet: the review notes at the top (between the
// <!-- review --> markers) and each Decision block, from its Decision line to the next blank line.
const prev = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : "";
const reviewNotes = (prev.match(/<!-- review -->[\s\S]*?<!-- \/review -->/) || [])[0];
const kept = new Map();
{
  let heading = null, block = null;
  for (const line of prev.split("\n")) {
    if (/^#{2,4} /.test(line)) heading = line;
    if (/^- \*\*(Stage d|D)ecision/.test(line)) block = [];
    if (block && !line.trim()) { kept.set(heading, block.join("\n")); block = null; }
    if (block) block.push(line);
  }
  if (block) kept.set(heading, block.join("\n"));
}

const stages = root.children;
const stageName = n => stages.find(s => s.stage === n)?.name || `stage ${n}`;
const leaves = n => (n.children ? n.children.flatMap(leaves) : [n]);
const all = leaves(root);
const added = all.filter(i => i.from === "added");
const blocked = all.filter(i => i.url && check.results[i.url] === "blocked");
const fmtDate = d => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

function linkLine(i) {
  if (!i.url) return "No link";
  const short = i.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  const shown = short.length > 60 ? short.slice(0, 57) + "…" : short;
  const status = check.results[i.url];
  const when = fmtDate((check.dates || {})[i.url] || check.date);
  const note = status === "ok" ? `loaded on ${when}`
    : status === "blocked" ? "**not confirmed, open by hand**"
    : "not checked";
  return `[${shown}](${i.url}) · ${note}`;
}

function item(i) {
  const input = i.type === "input";
  const meta = i.type === "case"
    ? [TYPE.case, `illustrates stage ${i.illustrates} (${stageName(i.illustrates)})`, i.status && `**${i.status}**`, FROM[i.from]]
    : input ? [TYPE.input, FROM[i.from]]
    : [TYPE[i.type], COST[i.cost], ACCESS[i.access], FROM[i.from]];
  const lines = [`#### ${i.name}`, "", meta.filter(Boolean).join(" · "), ""];
  if (!input) lines.push(linkLine(i), "");
  const field = (label, v) => v && lines.push(`- ${label}: ${v}`);
  field(input ? "What the analyst sets" : "What it is", i.what);
  field(input ? "Why it matters for silence" : "On silence", i.silence);
  field("Can't see", i.limits);
  field("What went silent", i.went);
  field("What revealed it", i.revealed);
  lines.push(kept.get(`#### ${i.name}`) || "- **Decision:** ", "");
  return lines.join("\n");
}

const out = [];
out.push(
  "# Source Map review sheet",
  "",
  `Every item in the Source Map, in the same order as the tree. Generated from \`data.js\`. ${all.length} items: ${added.length} added in this draft, ${all.length - added.length} from our notes.`,
  "",
  "**How to use it:** write on each **Decision** line: *keep*, *cut*, *move to …* (stage or branch), or a note. The items marked **Added in draft** need the closest look; the rest came from our notes, so just check they're in the right place. Each stage has a decision line too. When you're done, tell Claude to apply the review sheet, and it will update `data.js`.",
  "",
  ...(reviewNotes ? [reviewNotes, ""] : []),
  "| Stage | Items | Added in draft |",
  "|---|---|---|",
  ...stages.map(s => {
    const l = leaves(s);
    return `| ${s.stage <= 5 ? s.stage + " · " : ""}${s.name} | ${l.length} | ${l.filter(i => i.from === "added").length} |`;
  }),
  `| **Total** | **${all.length}** | **${added.length}** |`,
  "",
);
if (blocked.length) {
  out.push(`**Links to open by hand** (they blocked the automated check on ${fmtDate(check.date)}): ${blocked.map(i => `[${i.name}](${i.url})`).join(", ")}.`, "");
}

for (const s of stages) {
  const heading = `## ${s.stage <= 5 ? s.stage + " · " : ""}${s.name}`;
  out.push("---", "", heading, "", `*${s.question}*`, "");
  out.push(`- Who acts: ${s.who}`, `- Where a person decides: ${s.decide}`, kept.get(heading) || "- **Stage decision:** ", "");
  for (const b of s.children) {
    if (!b.children) { out.push(item(b)); continue; }
    out.push(`### ${b.name}`, "");
    b.children.forEach(i => out.push(item(i)));
  }
}

fs.writeFileSync(outPath, out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n");
console.log(`${all.length} items (${added.length} added), ${blocked.length} blocked links → ${outPath}`);

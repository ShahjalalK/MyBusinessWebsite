"use client";

import React, { useMemo, useState } from "react";
import { Copy, ExternalLink, Link2, Search } from "lucide-react";
import type { LinkedInKeywordDataset, LinkedInKeywordGeneratedQuery } from "./types";
import linkedinKeywordDataset from "./linkedin-keywords.json";

const LINKEDIN_KEYWORD_DATASET = linkedinKeywordDataset as LinkedInKeywordDataset;

function splitInputList(value: string) {
  return String(value || "")
    .split(/[\n,]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueList(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function quote(value: string) {
  const cleaned = String(value || "").trim().replace(/"+/g, "");
  return cleaned ? `"${cleaned}"` : "";
}

function orGroup(values: string[]) {
  const quoted = uniqueList(values).map(quote).filter(Boolean);
  if (!quoted.length) return "";
  return quoted.length === 1 ? quoted[0] : `(${quoted.join(" OR ")})`;
}

function locationParts(location: string) {
  return String(location || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function compactQuery(parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function googleSearchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function buildGeneratedQueries(input: {
  titles: string[];
  keywords: string[];
  relatedKeywords: string[];
  location: string;
  companyName: string;
}): LinkedInKeywordGeneratedQuery[] {
  const titles = uniqueList(input.titles.length ? input.titles : LINKEDIN_KEYWORD_DATASET.defaultTitles);
  const keywords = uniqueList(input.keywords);
  const relatedKeywords = uniqueList(input.relatedKeywords);
  const allNicheTerms = uniqueList([...keywords, ...relatedKeywords]).slice(0, 8);
  const locations = locationParts(input.location);
  const city = locations[0] || "";
  const stateOrRegion = locations.slice(1).join(", ");
  const locationQuery = locations.map(quote).filter(Boolean).join(" ");
  const titleGroup = orGroup(titles);
  const nicheGroup = orGroup(allNicheTerms.length ? allNicheTerms : keywords);
  const companyName = String(input.companyName || "").trim();

  const rows: LinkedInKeywordGeneratedQuery[] = [];
  const add = (label: string, query: string, note: string) => {
    const cleanQuery = compactQuery([query]);
    if (!cleanQuery || rows.some((row) => row.query.toLowerCase() === cleanQuery.toLowerCase())) return;
    rows.push({
      id: `generated-${rows.length + 1}`,
      label,
      query: cleanQuery,
      note,
    });
  };

  add(
    "Best broad owner search",
    compactQuery(["site:linkedin.com/in", titleGroup, nicheGroup, locationQuery]),
    "Best first Google search for LinkedIn owner/founder/CEO profiles in the selected niche and location.",
  );

  titles.slice(0, 4).forEach((title, titleIndex) => {
    const keyword = allNicheTerms[titleIndex % Math.max(allNicheTerms.length, 1)] || keywords[0] || "";
    add(
      `${title} profile search`,
      compactQuery(["site:linkedin.com/in", quote(keyword), city ? quote(city) : locationQuery, quote(title)]),
      "Narrow query for one title and one niche phrase.",
    );
  });

  if (stateOrRegion) {
    add(
      "State / region broader search",
      compactQuery(["site:linkedin.com/in", orGroup(titles.slice(0, 3)), nicheGroup, quote(stateOrRegion)]),
      "Broader search when the city result is too small.",
    );
  }

  if (companyName) {
    add(
      "Exact company decision maker",
      compactQuery(["site:linkedin.com/in", titleGroup, quote(companyName)]),
      "Best query when you already know the company name.",
    );
    add(
      "Company + niche + location",
      compactQuery(["site:linkedin.com/in", quote(companyName), nicheGroup, locationQuery]),
      "Use this when the company has multiple people and you need a more specific profile result.",
    );
  }

  add(
    "People page fallback",
    compactQuery(["site:linkedin.com/in", nicheGroup, locationQuery, orGroup(["owner", "founder", "ceo"])]),
    "Fallback query if exact title capitalization does not match LinkedIn snippets.",
  );

  return rows.slice(0, 8);
}

async function copyText(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(value);
  }
}

export default function LinkedInKeywordsPanel() {
  const categories = LINKEDIN_KEYWORD_DATASET.categories || [];
  const defaultCategoryId = categories[0]?.id || "";
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const selectedCategory = categories.find((category) => category.id === categoryId) || categories[0];
  const defaultSubcategoryId = selectedCategory?.subcategories?.[0]?.id || "";
  const [subcategoryId, setSubcategoryId] = useState(defaultSubcategoryId);
  const selectedSubcategory =
    selectedCategory?.subcategories?.find((subcategory) => subcategory.id === subcategoryId) ||
    selectedCategory?.subcategories?.[0];

  const [location, setLocation] = useState("Dallas, Texas");
  const [companyName, setCompanyName] = useState("");
  const [titlesText, setTitlesText] = useState((LINKEDIN_KEYWORD_DATASET.defaultTitles || []).join(", "));
  const [relatedKeywordsText, setRelatedKeywordsText] = useState("");
  const [generatedQueries, setGeneratedQueries] = useState<LinkedInKeywordGeneratedQuery[]>([]);
  const [copiedId, setCopiedId] = useState("");

  const baseKeywords = selectedSubcategory?.keywords || [];
  const jsonRelatedKeywords = selectedSubcategory?.relatedKeywords || [];
  const parsedTitles = useMemo(() => splitInputList(titlesText), [titlesText]);
  const parsedRelatedKeywords = useMemo(() => splitInputList(relatedKeywordsText), [relatedKeywordsText]);

  const generateQueries = () => {
    const rows = buildGeneratedQueries({
      titles: parsedTitles,
      keywords: baseKeywords,
      relatedKeywords: [...jsonRelatedKeywords, ...parsedRelatedKeywords],
      location,
      companyName,
    });
    setGeneratedQueries(rows);
    setCopiedId("");
  };

  const handleCategoryChange = (nextCategoryId: string) => {
    const nextCategory = categories.find((category) => category.id === nextCategoryId);
    setCategoryId(nextCategoryId);
    setSubcategoryId(nextCategory?.subcategories?.[0]?.id || "");
    setGeneratedQueries([]);
    setCopiedId("");
  };

  const handleCopy = async (id: string, value: string) => {
    await copyText(value);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((current) => (current === id ? "" : current)), 1600);
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] border border-blue-100 bg-gradient-to-br from-white via-blue-50/50 to-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">
              <Link2 size={14} /> Manual Google Query Generator
            </p>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-gray-950 sm:text-3xl">LinkedIn Keyword Generator</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-gray-500">
              Select a business category, subcategory, location, and decision-maker titles. This only creates Google search queries for finding public LinkedIn profile URLs manually. It does not scrape LinkedIn, send connections, call Firebase, Search API, Python, Gemini, audit, PDF, video, email, or automation systems.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-[340px]">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Categories</p>
              <p className="mt-1 text-2xl font-black text-gray-950">{categories.length}</p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-center shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-blue-600">Subcategories</p>
              <p className="mt-1 text-2xl font-black text-blue-700">
                {categories.reduce((total, category) => total + category.subcategories.length, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className="rounded-[30px] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h3 className="text-lg font-black uppercase italic tracking-tight text-gray-900">Build Search Keyword</h3>
            <p className="mt-2 text-xs font-semibold leading-5 text-gray-500">
              Change only these fields, then copy the generated Google query and paste it in your browser.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Business Category</span>
              <select
                value={categoryId}
                onChange={(event) => handleCategoryChange(event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Subcategory</span>
              <select
                value={selectedSubcategory?.id || ""}
                onChange={(event) => {
                  setSubcategoryId(event.target.value);
                  setGeneratedQueries([]);
                  setCopiedId("");
                }}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              >
                {(selectedCategory?.subcategories || []).map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Location</span>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Dallas, Texas"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Company Name — optional</span>
              <input
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="Exact Company Name"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Job Titles</span>
              <input
                value={titlesText}
                onChange={(event) => setTitlesText(event.target.value)}
                placeholder="Owner, Founder, CEO"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {(LINKEDIN_KEYWORD_DATASET.titlePresets || []).map((title) => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => setTitlesText(uniqueList([...splitInputList(titlesText), title]).join(", "))}
                    className="rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-500 transition hover:border-blue-200 hover:text-blue-700"
                  >
                    + {title}
                  </button>
                ))}
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Related Niche Keywords — optional</span>
              <textarea
                value={relatedKeywordsText}
                onChange={(event) => setRelatedKeywordsText(event.target.value)}
                placeholder="Add extra terms separated by comma, for example: obedience training, dog behaviorist"
                rows={3}
                className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <button
              type="button"
              onClick={generateQueries}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-950 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-blue-700"
            >
              <Search size={15} /> Generate Keywords
            </button>
          </div>
        </section>

        <section className="space-y-5">
          <div className="rounded-[30px] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-black uppercase italic tracking-tight text-gray-900">Selected Niche</h3>
                <p className="mt-2 text-xs font-semibold leading-5 text-gray-500">{selectedCategory?.description}</p>
              </div>
              <span className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-blue-700">
                {selectedSubcategory?.label || "No subcategory"}
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Base Keywords From JSON</p>
                <p className="mt-2 text-xs font-bold leading-5 text-gray-700">{baseKeywords.join(", ")}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Related Suggestions</p>
                <p className="mt-2 text-xs font-bold leading-5 text-gray-700">{jsonRelatedKeywords.join(", ") || "Add your own optional terms."}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-black uppercase italic tracking-tight text-gray-900">Generated Google Queries</h3>
                <p className="mt-2 text-xs font-semibold leading-5 text-gray-500">
                  Use Google results manually, verify each LinkedIn profile yourself, then send connection requests manually.
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-700">
                No API calls
              </span>
            </div>

            {!generatedQueries.length ? (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-5 py-10 text-center">
                <p className="text-sm font-black text-gray-800">Click Generate Keywords to create Google search URLs.</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-gray-500">
                  Example output: site:linkedin.com/in ("Owner" OR "Founder" OR "CEO") ("dog training" OR "dog trainer") "Dallas" "Texas"
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {generatedQueries.map((row) => (
                  <article key={row.id} className="rounded-3xl border border-gray-100 bg-gray-50/60 p-4 transition hover:border-blue-100 hover:bg-white">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">{row.label}</p>
                        <p className="mt-2 break-words rounded-2xl bg-white px-4 py-3 font-mono text-xs font-black leading-5 text-gray-900 ring-1 ring-gray-100">
                          {row.query}
                        </p>
                        <p className="mt-2 text-xs font-semibold leading-5 text-gray-500">{row.note}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => void handleCopy(row.id, row.query)}
                          className="inline-flex items-center gap-1 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-600 transition hover:border-blue-200 hover:text-blue-700"
                        >
                          <Copy size={12} /> {copiedId === row.id ? "Copied" : "Copy"}
                        </button>
                        <a
                          href={googleSearchUrl(row.query)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-2xl bg-gray-950 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white transition hover:bg-blue-700"
                        >
                          Search on Google <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

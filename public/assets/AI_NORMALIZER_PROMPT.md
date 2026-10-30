# Give this prompt and the original online list to ChatGPT or Codex

Convert the attached/pasted comic reading list into a Longbox-compatible **UTF-8 TXT** reading order for my Scriptable application. Don't invent entries, years, volumes, missing issues, or publication details. Preserve the source's sequence, repeated issues, chapter/act breaks, and any explicit partial-issue reading instructions.

Output only plaintext (no Markdown code fences, tables, extra commentary, prices, dates of purchase, cover variant descriptions, hyperlinks, or blank decorative bullets). Format each actual issue as:

`Exact Series Name (Series start year, only if reliably known) #IssueNumber`

For issue ranges, use `Exact Series Name (YYYY) #1-6`. For a volume when reliably established, use `Exact Series Name (YYYY) Vol. 2 #1`.

Represent section breaks as separate lines starting with `ACT`, `CHAPTER`, `PART`, `INTERLUDE`, or `BOOK`. Represent partial issues as `Series (YYYY) #N (pages 1-8)` or the supplied exact section. Keep intentionally repeated issues in their original positions.

If an item isn't clearly an issue or a trustworthy series/year/volume match cannot be determined from the supplied source, keep it as `UNRESOLVED: [original exact wording]` for manual review; do NOT guess. If the source is merely the name of a trade paperback or omnibus without a documented contents list, do not infer its contents—state that a contents list is required.

If you have no reliable evidence of a year, omit the year rather than inventing one. Do not imply that imported issues are owned or read. After producing the normalized text, include a separate short summary of unresolved entries **outside the import file** when explaining your work to me.

If the source includes ambiguous publishing variants (e.g., several series called Spider-Man), flag them for manual review instead of blindly selecting one.

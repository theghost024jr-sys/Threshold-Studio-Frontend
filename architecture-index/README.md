# Threshold Architecture Index

This catalog indexes `vault/theghost/**/*Architecture*.md` without modifying the vault.

- `factWeight` combines source authority and available frontmatter.
- `accessWeight` combines fact weight and inbound architecture links.
- Query relevance is scaled by access weight.
- `dominancePairs` preserve explicit pairwise physics; they are not converted into a global numeric force ranking.
- Exact body duplicates remain in the catalog but only their strongest representative is returned by default.

```powershell
.\.venv\Scripts\python.exe tools\build_threshold_architecture_index.py build
.\.venv\Scripts\python.exe tools\build_threshold_architecture_index.py query "pressure collapse" --attribute pressure=4
```

Use `--include-duplicates` when provenance matters more than concise results.
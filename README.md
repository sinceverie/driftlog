# driftlog

> A CLI tool that detects and summarizes config drift between environments using structured diffs.

---

## Installation

```bash
npm install -g driftlog
```

Or run without installing:

```bash
npx driftlog
```

---

## Usage

Compare configuration files across environments:

```bash
driftlog compare --base config.staging.json --target config.production.json
```

Output a structured summary of all drifted values:

```bash
driftlog compare --base .env.staging --target .env.production --format table
```

**Example output:**

```
KEY                     STAGING         PRODUCTION
─────────────────────────────────────────────────
LOG_LEVEL               debug           warn
DB_POOL_SIZE            5               20
CACHE_TTL               [missing]       3600
FEATURE_NEW_UI          true            false

4 drift(s) detected across 2 environments.
```

### Options

| Flag | Description |
|------|-------------|
| `--base` | Path to the base environment config |
| `--target` | Path to the target environment config |
| `--format` | Output format: `table`, `json`, or `diff` (default: `table`) |
| `--ignore` | Comma-separated list of keys to ignore |

---

## License

[MIT](./LICENSE)
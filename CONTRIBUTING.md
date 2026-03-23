# Contributing to rbc-recurrence

Thank you for considering a contribution!

## Setup

```bash
git clone https://github.com/YOUR_USERNAME/rbc-recurrence
cd rbc-recurrence
npm install
```

## Development

```bash
npm run test:watch   # run tests in watch mode
npm run typecheck    # TypeScript check
npm run lint         # ESLint
npm run build        # build the library
```

## Running the Demo

```bash
cd examples/demo-app
npm install
npm run dev
```

## Submitting a PR

1. Fork the repo and create a branch: `git checkout -b feat/my-feature`
2. Write tests for your change
3. Run `npm test` and make sure all tests pass
4. Run `npm run typecheck` — zero errors required
5. Open a PR with a clear description

## Commit style

Use conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`.

## Reporting bugs

Please use the [bug report template](./.github/ISSUE_TEMPLATE/bug_report.md).

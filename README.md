# atomic-common-db
Common JavaScript library for database access

### Project Setup

1. run `npm i`

### Build a new version

1. Increment the version in `package.json` according to [semver](https://semver.org/)
2. Run `npm run-script build`
3. Push the results to a branch and submit a PR

### Add flow types

Use npx to run flow-typed, e.g.

`npx flow-typed install pg@7.x.x`

# Ts Farcaster

Here's a typescript implementation of the farcaster crawler along with ongoing recommendation experiments

## Installation

- Create a postgres database and configure knexfile.js
- Install packages: `yarn`
- Run migrations: `npx knex migrate:up`

## Usage

- Run the crawler and populate the farcaster db. Keep in mind that the crawler downloads all user and cast data (from somewhat slow APIs), along with all of their properties summing up to around 0.5GB so it might take ~1.5 hour. Alternatively, contact @pkakelas to directly send over the database dump.

```bash
npx ts-node crawler.ts
```

- Run basic user recommendation (using jaccard similarity):

```bash
npx ts-node recommender/jaccard.ts
```

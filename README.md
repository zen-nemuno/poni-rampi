# Poni Rampi

Poni Rampi is a streamer-friendly random pick overlay tool for Pokémon UNITE.

## Features

- Single random pick
- 5-player team random pick
- Role filter
- Attack range filter
- Difficulty filter
- Owned-only filter
- Exclusion settings
- Pick history
- OBS overlay page
- Wiki-based Pokémon data generation script

## Getting Started

```bash
npm install
npm run dev
```

## Pages

- Main: http://localhost:3000
- Overlay: http://localhost:3000/overlay

## Fetch Pokémon Data

```bash
npm run fetch:pokemon
```

The app always uses the static data in `src/data/pokemon.ts` at runtime. The fetch script is for development updates only and leaves the existing fallback data unchanged if fetching or parsing fails.

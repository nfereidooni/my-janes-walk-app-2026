# my Jane's Walk

A better way to browse and plan your [Jane's Walk](https://janeswalk.org) weekend in Toronto.

---

## The story

Last year I went on my first Jane's Walk — and ended up meeting one of my best friends.

For those who don't know: Jane's Walk is a global, volunteer-led festival inspired by Jane Jacobs. It's all about exploring cities on foot, sharing local stories, and connecting with the people around you. Toronto goes hard for it every May long weekend, with 150+ walks happening across the city.

The only problem? Their website has always been tough to navigate. Planning my walks this year was starting to feel like a scavenger hunt. So I did what any lazy builder would do — I pulled the event data, built a simple Next.js app, and made it easy.

## What it does

- **Browse** all 150+ Toronto walks for May 1–3, 2026
- **Filter** by day, time of day, and theme
- **Search** by walk name, neighbourhood, or leader
- **Map view** — every walk pinned, tap to preview
- **Star walks** to save them across all three tabs
- **Schedule tab** — your saved walks laid out as a personal itinerary

## Built with

- [Next.js](https://nextjs.org) (App Router)
- [MapLibre GL](https://maplibre.org) via [react-map-gl](https://visgl.github.io/react-map-gl/)
- [OpenStreetMap](https://www.openstreetmap.org) tiles
- Walk data from the [Jane's Walk 2026 Toronto program](https://www.janeswalkfestivalto.com)
- Built with [Claude](https://claude.ai) + [Cursor](https://cursor.sh)

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

*Happy walking. The rain isn't hitting until Monday 😌*

# alandkawaali

Portfolio site for Aland Kawa Ali: Qurany Piroz, Pirsa, CêIT, Gospel of Barnabas, Zewyar, Zriwe, Naser Subhani
and the Fuel Cost Calculator.

Plain HTML, CSS and a little JavaScript, no build step.

```
index.html     the home page in English (served at /)
ku.html        the home page in Central Kurdish, right-to-left (served at /ku)
fuel.html      the fuel cost calculator in English (served at /fuel)
fuel-ku.html   the fuel cost calculator in Central Kurdish (served at /fuel-ku)
fuel.js        the calculator and its route map, shared by both calculator pages
styles.css     all styles: one column on phones and tablets, two columns from 960px wide;
               light and dark follow the visitor's system setting
favicon.svg    the tab icon
images/        app icons
vercel.json    clean URLs and image caching
```

## The route map

The calculator's map uses [Leaflet](https://leafletjs.com) 1.9.4 from unpkg, map tiles from
[OpenStreetMap](https://operations.osmfoundation.org/policies/tiles/) (shown in grey by `styles.css`), and
driving distances from the public [OSRM](https://project-osrm.org) demo server, falling back to the FOSSGIS
server behind openstreetmap.org. None of them need an API key. They are free services meant for light use, so if the site gets heavy traffic
the router may need to be swapped for a paid one. If the map can't load, the distance can still be typed in.

## Preview locally

```bash
python3 -m http.server 4178
```

Then open http://localhost:4178.

## Deploy on Vercel

1. Push this folder to a GitHub repository.
2. On vercel.com, choose **Add New → Project** and import the repository.
3. Set **Framework Preset** to **Other** and leave the build command and output directory empty.
4. Name the project `alandkawaali` so it is served at **https://alandkawaali.vercel.app**.

`aland.vercel.app` is already used by another Vercel project, so it can't be claimed. A custom domain can be
added later under the project's **Settings → Domains**.

## Adding a project

Copy one `<article class="project">` block in `index.html`, change its `id`, text and links, and add a square
icon to `images/`. Then do the same in `ku.html` with the Kurdish text (Kurdish digits, e.g. ٢٠٢٦), keeping
the same `id`.

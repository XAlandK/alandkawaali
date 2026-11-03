# alandkawaali

Portfolio site for Aland Kawa Ali: Qurany Piroz, Pirsa, CêIT, Gospel of Barnabas, Zewyar and Zriwe.

Plain HTML and CSS, no build step.

```
index.html     the page in English (served at /)
ku.html        the page in Central Kurdish, right-to-left (served at /ku)
styles.css     all styles, with light and dark themes and right-to-left rules
favicon.svg    the tab icon
images/        app icons (256 px)
vercel.json    clean URLs and image caching
```

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

Copy one `<article class="project">` block in `index.html`, change its `id`, number, text and links, add a
256 px icon to `images/`, and add a matching link to the icon shelf near the top of the page. Then do the same
in `ku.html` with the Kurdish text (Kurdish digits, e.g. ٠٧), keeping the same `id`.

Styling

## JavaScript Build

Dieses Projekt nutzt `esbuild`, um modulare JS-Dateien zu einem Produktions-Bundle zusammenzufassen.

### Einstieg

- `npm install`
- `npm run js:build`
- `npm run js:watch`

**Rive-WASM (separate Datei, absolute URL):** Der Vendor-Build setzt per `publicPath` eine **feste Basis-URL** für `rive-*.wasm`, damit der Browser nicht relativ zur Webflow-Seiten-URL lädt (sonst 404 auf Unterpfaden).

- **Standard (Produktion):** `https://assets.tiptap.dev/tt-wf/static/` — dort müssen **`vendor.min.js`**, **`rive-*.wasm`** und (empfohlen) **`tt-main.min.js`** per SFTP/CI landen; Webflow verweist auf dieselben URLs.
- **Anderes Ziel** (Preview, anderer Host):  
  `RIVE_WASM_BASE=https://beispiel.netlify.app/dist/ npm run js:build:vendor`  
  (Basis = Verzeichnis, in dem **`vendor.min.js`** und **`rive-*.wasm`** öffentlich liegen — mit `/` am Ende.)

Build-Output:

- `dist/vendor.min.js` + `dist/vendor.min.js.map` (Splide + Extensions, Rive-JS, accordion-js)
- `dist/rive-*.wasm` (Rive-Runtime; **immer mit hochladen**; im JS als absolute URL unter `RIVE_WASM_BASE` referenziert)
- `dist/tt-main.min.js` + `dist/tt-main.min.js.map` (eigener App-Code)
- `dist/contact-page.min.js` + `dist/contact-page.min.js.map`

### Deploy / Staging (`vendor` + `tt-main`)

1. **`npm run js:build`** (baut `vendor` → `main` → `contact`). Nur bei abweichendem Host **`RIVE_WASM_BASE`** setzen (siehe oben).
2. **Upload nach `assets.tiptap.dev`:** Aus dem **lokalen** Ordner `dist/` die Dateien `vendor.min.js`, **`rive-*.wasm`**, `tt-main.min.js` (und optional `.map`) nach **`https://assets.tiptap.dev/tt-wf/static/`** hochladen (Zielpfad = Standard-`RIVE_WASM_BASE`).
3. **Webflow — Reihenfolge mit `defer`:** zuerst **`https://assets.tiptap.dev/tt-wf/static/vendor.min.js`**, danach **`https://assets.tiptap.dev/tt-wf/static/tt-main.min.js`**. **Cache-Buster** (`?v=…`); Vendor seltener busten als Main, wenn ihr Caches nutzen wollt.
4. **CDN:** Keine Scripts mehr für **Splide** (jsDelivr), **Rive** oder **accordion-js** — alles liegt in `vendor.min.js`.
5. **`.ac`-Styles** weiter wie bisher (Projekt-CSS / Webflow). **Empfehlung:** kompiliertes **`tt-styling.min.css`** (und ggf. `cookiebot.css`) ebenfalls unter **`…/tt-wf/static/`** ablegen und in Webflow von dort einbinden — eine klare Ablage neben den JS-Bundles.

**`cookiebot.css`:** Muss **nicht** minifiziert werden — für Cookiebot reicht normales CSS; Minify spart kaum Bytes und ist optional.

### GitHub Actions → SSH/rsync (optional)

Workflow **`.github/workflows/deploy-assets.yml`**: bei **Push auf `main`** (nur wenn sich Pfade unter `js/`, `scripts/`, Lockfile oder `cookiebot.css` ändern) oder **manuell** unter *Actions → Deploy core assets → Run workflow*.

Hochgeladen werden nur: **`dist/vendor.min.js`**, **`dist/tt-main.min.js`**, alle **`dist/rive-*.wasm`**, **`cookiebot.css`** (keine `.map`, kein `contact-page` — bei Bedarf Workflow erweitern).

**Secrets** (Repository → *Settings* → *Secrets and variables* → *Actions*):

| Secret | Beispiel / Bedeutung |
|--------|----------------------|
| `ASSETS_SSH_HOST` | Hostname des Servers |
| `ASSETS_SSH_USER` | SSH-Benutzer |
| `ASSETS_SSH_KEY` | Inhalt des **privaten** Deploy-Keys (PEM, mehrzeilig) |
| `ASSETS_REMOTE_PATH` | Absoluter Zielpfad mit `/` am Ende, z. B. `/var/www/assets/tt-wf/static/` |
| `ASSETS_SSH_PORT` | Optional, Standard `22` |

Der Deploy-User braucht **Schreibrecht** nur auf `ASSETS_REMOTE_PATH`. **Keine** Secrets ins Git committen.

Aktueller Entry-Point:

- `js/vendor.js` (Third-Party)
- `js/tt-main.js` (App)
- `js/pages/contact.js`

### Struktur

- `js/components/*` für einzelne Features/Module
- `js/pages/*` für seitenbezogene Entry-Points

`contact-form` und `contact-sales` bleiben als getrennte Module und werden über
`js/pages/contact.js` gemeinsam gebündelt.

## Slider Data API (Konvention)

Ziel: Neue Slider sollen dieselbe Data-Attribut-Logik, Lifecycle-Patterns und
Autoplay-Pause-Regeln nutzen.

### Namensschema

- Root immer als Feature-Selektor, z. B. `data-accordion-slider`
- Kind-Container als `data-<feature>-<part>`, z. B.
  - `data-accordion-slider-nav`
  - `data-accordion-slider-media`
  - `data-accordion-slider-pagination` (optional)

### Gemeinsame Data-Optionen (empfohlen)

- `data-mobile-breakpoint="767"` (Fallback: `767`)
- `data-slide-speed="450"` (Fallback: `450`)
- `data-pause-on-hover="true|false"` (Fallback: `false`)
- `data-pause-when-offscreen="true|false"` (Fallback: `true`)
- `data-root-margin="100px 0px 100px 0px"` (Fallback wie angegeben)

Optional pro Feature:

- `data-media-loop="fake"` fuer expliziten Loop-Fallback bei Fade/Loop Edge-Cases

### Reuse-Architektur

- Gemeinsame Helper liegen in `js/components/slider-core.js`:
  - `parseBool(...)`
  - `parseNumber(...)`
  - `createAutoplayController(...)`
- Feature-spezifische Logik bleibt im jeweiligen Modul, z. B.
  `js/components/accordion-slider.js`.

### Lifecycle-Richtlinien

- Immer instanzlokal auf Root-Basis arbeiten (keine globalen Selektoren).
- Jede Instanz braucht sauberes `init`/`destroy` inkl. Event-Unsubscribe.
- Bei Responsive-Wechsel (Desktop/Mobile) Sub-Swiper sauber erstellen/zerstoeren.
- Offscreen/Hover/Tab-hidden sollen nur Autoplay steuern, nicht Interaktion blockieren.

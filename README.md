# Portfolio

Static site served by nginx in Docker. No build step.

## Run
    docker compose up -d
    # open http://localhost:8080

Point your Cloudflare Tunnel (or reverse proxy) at `localhost:8080`.

## Add a project (no rebuild)
Edit `site/data/projects.json` and copy one object. Fields: id, title, event, period, tags (ai / software / hardware), tagline, role, result, summary, contributions[], stack[], media[], links[], optional cover.
Clicking the card opens its detail popup (link to one: `/#p-<id>`).
Project media item: `{ "type": "image|video|drive", "src": "assets/...", "caption": "..." }`

## Demo video and mockups per project
Folder per project: `site/assets/projects/<id>/` (e.g. `tambak/`).
In `projects.json` add a main demo (shown as the player at the top of the popup) and extra screenshots/mockups:

    "demo": { "type": "video", "src": "assets/projects/tambak/demo.mp4", "poster": "assets/projects/tambak/poster.jpg" },
    "media": [
      { "type": "image", "src": "assets/projects/tambak/mockup-1.png", "caption": "Dashboard mockup" }
    ]

For a big video use `"demo": { "type": "drive", "src": "https://drive.google.com/file/d/FILE_ID/preview" }`.

## Experience / education: details + photo slider
Clicking an Education or Experience card opens a popup. Edit `site/data/experience.json` (keyed by id):
ids: ui, sma, ntu-peak, bem-ftui, digital-lab, exercise, circait, kombo.

    "ntu-peak": {
      "highlights": ["Bullet shown under Details", "..."],
      "photos": [
        "assets/experience/ntu-peak/team.jpg",
        { "type": "image", "src": "assets/experience/ntu-peak/demo-day.jpg", "caption": "Demo day" },
        "assets/experience/ntu-peak/pitch.mp4"
      ]
    }

Files go in `site/assets/experience/<id>/`. Photos show as a swipeable slider (arrows, dots, swipe); click a photo to enlarge.
The same slider is used for `media` in projects and `photos` in awards.

## Edit the About text
`site/index.html`, section `id="about"` (3 paragraphs inside `<div class="content prose">`).

## Where files go (summary)
| What | Folder | Listed in |
|---|---|---|
| Profile photo | `assets/img/profile.webp` | (automatic) |
| Experience / education photos | `assets/experience/<id>/` | `data/experience.json` |
| Project demo, mockups | `assets/projects/<id>/` | `data/projects.json` |
| Award certificate and photos | `assets/awards/<id>/` | `data/media.json` > awards |
| Certificates | `assets/certs/` | `data/media.json` > certificates |
| Gallery | `assets/img/`, `assets/video/` | `data/media.json` > gallery |
| CV and other docs | `assets/docs/` | `data/media.json` > documents |

## Awards (certificate and/or photos)
Folder per award: `site/assets/awards/<id>/`. Edit `awards` in `site/data/media.json`:

    { "id": "garuda-hacks-7", "title": "2nd place", "event": "...", "date": "Jul 2026",
      "certificate": "assets/awards/garuda-hacks-7/certificate.pdf",
      "photos": ["assets/awards/garuda-hacks-7/team.jpg", "assets/awards/garuda-hacks-7/stage.jpg"],
      "link": "https://..." }

`certificate` can be PDF or image, `photos` and `link` are optional. Clicking the award opens a popup with them.

## Certificates
Put files in `site/assets/certs/` (PDF, JPG, PNG) and match the `file` path in `site/data/media.json` under `certificates`.

## Gallery, documents, profile photo
- Files go in `site/assets/img`, `video`, `docs`; list them in `site/data/media.json` (see `media.example.json`).
- Profile photo: `site/assets/img/profile.webp` (transparent cutout, PNG or WebP).
- Photos: resize to about 1600px wide. Videos: H.264 MP4 under about 30 MB
  (`ffmpeg -i in.mov -vcodec libx264 -crf 28 -vf scale=1280:-2 out.mp4`).
  Use `type: "drive"` only for very large videos (share as "Anyone with the link", use the `/preview` URL).

Edits to `site/` show on refresh. After editing `nginx.conf`: `docker compose restart`.

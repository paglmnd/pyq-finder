# PYQ Finder
Offline Android app: search any topic / subject / year / question → matching MBBS PYQs + PrepLadder lectures.
(139 papers · 550 questions · 618 lectures)

## Make the APK with GitHub
1. On github.com create a **new repository**.
2. Click **Add file → Upload files** and drag in every file from this folder
   (index.html, app.js, style.css, data.json, package.json, capacitor.config.json, make_icons.py, build-apk.yml, README.md, .gitignore). Commit.
3. The build needs one file in a special place. Click **Add file → Create new file**, type the name
   `.github/workflows/build-apk.yml` (typing the slashes creates the folders), paste the full contents of `build-apk.yml`, commit.
4. Open the **Actions** tab → *Build Android APK* runs (5–8 min). If it doesn't start, open it and press *Run workflow*.
5. Download **PYQ-Finder.apk** from the **Releases** page (tag `latest`) and install it on your phone.

Test on a computer: `npm run serve` then open http://localhost:8080

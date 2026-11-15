// Builds the Firebase Hosting copy in dist/.
// index.html is written without <html>/<head> tags (the claude.ai artifact adds them),
// so this wraps it in a full page for normal web hosting. Run: node build.js
const fs = require('fs');
const path = require('path');

const src = __dirname;
const out = path.join(src, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);

let body = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
const headTags = (body.match(/^\s*<(title|link)\b.*$/gm) || []).map(s => s.trim());
body = body.replace(/^\s*<(title|link)\b.*$\n?/gm, '');
body = body.replace(/^\s*<meta charset[^>]*>\s*$\n?/gim, '');   // the page head below sets the charset
const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Keep a Moon base crew safe through real solar storms from NASA's DONKI records. NASA Space Apps 2026.">
${headTags.join('\n')}
</head>
<body>
${body}
</body>
</html>
`;
// cache-busting: a new ?v= on every build so browsers never mix old and new files
const v = Date.now().toString(36);
fs.writeFileSync(path.join(out, 'index.html'), page.replace(/(src|href)="(?!https?:|data:|#)([^"?]+\.(?:js|css))"/g, `$1="$2?v=${v}"`));
for (const f of ['style.css', 'wow.css', 'sfx.js', 'learn.js', 'crew.js', 'scene.js', 'game.js']) fs.copyFileSync(path.join(src, f), path.join(out, f));
// Greenhouse Guard mini-game (opened from the main game during severe storms) and its NASA media
for (const f of ['greenhouse-guard.html', 'greenhouse-guard.css', 'greenhouse-action.js']) fs.copyFileSync(path.join(src, f), path.join(out, f));
// Cosmic Match (oxygen reboot) and Solar Reboot (solar panels) also open inside the main game
for (const f of ['cosmic-match.html', 'cosmic-match.css', 'cosmic-match.js', 'solar-panels.html', 'shield-repair.css', 'shield-repair.js', 'shield-showcase.css', 'shield-showcase.js']) fs.copyFileSync(path.join(src, f), path.join(out, f));
// Water and air repairs, Shield Sync, and shared presentation assets.
for (const f of ['leak-patrol.html', 'scrubber-sprint.html', 'life-support-arcade.js', 'life-support-arcade.css', 'shield-sync.html', 'shield-sync.js', 'shield-sync.css']) fs.copyFileSync(path.join(src, f), path.join(out, f));
for (const f of ['moon-water.html', 'moon-water.js', 'moon-water.css']) fs.copyFileSync(path.join(src, f), path.join(out, f));
fs.cpSync(path.join(src, 'assets'), path.join(out, 'assets'), { recursive: true });
// the mini-game pages get the same version tag, so a browser never runs an old mini-game script
for (const f of fs.readdirSync(out).filter(f => f.endsWith('.html') && f !== 'index.html')) {
  const p = path.join(out, f);
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/(src|href)="(?!https?:|data:|#)([^"?]+\.(?:js|css))(?:\?[^"]*)?"/g, `$1="$2?v=${v}"`));
}
fs.cpSync(path.join(src, 'vendor'), path.join(out, 'vendor'), { recursive: true });   // DiceBear avatars (bundled for offline play)
// crew photos (optional): copy only the image files
const crew = path.join(src, 'crew');
if (fs.existsSync(crew)) fs.cpSync(crew, path.join(out, 'crew'), { recursive: true, filter: f => fs.statSync(f).isDirectory() || /\.(jpe?g|png|webp)$/i.test(f) });
console.log('Built dist/ (index.html, style.css, game.js, Greenhouse Guard, assets, crew photos)');

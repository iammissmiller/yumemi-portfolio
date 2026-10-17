# Yumemi 🐾

A portfolio website for **Yumemi**, a baby calico kitten who never grows up and wanders across East Asia, chasing warm noodles, kites and falling petals.

**Style: Y2K retro folklore.** Watercolour East Asia around the year 2000 (paper lanterns and shrine gates next to vending machines, phone booths and sticker-photo booths), wrapped in a Japan/Korea 2000s pop homepage: candy-gloss buttons, stickers, pixel labels, flip-phone messages, a holographic ID card, an LED ticker and a hit counter.

Built for the haX.baby *Baby's First Website* hackathon (17–19 October 2026), **Track 2: original character**.

## Character sheet
| | |
|---|---|
| **Name** | Yumemi (ゆめみ) |
| **What she is** | A baby calico kitten (black, orange and white) who never grows up |
| **What she does** | Wanders East Asia with her lantern, befriends little children, eats every local dish, and leaves small lessons about loving childhood and living in the moment |
| **Her story** | *(being written)* |
| **Motto** | *(being written)* |

## Her work (Selected work)
1. **The Noodle Atlas:** six bowls from Lanzhou to Seoul. Tap a bowl to read her tasting note (with a slurp).
2. **Petal Almanac:** one road painted in four seasons. Season tabs repaint it (arrow keys work too).
3. **Lantern Letters:** five little letters for children about childhood and living in the moment. Tap a lantern to open one.

## How it moves
- **Opening:** the painting bleeds onto the paper, her name is brushed in stroke by stroke, and Yumemi hops onto the path with her lantern.
- **Yumemi as your guide:** after the opening she stays in the corner, changing pose for each section (noodles at Work, waving at Skills, asleep at the Guest book). Pat her and she talks.
- **Scroll-driven:** headings rise word by word, paintings bleed in as they arrive, and blocks fade away as they leave.
- **Story:** a cinematic walk; at each of the five places the camera eases in, the sky changes with the time of day and a chapter rises in.
- **Every section is a full screen,** ending with a full-screen night finale at the city wall.

## What's on the page
- **Hero:** Yumemi leans toward your cursor, waves when you pat her, and falls asleep if you leave her alone.
- **The journey:** scroll down and a long painted road slides sideways while Yumemi walks it (a 4-frame walk cycle that follows your scrolling, and turns around if you scroll back). She stops at five places (a city gate, a noodle stall, a kite field, a sakura road and a mountain teahouse), strikes a pose at each, and a page of her story appears (GSAP ScrollTrigger).
- **Morning / night** seal (朝 / 夜): the whole site and the footer painting change with it.
- **Sound** seal (音 / 静): every sound is synthesised live with the Web Audio API, with a mute switch that remembers your choice.
- **Growth chart** (skills): she never grows, her skills do, marked on a teahouse post.
- **Travel permit** (the 5-point character sheet) and a **guest book** (coming soon).
- A section menu (a tab bar at the bottom on phones) that highlights where you are.
- **Footer:** the journey ends at the old city wall at night, with Yumemi asleep on the road.
- Early-web touches: a gold-leaf cursor trail, a scrolling ticker, a hit counter in 正 tally marks.
- A secret, for the curious. (Hint: it's a word.)

## Tech
Plain HTML, CSS and JavaScript modules, no build step.
- `index.html`: page structure
- `css/style.css`: all styles (morning and night themes)
- `js/`: one module per job (`work.js`, `journey.js`, `yumemi.js`, `sound.js`, `theme.js`, `effects.js`, `store.js`), wired together in `main.js`
- `vendor/gsap/`: GSAP 3.15 (bundled)
- `fonts/`: Hachi Maru Pop, DotGothic16, Zen Maru Gothic and Yuji Syuku, trimmed to the characters the site uses (SIL Open Font License, licence files included)

### Run it locally
The site has no build step, but JavaScript modules need a small web server (opening `index.html` directly will not run them):
```
npm install
npm run dev
```
then open http://localhost:5173. Alternatives: `python -m http.server 8000`, or the VS Code "Live Server" extension.

Note: the fonts are trimmed. If you add new Japanese or Chinese characters to the page, they need to be added to the font files too.

## Credits
- Yumemi and her world: our original characters and ideas.
- Watercolour illustrations: generated with ChatGPT (OpenAI) from our prompts, then cut out and cleaned up by our team.
- Fonts: Hachi Maru Pop, DotGothic16, Zen Maru Gothic and Yuji Syuku (SIL Open Font License).
- Animation: GSAP by GreenSock.
- Confetti: canvas-confetti (ISC licence).

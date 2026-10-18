# Yumemi 🐾

**Live site:** https://yumemi-portfolio.vercel.app

A portfolio website for **Yumemi**, a baby calico kitten who never grows up and wanders across East Asia, chasing warm noodles, kites and falling petals.

**Style: Y2K retro folklore.** Watercolour East Asia around the year 2000 (paper lanterns and shrine gates next to vending machines, phone booths and sticker-photo booths), wrapped in a Japan/Korea 2000s pop homepage: candy-gloss buttons, stickers, pixel labels, flip-phone messages, a holographic ID card, an LED ticker and a hit counter.

Built for the haX.baby *Baby's First Website* hackathon (17–19 October 2026), **Track 2: original character**.

## Character sheet
| | |
|---|---|
| **Name** | Yumemi (ゆめみ) |
| **What she is** | A baby calico kitten (black, orange and white) who never grows up. Lilac hoodie, big headphones, platform sneakers, and a paper lantern on a stick. |
| **What she does** | Wanders East Asia with her lantern, befriends little children, eats every local dish, and leaves small lessons about loving childhood and living in the moment. |
| **Her story** | Long ago, on the last night of a lantern festival, she made a wish on the only lantern still glowing: to stay little until she had tasted every bowl and met every child. The lantern said yes. So she carries it with her, and she keeps walking. |
| **Motto** | Stay little, and eat it while it's warm ♡ |

## What's on the page
- **Hero:** an opening sequence (the painting bleeds onto the paper, her name is brushed in, Yumemi hops onto the path). She leans toward your cursor, waves when you pat her, and falls asleep if you leave her alone.
- **Yumemi as your guide:** after the hero she stays in the corner with a pose and a line for each section. Pat her and she talks.
- **Selected work:** three projects, coming soon.
- **My story:** scroll down and a long painted road slides sideways while Yumemi walks it (a 4-frame walk cycle that follows your scrolling, and turns around if you scroll back). She stops at five places (an old city gate, a midnight noodle stall, a kite playground, a sakura shrine and a rooftop teahouse); at each, the camera eases in, the sky changes with the time of day and a chapter of her story appears.
- **Growth chart** (skills): she never grows, her skills do, marked on a teahouse post.
- **Travel permit:** the 5-point character sheet as a holographic ID card.
- **Guest book:** opens soon.
- **Footer:** the journey ends at the old city wall at night, with Yumemi asleep on the road.
- **Morning / night** seal (朝 / 夜): night is a dim, quiet version of the day.
- **Sound** seal (音 / 静): every sound is synthesised live with the Web Audio API, with a mute switch that remembers your choice.
- Early-web touches: a cursor trail (sakura petals by day, stars by night), an LED ticker, a classic hit counter, blinking stickers.
- A secret, for the curious. (Hint: it's a word.)
- Every section fills the screen; the layout adapts to phones (bottom tab bar) and respects "reduce motion".

## Tech
Plain HTML, CSS and JavaScript modules, no build step.
- `index.html`: page structure
- `css/style.css`: all styles (morning and night themes)
- `js/`: one module per job (`journey.js`, `reveal.js`, `companion.js`, `yumemi.js`, `sound.js`, `theme.js`, `effects.js`, `store.js`), wired together in `main.js`
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

# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 19 + TypeScript + SCSS, custom Webpack, react-router 7, react-i18next. Deployed to Cloudflare Pages. Backend: separate Django REST API (`../portfolio-backend-v2`), frontend-only changes except the `categories` field on Project.

## Product

andreafrancin.com is the portfolio of Andrea Francín, a freelance illustrator and graphic designer. It shows her projects (illustration, branding, campaigns, editorial and digital work), an About page and a Contact page. A private admin area lets Andrea manage projects (create, edit, hide, reorder, tag with categories, upload and order images), and edit the About and Contact pages.

## Users

- **Public visitors:** commercial clients and agencies commissioning illustration or design, and art directors or publishers hiring an illustrator. Both matter equally. They scan the body of work, filter by discipline, open projects, and decide whether to get in touch.
- **Admin:** Andrea herself, maintaining content on desktop and sometimes on mobile.

## Content and constraints

- Content is trilingual (es, en, ca) and is stored per language (`title_i18n`, `content_i18n`). UI chrome strings live in `src/locales`.
- Project detail and About bodies are Markdown written by Andrea and include inline images.
- Projects have an ordered image set with one cover image, plus a low-quality blurred placeholder (`image_low_url`).
- Filter categories (fixed set): Illustration, Branding, Campaigns, Editorial & Digital (slugs `illustration`, `branding`, `campaigns`, `editorial`). A project can have several.
- Contact email: andfrancin@gmail.com. Social: LinkedIn.
- The existing logo (`icon-logo.tsx`, hand-drawn signature mark) is a brand asset to keep.

## Voice and brand commitments

Professional and fairy-tale. On 2026-09-30 the owner rejected a print-studio direction and then a dark "magic forest" direction, and settled on: "conservative with the old design but improved, more complex and fantasy, but keeping the white clean design, but like a fairy tale". The work is the proof. No invented clients, awards or testimonials.
- Keep the white, clean ground and the original identity: magenta `#bc0e4d` accent, Gloss And Bloom brush lettering for titles (`src/assets/fonts/Gloss_And_Bloom.ttf`), Inter for text, the hand-drawn logo.

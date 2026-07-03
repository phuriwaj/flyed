# flyed CMS — Editor Guide

The flyed CMS is a browser-based editor for blog content. It writes to Git and creates pull requests — no separate database.

## Logging in

1. Visit `https://flyed.dev/admin` (or `http://localhost:4321/admin` for local dev)
2. Click "Login with GitHub"
3. Authorize the flyed CMS app
4. You're in. The CMS shows the blog and team collections.

## Creating a blog post (English)

1. Click **"New Blog (English)"** in the sidebar
2. Fill in the title — the slug auto-generates from it
3. Fill in description, publish date, hero image, author, tags
4. Optionally link related itineraries
5. Write the body in the markdown editor
6. Click **"Publish"**
7. Decap creates a branch (`cms/<your-slug>`), commits your changes, and opens a PR
8. A reviewer checks the PR, sees the CF Pages preview URL, and merges → production

## Translating to Thai

1. Click **"New Blog (ไทย)"**
2. **Use the exact same slug as the English post** (e.g. `01-why-thailand-service-learning`)
3. Translate the title, description, and body
4. Set **Draft: false** when the translation is complete
5. Click **"Publish"** → PR → merge

Posts with **Draft: true** are hidden from `/th/blog` (and the production build skips them).

## Editing an existing post

1. Click the post in the collection list
2. Make your changes
3. Click **"Publish"** → PR → merge

## Saving a draft (not yet ready to publish)

1. Edit a post
2. Click **"Set status → Draft"** (top right)
3. Decap creates a PR with `[DRAFT]` in the title
4. When ready, click **"Set status → In Review"** → reviewer merges

## Previewing your work

- Click the **"View"** button (top right) to see how the post will look
- The preview loads from a CF Pages branch deploy (real Astro-rendered page)
- **First preview takes 30–60 seconds** while CF Pages builds the branch
- Subsequent updates are faster

## Hero images

- Click the image field to upload
- Max 5MB per image
- Images commit to `public/images/uploads/blog/` in the repo
- Use landscape images, ideally 1600×900 or larger

## What you can't do (yet)

- Create or delete team members (open a PR for this)
- Edit itineraries, destinations, or categories (open a PR for this)
- Delete a blog post (open a PR for this)

## Need help?

- Slack: #marketing-eng
- GitHub: @flyed-dev
- Or open a PR with your question

## 👋 Introduction

Welcome to my portfolio! On here you'll find my personal coding projects, work experience, and photography work. This is my biggest front-end project to date, with a lot of moving parts, so let me know if you notice any issues not listed in the **Roadmap**!

## 💻 Demo

Check out the [Demo](https://liambsullivan.com), hosted on Vercel.

Looking for the last version? See the previous [v1](https://v1.liambsullivan.com) version.

## 💪 Features:

- Mobile responsive
- Visually Distinct Card Layout
- Button Animations
- Opacity Animation on Scroll
- Consistent Design Language
- Typed Hero Description Animation
- Sidebar Anchor Navigation
- Cloudinary Photo Backend & Image Management
- Tag-Filtered Photography Gallery with Infinite Scroll
- Archive Section (Layouts, Graphic Design, Presentations, Blog Content)
- WordPress-Powered Berlin Blog Feed
- Lazy Loaded Carousel with Featured and Randomized Photos
- Image Load Animations
- Lightbox Gallery Viewer
- PDF Slide Carousel for Presentations
- Interactive Project Demos and UX Case Studies
- Server-Side API Routes for Cloudinary Integration

## 🗂️ Content Sections

The site is organized around several content-focused sections:

- **Home** - About, project cards, UX work, featured photography, and extracurricular highlights
- **Projects** - Detailed writeups for featured software projects
- **UX** - Case study content documenting featured UX projects
- **Photography** - Cloudinary-backed portfolio gallery with dynamic tag filtering and lightbox viewing
- **Other Work** - Archive grids for layouts, graphic design, presentations, cooking links, and Berlin blog posts

## 🗃️ Content Management

The `/dashboard` route that used to live here has been retired. Photo uploads, tagging, and deletes are now handled by [cms-dashboard](https://github.com/liambsulliva/cms-dashboard), which talks to Cloudinary directly. This site only reads from Cloudinary.

## 🌐 API Routes

The application includes several server-side API routes to be used for Cloudinary-related queries:

- **`POST /api/cloudinary/search`** - Filter images by tag, fetch paginated results, and serve bounded randomized carousel searches
- **`GET /api/cloudinary/tags`** - Retrieve all available image tags from Cloudinary

All API routes require Cloudinary credentials to be configured through environment variables, as mentioned below. These routes are read-only.

## ⚙️ Stack

- [**ASTRO** + **Typescript**](https://astro.build/) - Astro is the all-in-one web framework designed for speed.
- [**Vercel**](https://vercel.com/) - Deployment adapter for SSR pages and server-side API routes.
- [**Tailwind CSS**](https://tailwindcss.com/) - Tailwind CSS is a utility-first CSS framework.
- [**React**](https://react.dev) - A JavaScript library for building user interfaces.
- [**Svelte**](https://svelte.dev) - A modern component framework for building user interfaces.
- [**Geist Sans**](https://vercel.com/font) - Self-hosted typeface for the site interface.
- [**React Photo Album**](https://react-photo-album.com/) - A responsive photo gallery component for React.
- [**Yet Another React Lightbox**](https://yet-another-react-lightbox.com/) - A modern lightbox component for React.
- [**PDF.js**](https://mozilla.github.io/pdf.js/) - PDF rendering for slide-based presentation carousels.
- [**Shiki**](https://shiki.style/) - Syntax highlighting for code samples.
- [**Cloudinary**](https://cloudinary.com/) - Cloud-based image and video management platform.

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables.

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Switch React Menu server-side proxy
RAWG_API_KEY=your_rawg_api_key
```

Configure `RAWG_API_KEY` as a server-only environment variable on the Vercel
project. Do not prefix it with `PUBLIC_` or `VITE_`; the browser preview calls
the Astro `/api/rawg/*` proxy and never receives the key.

## 🧞 Commands

All commands are run from the root of the project, from a terminal. This project targets Node 24.x:

- `npm install`: Install all dependencies
- `npm run dev`: Starts the development server and watches for changes
- `npm run build`: Type-checks and builds the project for production
- `npm run preview`: Previews the production build locally

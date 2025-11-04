## 👋 Introduction

Welcome to my portfolio! On here you'll find my personal coding projects, work experience, and photography work. This is my biggest front-end project to date, with a lot of moving parts, so let me know if you notice any issues not listed in the **Roadmap**!

## 💻 Demo

Check out the [Demo](https://liambsullivan.com), hosted on Vercel.

Looking for the last version? See the previous [v1](https://v1.liambsullivan.com) version.

## 💪 Features:

- ✅ Mobile responsive
- ✅ Visually Distinct Card Layout
- ✅ Button Animations
- ✅ Opacity Animation on Scroll
- ✅ Consistent Design Language
- ✅ Cloudinary Photo Backend & Image Management
- ✅ Authenticated Administrator Dashboard
- ✅ Image Upload with Tag Management
- ✅ Archive Section (Layouts, Presentations, Blog Content)
- ✅ Lazy Loaded Carousel with Featured Photos
- ✅ Image Load Animations
- ✅ Lightbox Gallery Viewer
- ✅ Server-Side API Routes for Cloudinary Integration

## 🛣️ Roadmap

- ❌ Light Mode Support
- ❌ Integrate Github REST into Project Cards
- ❌ Enhanced Archive Search & Filtering

## 🔐 Authentication

The dashboard is protected with HTTP Basic Authentication using bcrypt-hashed credentials. Access is required to:

- Upload photography images
- Manage image tags and metadata
- Mark photos as "featured" for the homepage carousel

## 🌐 API Routes

The application includes several server-side API routes to be used for Cloudinary-related queries:

- **`POST /api/cloudinary/search`** - Filter images by tag, fetch all with included caching
- **`POST /api/cloudinary/upload`** - Upload images with signed authentication and tag management
- **`GET /api/cloudinary/tags`** - Retrieve all available image tags from Cloudinary

All API routes require Cloudinary credentials to be configured through environment variables, as mentioned below.

## ⚙️ Stack

- [**ASTRO** + **Typescript**](https://astro.build/) - Astro is the all-in-one web framework designed for speed.
- [**Tailwind CSS**](https://tailwindcss.com/) - Tailwind CSS is a utility-first CSS framework.
- [**React**](https://react.dev) - A JavaScript library for building user interfaces.
- [**Svelte**](https://svelte.dev) - A modern component framework for building user interfaces.
- [**React Photo Album**](https://react-photo-album.com/) - A responsive photo gallery component for React.
- [**Yet Another React Lightbox**](https://yet-another-react-lightbox.com/) - A modern lightbox component for React.
- [**Cloudinary**](https://cloudinary.com/) - Cloud-based image and video management platform.
- [**bcryptjs**](https://github.com/dcodeIO/bcrypt.js) - Password hashing for authentication.
- [**Iconify**](https://iconify.design) - A Library of SVG Icons.

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Dashboard Authentication (hashed with a 12-round bcrypt hash)
AUTH_USER_HASH=your_bcrypt_hashed_username
AUTH_PASSWORD_HASH=your_bcrypt_hashed_password
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

- `npm install`: Install all dependencies
- `npm run dev`: Starts the development server and watches for changes
- `npm run build`: Builds the project for production
- `npm run preview`: Previews the production build locally

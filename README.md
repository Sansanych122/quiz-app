<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=20232A&height=250&section=header&text=UniQuiz%20Frontend&fontSize=60&fontColor=61DAFB&animation=fadeIn&fontAlignY=38&desc=React%20SPA%20built%20with%20Vite%20and%20Tailwind%20CSS&descAlignY=55&descSize=20" width="100%" alt="Header Banner" />
  
  <br /><br />
  
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
  [![Cloudflare Pages](https://img.shields.io/badge/Cloudflare_Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
</div>

<hr />

# UniQuiz: Client Application

**Live Demo:** [uniquiz.pages.dev](https://uniquiz.pages.dev/)

## Overview
This repository contains the client-side Single Page Application (SPA) for **UniQuiz**, an AI-powered educational platform. Built with React and Vite, the frontend delivers a highly optimized, interactive user interface utilizing a Glassmorphism design system. 

It handles user authentication, dynamic quiz rendering, performance tracking, and communicates with both the Supabase PostgreSQL database (for fast CRUD operations) and a dedicated FastAPI microservice (for heavy AI and parsing tasks).

## Core Functionality
* **AI Generation Interface:** Provides a seamless UI for users to upload lecture notes and input custom AI instructions, triggering the backend Gemini LLM pipeline.
* **Adaptive Testing UI:** An interactive quiz module providing instant visual feedback and dynamic state management for the "Error Correction" mode.
* **Direct Database Integration:** Utilizes the Supabase JS client to bypass backend bottlenecks, executing direct, secure reads/writes for course management and analytics under strict Row Level Security (RLS) policies.
* **Google OAuth & Compliance:** Features fully integrated Google Single Sign-On (SSO). The application includes verified `PrivacyPolicy` and `TermsOfService` pages, alongside a verified Google Cloud Console domain routing.
* **SEO & Performance:** Achieves a 99/100 Performance and 100/100 SEO score on PageSpeed Insights via proper configuration of `robots.txt`, `sitemap.xml`, and Vite build optimizations.

## Project Structure
The application follows a standard React/Vite architecture, separating state management (Contexts), external connections (Lib), and UI Views (Pages).

```text
├── public/
│   ├── googlebadf9f04855a4fbc.html  # Google Search Console verification
│   ├── robots.txt                   # Search engine crawling rules
│   └── sitemap.xml                  # SEO indexing map
├── src/
│   ├── assets/                      # Static images and SVGs
│   ├── contexts/
│   │   └── AuthContext.jsx          # Global state management for user sessions
│   ├── lib/
│   │   └── supabase.js              # Supabase client initialization
│   ├── pages/
│   │   ├── AddCoursePage.jsx        # Course creation and file upload UI
│   │   ├── AuthPage.jsx             # Login and Google OAuth integration
│   │   ├── CoursePage.jsx           # Dashboard for managing a specific course
│   │   ├── HomePage.jsx             # Authenticated user dashboard and leaderboard
│   │   ├── LandingPage.jsx          # Public marketing page
│   │   ├── PrivacyPolicy.jsx        # Legal compliance page
│   │   ├── QuizPage.jsx             # Active testing interface
│   │   └── TermsOfService.jsx       # Legal compliance page
│   ├── App.jsx                      # Main application routing
│   └── main.jsx                     # React DOM entry point
├── tailwind.config.js               # Tailwind CSS design system configuration
├── vite.config.js                   # Vite build tool configuration
└── package.json                     # Project dependencies and scripts

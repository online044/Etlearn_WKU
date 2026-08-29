# AGENTS.md — Master Design, UX & Technical Guidelines for EthioLearn Pro

## 🎯 App Vision & Context
**EthioLearn Pro** is a bilingual (Amharic/English) AI-powered study platform designed for Ethiopian university students (initially tailored for Wolkite University and expanding nationwide). 

The platform provides AI tutoring ("አስጎብኚ"), past exam prep, AI flashcards, university department notes, digital bookstore access, and mind relaxation tools. It operates on a freemium model with local payment providers (Telebirr, CBE Birr, HelloCash/Chapa).

---

## 🎨 Visual Identity & Design System

### 1. Palette & Atmosphere
* **Base Theme**: Deep Navy & Dark Slate (`#0A1128` / `#0F172A`) as primary canvas. Never pure `#000000`.
* **Accent Color**: Premium Warm Gold / Amber (`#F59E0B` / `#EAB308` / `#D97706`). Use consistently as the hero action color across all screens. Avoid introducing random accent colors per screen.
* **Card & Surface Tokens**: Elevated surface dark navy (`#1E293B`) with faint 1px borders (`rgba(255, 255, 255, 0.08)`) and subtle dark shadows for visual elevation.
* **Status Badges**:
  * Success / Verified: Emerald Green (`#10B981`)
  * Warning / Pending: Warm Amber (`#F59E0B`)
  * Pro / AI Feature: Royal Purple / Gold Glow

### 2. Typography & Bilingual Script Optimization
* **Latin Font**: Modern geometric sans (Plus Jakarta Sans / Inter).
* **Ge'ez / Amharic Font**: `Noto Sans Ethiopic` or system-fallback Ethiopic serif/sans.
* **Line-Height & Layout-Shift**:
  * Amharic glyphs render taller and denser than Latin characters. Standard line-height MUST be set to at least `1.6` for all text blocks containing Amharic.
  * Buttons, badges, and tab headers MUST feature flex alignment and reserved vertical padding so switching languages (English <-> Amharic) never triggers layout shift or text clipping.

### 3. Spacing & Spatial Rhythm
* **Border Radius Scale**: Standardized scale across all components:
  * Pills / Tags / Avatar Buttons: `9999px`
  * Action Buttons & Input Fields: `12px`
  * Standard Cards & Modals: `16px`
  * Large Container Panels: `24px`
* **Padding & Margins**: Outer container padding must always exceed or match inner element padding (minimum 16px padding on mobile screens).

---

## 📱 Navigation & Component Architecture

### 1. Core Navigation Bar (5-Section Bottom Nav)
* **Sections**: Home, Exams/Prep, AI Tutor ("አስጎብኚ"), Notes/Books, Profile/Account.
* **Touch Targets**: Minimum 44px x 44px for touch accessibility on Android and iOS devices.
* **Active Indicator**: Glowing gold pill indicator with subtle scale transition (`150ms-200ms`).

### 2. Mascot ("አስጎብኚ" - Asgobnyi) Usage
* Appears strategically during **Onboarding**, **Empty States**, **Study Streak Achievements**, and **AI Assistant Dialogs**.
* Keep the mascot helpful and concise — avoid overusing it on dense study lists or active exam timers to prevent distraction.

### 3. Local Payment & Trust Signals (Telebirr, CBE Birr, HelloCash)
* **Currency Formatting**: Explicitly display pricing in Ethiopian Birr (`ETB` or `ብር`) with clear billing intervals (Monthly/Semester/Annual).
* **Provider Logos**: Clear, high-contrast Telebirr, CBE Birr, and HelloCash integration badges.
* **Security Copy**: Include trust microcopy ("Encrypted 256-bit payment process", "Official Wolkite University partner format") near payment actions.

---

## ⚡ Motion, Feedback & Performance

* **Page Transitions**: Smooth, lightweight fade/slide transitions (`150ms - 250ms`) using `motion/react`.
* **State Feedback**:
  * **Loading**: Always prefer skeleton loading blocks over generic spinning loaders.
  * **Async Actions**: Show toast/snackbar alerts upon saving notes, creating flashcards, or syncing bookmarks.
  * **Empty States**: Present a clear illustration/icon, encouraging title, and actionable primary button.

---

## 🛡️ Technical & Architecture Rules
1. **Full-Stack Security**: All Gemini AI prompts, Supabase/Firebase credentials, and payment API calls run strictly on server-side endpoints (`/api/*`).
2. **Iconography**: Exclusively use `lucide-react` icons for visual consistency.
3. **Responsiveness**: Mobile-first layout design constrained to `max-w-7xl mx-auto` on wide desktop viewports.

# Offline PDF Reader

A modern web application for reading PDF documents with offline support, file management, and a responsive, user-friendly interface.

---

## Overview

This project is a feature-rich PDF reader designed to work seamlessly both online and offline. Users can upload their own PDF files, track their reading progress, and access documents even without an internet connection. The application leverages several modern web technologies to provide a smooth and interactive experience.

---

## Features

- **PDF Upload:** Drag and drop or select PDF files to read.
- **Offline Access:** Uploaded files are stored locally for offline use.
- **Reading Progress:** Automatically tracks and saves your reading position.
- **File Library:** Manage and revisit your uploaded documents.
- **Network Awareness:** Adapts to connection quality and data saver settings.
- **Location-Based Recommendations:** Offers reading suggestions based on your current weather.
- **Responsive Design:** Optimized for both desktop and mobile devices.
- **Performance Optimizations:** Uses background tasks and lazy loading for a fast, efficient experience.

---

## Technology Stack

- **React** for building the user interface
- **Vite** for fast development and build tooling
- **PDF.js** for rendering PDF documents in the browser
- **IndexedDB** (via localForage) for offline file storage
- **Service Workers** for offline support
- **Geolocation API** for location-based features
- **Network Information API** for connection-aware optimizations
- **OpenWeatherMap API** for weather-based recommendations
- **React Icons** for consistent, scalable iconography

---

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open the app in your browser:**
   - Visit the local URL provided in your terminal.
   - Allow location permissions to enable weather-based features.

4. **Usage:**
   - Upload a PDF file to begin reading.
   - Your progress is saved automatically.
   - Access your library to manage or revisit documents.

---

## Project Structure

- `src/` – Main source code
  - `components/` – UI components (PDF viewer, uploader, library, etc.)
  - `hooks/` – Custom React hooks for background tasks, network info, geolocation, etc.
  - `utils/` – Utility modules for file management and local storage
- `public/` – Static assets and service worker

---

## Notes

- The application is fully client-side and does not require a backend.
- All features are accessible from the main interface and footer.
- The codebase is clean, modular, and easy to maintain.
- Works in all modern browsers.

---

## Author

- ** VIKAS KUMAR **
- Contact: vikas12253@gmail.com

---

Thank you for taking the time to review this project.

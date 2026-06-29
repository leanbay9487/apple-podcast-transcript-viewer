# Apple Podcast Transcript Viewer 🎙️

A modern, responsive, and beautiful web application that securely extracts and displays Apple Podcast transcripts directly from your local MacOS files.

## Features ✨

- **Fully Local Processing**: Extracts and processes SQLite databases and TTML transcripts completely in your browser. No files are uploaded to any server.
- **Premium Design**: Features a beautiful glassmorphism aesthetic, deep gradients, and smooth micro-animations.
- **Drag and Drop Interface**: Easily drag your Apple Podcasts data folder right into the browser to instantly view all cached transcripts.
- **Responsive Layout**: Designed to look great on large desktop monitors.

## How it Works 🛠️

The Apple Podcasts app on macOS stores podcast metadata and TTML transcripts locally, but doesn't provide an easy way to export large blocks of text. This application parses the local `MTLibrary.sqlite` database using WebAssembly (`sql.js`) and correlates it with `.ttml` transcripts to give you an easily copyable layout.

## Usage 🚀

1. Open a Finder window on your Mac.
2. Press `Cmd` + `Shift` + `G` (Go to Folder) and enter:
   ```text
   ~/Library/Group Containers/243LU875E5.groups.com.apple.podcasts
   ```
3. Open the [Apple Podcast Transcript Viewer](https://your-username.github.io/apple-podcast-transcript-viewer) (once deployed) or run it locally.
4. Drag and drop all the contents of that folder into the web application.

## Local Development 💻

This project is built with Vanilla HTML/JS/CSS and bundled with [Vite](https://vitejs.dev/).

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/apple-podcast-transcript-viewer.git
   cd apple-podcast-transcript-viewer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Technologies Used 🏗️

- Vanilla HTML, CSS, JavaScript
- [Vite](https://vitejs.dev/)
- [sql.js](https://sql.js.org/) (for browser-based SQLite parsing)
- [Lucide Icons](https://lucide.dev/) (inline SVGs)

## License 📄

MIT License

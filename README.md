# Apple Podcast Transcript Viewer 🎙️

A modern, responsive, and beautiful web application that securely extracts and displays Apple Podcast transcripts directly from your local MacOS files.

## Features ✨

- **Fully Local Processing**: Extracts and processes SQLite databases and TTML transcripts completely in your browser. No files are uploaded to any server.
- **Premium Design**: Features a beautiful glassmorphism aesthetic, deep gradients, and smooth micro-animations.
- **Bulk Extraction**: Select multiple episodes or entire shows, and easily download them as a single `.txt` file or copy them straight to your clipboard.
- **Powerful Organization**: Sort transcripts by publish date, or group them cleanly by the Show they belong to.
- **Drag and Drop Interface**: Easily drag your Apple Podcasts data folder right into the browser to instantly view all cached transcripts.

## How it Works 🛠️

The Apple Podcasts app on macOS stores podcast metadata and TTML transcripts locally, but doesn't provide an easy way to export large blocks of text. This application parses the local `MTLibrary.sqlite` database using WebAssembly (`sql.js`) and correlates it with `.ttml` transcripts to give you an easily copyable layout.

## Usage 🚀

1. Open a Finder window on your Mac.
2. Press `Cmd` + `Shift` + `G` (Go to Folder) and enter:
   ```text
   ~/Library/Group Containers/243LU875E5.groups.com.apple.podcasts
   ```
3. Open the application in your browser.
4. Drag and drop all the contents of that folder into the web application.

## Local Development 💻

This project is built purely with Vanilla HTML, JS, and CSS. There are no heavy frameworks or build steps required.

1. Clone the repository:
   ```bash
   git clone https://github.com/leanbay9487/apple-podcast-transcript-viewer.git
   cd apple-podcast-transcript-viewer
   ```

2. Start a local Python server (available by default on Mac/Conda):
   ```bash
   python3 -m http.server 5173
   ```

3. Open `http://localhost:5173` in your browser.

## Technologies Used 🏗️

- Vanilla HTML, CSS, JavaScript (ES6 Modules)
- Python 3 (Local Development Server)
- [sql.js](https://sql.js.org/) (for browser-based SQLite parsing)
- HTML5 Drag and Drop & File System APIs

## License 📄

MIT License

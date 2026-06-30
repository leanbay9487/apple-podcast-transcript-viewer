// Handle mobile apps
if ('ontouchstart' in window || navigator.maxTouchPoints) {
  document.querySelector('.explanation').innerHTML = `
    <h1>Podcast Transcripts</h1>
    <p class="subtitle" style="display: block;">This tool currently supports MacOS, so please try visiting this website from your laptop or desktop browser.</p>
  `;
}

const copyBtn = document.querySelector('.copy-btn');
if (copyBtn) {
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText('~/Library/Group Containers/243LU875E5.groups.com.apple.podcasts');
    copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>';
    setTimeout(() => {
      copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
    }, 2000);
  });
}

const dropZone = document.body;
const podcastsContainer = document.getElementById('podcasts');

// Selection state
const actionToolbar = document.getElementById('action-toolbar');
const selectAllCheckbox = document.getElementById('select-all');
const selectedCountText = document.getElementById('selected-count');
const copySelectedBtn = document.getElementById('copy-selected');
const downloadSelectedBtn = document.getElementById('download-selected');
let selectedPodcastIds = new Set();
let currentTranscripts = {};

function updateSelectionUI() {
  const count = selectedPodcastIds.size;
  selectedCountText.textContent = `${count} selected`;
  const hasSelection = count > 0;
  copySelectedBtn.disabled = !hasSelection;
  downloadSelectedBtn.disabled = !hasSelection;
  
  const total = Object.keys(currentTranscripts).length;
  selectAllCheckbox.checked = count === total && total > 0;
  selectAllCheckbox.indeterminate = count > 0 && count < total;
}

selectAllCheckbox.addEventListener('change', (e) => {
  const isChecked = e.target.checked;
  selectedPodcastIds.clear();
  
  document.querySelectorAll('.podcast').forEach(card => {
    const checkbox = card.querySelector('input[type="checkbox"]');
    const label = card.querySelector('.podcast-checkbox');
    const id = label.getAttribute('data-id');
    
    if (isChecked) {
      selectedPodcastIds.add(id);
      card.classList.add('selected');
      checkbox.checked = true;
    } else {
      card.classList.remove('selected');
      checkbox.checked = false;
    }
  });
  
  updateSelectionUI();
});

function getSelectedText() {
  let text = '';
  for (const id of selectedPodcastIds) {
    const transcript = currentTranscripts[id];
    if (transcript) {
      text += `=== ${transcript.title} ===\n`;
      text += `Author: ${transcript.author}\n`;
      text += `Date: ${formatDate(transcript.time)}\n\n`;
      
      text += transcript.transcripts.map(s => {
        return s.speaker ? `${s.speaker}: ${s.sentences}` : s.sentences;
      }).join('\n\n');
      
      text += '\n\n';
    }
  }
  return text;
}

copySelectedBtn.addEventListener('click', async () => {
  const text = getSelectedText();
  if (text) {
    try {
      await navigator.clipboard.writeText(text);
      const originalHtml = copySelectedBtn.innerHTML;
      copySelectedBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg> Copied';
      setTimeout(() => {
        copySelectedBtn.innerHTML = originalHtml;
      }, 2000);
    } catch (err) {
      alert("Failed to copy text. Please try downloading instead.");
    }
  }
});

downloadSelectedBtn.addEventListener('click', () => {
  const text = getSelectedText();
  if (text) {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'podcast_transcripts.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
});

// Initialize sql.js
let SQL;
async function init() {
  try {
    SQL = await window.initSqlJs({
      locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });
  } catch (e) {
    console.error("Failed to load sql.js", e);
  }
}
init();

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.classList.add('highlight');
});

dropZone.addEventListener('dragleave', (event) => {
  if (event.clientX === 0 || event.clientY === 0) {
    dropZone.classList.remove('highlight');
  }
});

dropZone.addEventListener('drop', async (event) => {
  event.preventDefault();
  dropZone.classList.remove('highlight');

  if (!SQL) {
    alert("Still loading dependencies or failed to load. Please try again in a moment.");
    return;
  }

  document.body.classList.add('top');
  
  // Clear the current podcast list
  podcastsContainer.innerHTML = '';
  selectedPodcastIds.clear();
  currentTranscripts = {};
  actionToolbar.classList.add('hidden');

  try {
    const items = event.dataTransfer.items;

    // Extract the relevant info
    const queue = [];
    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry();
      if (entry) queue.push(traverseFileTree(entry));
    }
    const relevantFiles = { transcripts: {}, mainDB: null, walFile: null };
    const result = await Promise.all(queue);
    for (const info of result) {
      relevantFiles['transcripts'] = { ...relevantFiles['transcripts'], ...info['transcripts'] };
      if (info.mainDB) relevantFiles.mainDB = info.mainDB;
      if (info.walFile) relevantFiles.walFile = info.walFile;
    }

    let db = null;
    if (relevantFiles.mainDB && relevantFiles.walFile) {
      db = new SQL.Database(new Uint8Array(relevantFiles.mainDB), new Uint8Array(relevantFiles.walFile));
    } else if (relevantFiles.mainDB) {
      db = new SQL.Database(new Uint8Array(relevantFiles.mainDB));
    }

    let transcripts = {};

    if (db) {
      const keys = Object.keys(relevantFiles.transcripts);
      if (keys.length > 0) {
        // Wrap keys in quotes just in case
        const quotedKeys = keys.map(k => `'${k}'`);
        
        const columns = new Set(db.exec('PRAGMA table_info(ZMTEPISODE);')[0].values.map(v => v[1]));
        if (columns.has('ZFIRSTTIMEAVAILABLE')) {
          const podcastInfo = db.exec(
            `SELECT
              ZSTORETRACKID,
              ZAUTHOR,
              ZCLEANEDTITLE,
              ZITUNESSUBTITLE,
              ZDURATION,
              ZFIRSTTIMEAVAILABLE
            FROM ZMTEPISODE
            WHERE ZSTORETRACKID IN (
              ${quotedKeys.join(', ')}
            );
          `);
          
          if (podcastInfo.length > 0) {
            for (const pod of podcastInfo[0].values) {
              transcripts[pod[0]] = {
                'author': pod[1] || 'Unknown Author',
                'title': pod[2] || 'Unknown Title',
                'description': pod[3] || '',
                'duration': pod[4],
                'time': pod[5] + 978307200, // Adjust for Jan 1st 2001 time which Apple uses
              };
            }
          }
        } else {
          const podcastInfo = db.exec(
            `SELECT
              ZSTORETRACKID,
              ZAUTHOR,
              ZCLEANEDTITLE,
              ZITUNESSUBTITLE,
              ZDURATION
            FROM ZMTEPISODE
            WHERE ZSTORETRACKID IN (
              ${quotedKeys.join(', ')}
            );
          `);
          
          if (podcastInfo.length > 0) {
            for (const pod of podcastInfo[0].values) {
              transcripts[pod[0]] = {
                'author': pod[1] || 'Unknown Author',
                'title': pod[2] || 'Unknown Title',
                'description': pod[3] || '',
                'duration': pod[4],
                'time': -1,
              };
            }
          }
        }
      }
    }
    
    for (const podcastId in relevantFiles.transcripts) {
      if (podcastId in transcripts) {
        transcripts[podcastId]['transcripts'] = relevantFiles['transcripts'][podcastId].podcastChunks;
        transcripts[podcastId]['lastModified'] = relevantFiles['transcripts'][podcastId].lastModified;
      } else {
        transcripts[podcastId] = {
          'author': 'Unknown',
          'title': 'Unknown',
          'description': '',
          'duration': -1,
          'time': -1,
          'transcripts' : relevantFiles['transcripts'][podcastId].podcastChunks,
          'lastModified': relevantFiles['transcripts'][podcastId].lastModified,
        };
      }
    }

    // Sort it by last modified
    transcripts = Object.fromEntries(Object.entries(transcripts)
      .sort(([, a], [, b]) => new Date(b.lastModified) - new Date(a.lastModified)));

    currentTranscripts = transcripts;
    const entriesArray = Object.entries(transcripts);
    
    if (entriesArray.length === 0) {
      actionToolbar.classList.add('hidden');
      const podcastDiv = document.createElement("div");
      podcastDiv.className = "noPodcasts";
      podcastDiv.innerHTML = `
      <div class="title" style="margin-bottom: 12px; color: var(--accent);">No podcast transcripts found</div>
      <p style="color: var(--text-secondary); font-size: 0.95rem;">Make sure you followed step 1 to locally cache the transcript data so it can be read.</p>
      `;
      podcastsContainer.appendChild(podcastDiv);
    } else {
      actionToolbar.classList.remove('hidden');
      for (const [podcastId, transcript] of entriesArray) {
        const podcastDiv = document.createElement("div");
        podcastDiv.className = "podcast";
        let description = transcript.description;
        if (!description || description.trim() === '') {
          description = transcript.transcripts.map(s => s.sentences).join(" ");
        }
        podcastDiv.innerHTML = `
        <label class="checkbox-label podcast-checkbox" data-id="${podcastId}">
          <input type="checkbox" />
          <span class="custom-checkbox"></span>
        </label>
        <div class="info">${formatDate(transcript.time)} · ${formatTime(transcript.duration)}</div>
        <div class="title">${transcript.title}</div>
        <span class="author">${transcript.author}</span>
        <div class="description">${description}</div>
        `;

        // Handle checkbox click
        const checkboxLabel = podcastDiv.querySelector('.podcast-checkbox');
        const checkboxInput = podcastDiv.querySelector('input[type="checkbox"]');
        checkboxLabel.addEventListener('click', (e) => {
          e.stopPropagation();
        });
        checkboxInput.addEventListener('change', (e) => {
          if (e.target.checked) {
            selectedPodcastIds.add(podcastId);
            podcastDiv.classList.add('selected');
          } else {
            selectedPodcastIds.delete(podcastId);
            podcastDiv.classList.remove('selected');
          }
          updateSelectionUI();
        });

        // Open modal on card click
        podcastDiv.addEventListener('click', (e) => {
          if (!checkboxLabel.contains(e.target)) {
            openTranscriptPopup(transcript.transcripts, transcript.title);
          }
        });

        podcastsContainer.appendChild(podcastDiv);
      }
    }
    
    updateSelectionUI();
  } catch (e) {
    const podcastDiv = document.createElement("div");
    podcastDiv.className = "noPodcasts";
    podcastDiv.innerHTML = `
    <div class="title" style="margin-bottom: 12px; color: #ff5e5e;">Something went wrong!</div>
    <div class="code-block" style="text-align: left; overflow: auto;"><code>${e.toString()}</code></div>
    `;
    podcastsContainer.appendChild(podcastDiv);
    console.error(e);
  }
});

async function traverseFileTree(entry) {
  if (entry.isFile) {
    return new Promise((resolve) => {
      entry.file(async (file) => {
        const info = { transcripts: {}, mainDB: null, walFile: null };

        if (file.name.endsWith('.ttml')) {
          info.transcripts = await extractPodcastTranscripts(file);
        } else if (file.name === 'MTLibrary.sqlite') {
          info.mainDB = await file.arrayBuffer();
        } else if (file.name === 'MTLibrary.sqlite-wal') {
          info.walFile = await file.arrayBuffer();
        }
        resolve(info);
      });
    });
  } else if (entry.isDirectory) {
    const reader = entry.createReader();
    return new Promise((resolve) => {
      const mainInfo = { transcripts: {}, mainDB: null, walFile: null };

      function readAllEntries() {
        reader.readEntries(async (entries) => {
          for (const subEntry of entries) {
            const subInfo = await traverseFileTree(subEntry);
            mainInfo['transcripts'] = { ...mainInfo['transcripts'], ...subInfo['transcripts'] };
            if (subInfo.mainDB) mainInfo.mainDB = subInfo.mainDB;
            if (subInfo.walFile) mainInfo.walFile = subInfo.walFile;
          }

          if (entries.length === 100) {
            readAllEntries();
          } else {
            return resolve(mainInfo);
          }
        });
      }
      readAllEntries();
    });
  } else {
    return { transcripts: {}, mainDB: null, walFile: null };
  }
}

async function extractPodcastTranscripts(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(reader.result, "application/xml");
      const body = xmlDoc.querySelector("body");

      const match = file.name.match(/(\d+)/);
      const podcastId = match ? match[1] : null;

      if (!body || !podcastId) return resolve({});

      const podcastChunks = [];

      const speakingChunks = xmlDoc.querySelectorAll("p");
      for (const speakingChunk of speakingChunks) {
        const speaker = speakingChunk.getAttribute('ttm:agent');
        const sentences = Array.from(speakingChunk.querySelectorAll('span'))
          .filter(sp => sp.getAttribute('podcasts:unit') === 'sentence')
          .map(sentence => Array.from(sentence.querySelectorAll('span')).map(sp => sp.textContent).join(' '))
          .join(' ');
          
        if (sentences.trim().length > 0) {
            podcastChunks.push({ speaker, sentences });
        }
      }

      resolve({ [podcastId]: { podcastChunks, lastModified: file.lastModified } });
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function formatTime(totalSeconds) {
  if (totalSeconds == -1 || isNaN(totalSeconds)) {
    return 'Unknown';
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    if (minutes != 0) {
      return `${hours} HR ${minutes} MIN`;
    } else {
      return `${hours} HR`;
    }
  } else {
    return `${minutes} MIN`;
  }
}

function formatDate(unixTime) {
  if (unixTime == -1 || isNaN(unixTime)) {
    return 'Unknown';
  }
  let date = new Date(unixTime * 1000);
  return date.toLocaleString('default', { month: 'long', year: 'numeric', day: 'numeric' });
}

const modalBackdrop = document.getElementById('transcript-modal');
const modalContent = document.getElementById('transcript-content');
const modalTitle = document.getElementById('modal-title');
const closeModalBtn = document.getElementById('close-modal');

function openTranscriptPopup(transcripts, title) {
  modalTitle.textContent = title;
  modalContent.innerHTML = transcripts.map(s => {
      let speakerHtml = s.speaker ? `<strong style="color: var(--accent); margin-right: 8px;">${s.speaker}</strong>` : '';
      return `<p style="margin-bottom: 16px;">${speakerHtml}${s.sentences}</p>`;
  }).join('');
  
  modalContent.scrollTop = 0;
  modalBackdrop.classList.remove('hidden');
}

function closeModal() {
  modalBackdrop.classList.add('hidden');
}

closeModalBtn.addEventListener('click', closeModal);

modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) {
    closeModal();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modalBackdrop.classList.contains('hidden')) {
    closeModal();
  }
});

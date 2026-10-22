/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudentProfile, CustomNote, Flashcard } from '../types';

export function exportOfflineHTML(
  profile: StudentProfile | null,
  notes: CustomNote[],
  decks: { [deckId: string]: Flashcard[] },
  totalStudyHours: number,
  streak: number
): string {
  const safeProfile = profile || {
    name: "Ethiopian Student",
    university: "Wolkite University",
    year: "Freshman",
    subjects: ["General Biology", "Emerging Technologies"],
    avatar: "star"
  };

  // Convert flashcard decks to readable lists
  const decksJSON = JSON.stringify(decks, null, 2);
  const notesJSON = JSON.stringify(notes, null, 2);

  // Render a beautiful, responsive, styled standalone study page
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EthioLearn Pro - Portable offline Study Companion</title>
  <style>
    :root {
      --bg: #0D0D0D;
      --card: #161616;
      --gold: #C8962E;
      --green: #1B6F42;
      --crimson: #A81C2E;
      --border: #2A2A2A;
      --text: #F0EDE8;
      --text-muted: #8A8480;
    }

    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
    }

    header {
      background-color: var(--card);
      border-bottom: 2px solid var(--gold);
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-container {
      width: 44px;
      height: 44px;
      background: radial-gradient(circle, #ffe32e25, transparent);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--gold);
      border-radius: 10px;
      font-size: 24px;
      font-weight: bold;
      color: var(--gold);
    }

    .title-area h1 {
      margin: 0;
      font-size: 20px;
      letter-spacing: 0.5px;
    }

    .title-area p {
      margin: 3px 0 0 0;
      font-size: 11px;
      color: var(--green);
      font-weight: bold;
      text-transform: uppercase;
    }

    .badge {
      background: rgba(200, 150, 46, 0.1);
      border: 1px solid rgba(200, 150, 46, 0.3);
      color: var(--gold);
      padding: 5px 12px;
      border-radius: 30px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .container {
      max-width: 1200px;
      margin: 30px auto;
      padding: 0 20px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 30px;
    }

    @media (min-width: 768px) {
      .container {
        grid-template-columns: 280px 1fr;
      }
    }

    /* Sidebar cards */
    .sidebar-panel {
      background-color: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-col: columns;
      flex-direction: column;
      gap: 20px;
      height: fit-content;
    }

    .profile-card {
      text-align: center;
      padding-bottom: 20px;
      border-b: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }

    .pfp-preview {
      width: 80px;
      height: 80px;
      border-radius: 50px;
      border: 2px solid var(--gold);
      margin: 0 auto 12px auto;
      background-color: #111;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      font-weight: bold;
      font-size: 32px;
      color: var(--gold);
    }

    .pfp-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .profile-card h3 {
      margin: 5px 0;
      font-size: 16px;
    }

    .profile-card p {
      margin: 4px 0;
      font-size: 12px;
      color: var(--text-muted);
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 8px 10px;
      background-color: var(--bg);
      border-radius: 8px;
    }

    .stat-label {
      color: var(--text-muted);
    }

    .stat-val {
      color: var(--gold);
      font-weight: bold;
    }

    /* Tabs content */
    .tab-nav {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 10px;
    }

    .tab-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      padding: 8px 16px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      color: var(--text);
      background-color: rgba(255, 255, 255, 0.05);
    }

    .tab-btn.active {
      color: var(--gold);
      background-color: rgba(200, 150, 46, 0.1);
    }

    .content-area {
      background-color: var(--card);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 24px;
    }

    .study-note-card {
      background-color: var(--bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 15px;
    }

    .study-note-card h4 {
      margin: 0 0 8px 0;
      color: var(--gold);
      font-size: 15px;
    }

    .subject-pill {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
      background-color: var(--green);
      margin-right: 8px;
      text-transform: uppercase;
    }

    .study-note-card p {
      font-size: 13px;
      line-height: 1.5;
      color: #D3CFCA;
      white-space: pre-wrap;
    }

    .deck-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 15px;
    }

    .deck-card {
      background-color: var(--bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 18px;
      cursor: pointer;
      position: relative;
    }

    .deck-card:hover {
      border-color: var(--gold);
    }

    .deck-card h4 {
      margin: 0 0 10px 0;
      color: var(--text);
    }

    /* Flashcard interactive flip elements */
    .flashcard-viewer {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.85);
      z-index: 100;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      padding: 20px;
    }

    .flashcard-container {
      width: 400px;
      max-width: 100%;
      height: 250px;
      perspective: 1000px;
      cursor: pointer;
    }

    .flashcard-inner {
      position: relative;
      width: 100%;
      height: 100%;
      text-align: center;
      transition: transform 0.6s;
      transform-style: preserve-3d;
      border: 1px solid var(--gold);
      border-radius: 16px;
    }

    .flashcard-container.flipped .flashcard-inner {
      transform: rotateY(180deg);
    }

    .flashcard-front, .flashcard-back {
      position: absolute;
      width: 100%;
      height: 100%;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      box-sizing: border-box;
      border-radius: 16px;
      font-size: 16px;
      font-weight: 500;
    }

    .flashcard-front {
      background-color: var(--card);
      color: var(--text);
    }

    .flashcard-back {
      background-color: #111;
      color: var(--gold);
      transform: rotateY(180deg);
      border: 1px solid var(--gold);
    }

    .viewer-controls {
      display: flex;
      gap: 15px;
      margin-top: 20px;
    }

    .btn {
      background-color: var(--gold);
      color: #000;
      font-weight: bold;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
    }

    .btn-secondary {
      background-color: transparent;
      border: 1px solid var(--border);
      color: var(--text);
    }

    .btn:hover {
      opacity: 0.9;
    }

    .empty-state {
      text-align: center;
      color: var(--text-muted);
      padding: 40px;
    }
  </style>
</head>
<body>

  <header>
    <div class="brand">
      <div class="logo-container">ኤ</div>
      <div class="title-area">
        <h1>EthioLearn Pro Offline Book</h1>
        <p>ተማር • አድግ • ብልጽግ • Student Study Card</p>
      </div>
    </div>
    <div class="badge">SECURED PORTABLE PACKAGE</div>
  </header>

  <div class="container">
    <!-- Student Sidebar Info Card -->
    <div class="sidebar-panel">
      <div class="profile-card">
        <div class="pfp-preview" id="offlinePfp">
          <!-- Dynamically computed profile picture -->
        </div>
        <h3 id="pName">${safeProfile.name}</h3>
        <p id="pUni">${safeProfile.university}</p>
        <span class="badge" style="font-size: 9px;">${safeProfile.year}</span>
      </div>

      <div class="space-y-2">
        <div class="stat-row">
          <span class="stat-label">Daily Streak:</span>
          <span class="stat-val">🔥 ${streak} Days</span>
        </div>
        <div class="stat-row" style="margin-top: 8px;">
          <span class="stat-label">Study Accrued:</span>
          <span class="stat-val">⏱️ ${totalStudyHours} Hours</span>
        </div>
      </div>

      <div style="font-size: 11px; text-align: center; color: var(--text-muted); line-height: 1.4; border-top: 1px solid var(--border); pt-3; padding-top: 15px;">
        This study deck was exported while logged into your online portal. All notes and flashcard reviews are preserved.
      </div>
    </div>

    <!-- Right stage tabs -->
    <div>
      <div class="tab-nav">
        <button class="tab-btn active" onclick="switchTab('notes')">Notepad Booklet (${notes.length})</button>
        <button class="tab-btn" onclick="switchTab('flashcards')">Review Cards</button>
      </div>

      <div class="content-area">
        <!-- NOTES TAB CONTAINER -->
        <div id="notes-tab">
          <div id="notesList">
            <!-- Render notes statically -->
          </div>
        </div>

        <!-- FLASHCARDS TAB CONTAINER -->
        <div id="flashcards-tab" style="display: none;">
          <h3 style="margin-top:0; color: var(--gold);">Flashcard Decks</h3>
          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 20px;">
            Click on any deck to open the interactive, offline-responsive study cards player:
          </p>
          <div class="deck-grid" id="decksList">
            <!-- Render decks list -->
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- INTERACTIVE FLASHCARD LIGHTBOX PLAYER -->
  <div class="flashcard-viewer" id="fcViewer">
    <h3 id="vDeckTitle" style="color:var(--gold); margin-bottom: 20px;">Reviewing Deck</h3>
    <div class="flashcard-container" id="fcContainer" onclick="this.classList.toggle('flipped')">
      <div class="flashcard-inner">
        <div class="flashcard-front" id="fcQuestion">Question goes here?</div>
        <div class="flashcard-back" id="fcAnswer">Answer shows here!</div>
      </div>
    </div>
    
    <div style="font-size:11px; color: var(--text-muted); margin-top:10px;">Click the card above to Flip & Reveal</div>

    <div class="viewer-controls">
      <button class="btn btn-secondary" onclick="nextCard(-1)">Prev</button>
      <span id="fcProgress" style="color:var(--text); align-self:center; font-size:13px;">1/10</span>
      <button class="btn btn-secondary" onclick="nextCard(1)">Next</button>
      <button class="btn" style="background-color: var(--crimson); color: white;" onclick="closeViewer()">Close Player</button>
    </div>
  </div>

  <script>
    // Embedded client data
    const userAvatar = ${JSON.stringify(safeProfile.avatar || '')};
    const userSubjects = ${JSON.stringify(safeProfile.subjects || [])};
    const rawDecks = ${decksJSON};
    const rawNotes = ${notesJSON};

    // Render avatar picture matching standard layouts
    function renderOfflineAvatar() {
      const pfpDiv = document.getElementById('offlinePfp');
      if (userAvatar && userAvatar.startsWith('data:image/')) {
        pfpDiv.innerHTML = '<img src="' + userAvatar + '" alt="Student Photo"/>';
      } else {
        // Fallback default letter initial
        const init = "${safeProfile.name.substring(0, 1).toUpperCase()}";
        pfpDiv.innerText = init;
      }
    }

    // Switch tab sheets
    function switchTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.textContent.toLowerCase().includes(tab));
      if (activeBtn) activeBtn.classList.add('active');

      if (tab === 'notes') {
        document.getElementById('notes-tab').style.display = 'block';
        document.getElementById('flashcards-tab').style.display = 'none';
      } else {
        document.getElementById('notes-tab').style.display = 'none';
        document.getElementById('flashcards-tab').style.display = 'block';
      }
    }

    // Populate notes
    function populateNotes() {
      const listDiv = document.getElementById('notesList');
      if (rawNotes.length === 0) {
        listDiv.innerHTML = '<div class="empty-state">No custom booklets or notes saved yet. Export them from settings when you create them!</div>';
        return;
      }

      let html = '';
      rawNotes.forEach(note => {
        html += '<div class="study-note-card">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
            '<h4>' + note.title + '</h4>' +
            '<span class="subject-pill">' + note.subject + '</span>' +
          '</div>' +
          '<p>' + note.content + '</p>' +
          '<div style="font-size:10px; color:var(--text-muted); margin-top:8px;">Created: ' + new Date(note.createdAt).toLocaleDateString() + '</div>' +
        '</div>';
      });
      listDiv.innerHTML = html;
    }

    // Populate flashcard decks
    let activeCards = [];
    let activeCardIndex = 0;

    function populateDecks() {
      const decksList = document.getElementById('decksList');
      const keys = Object.keys(rawDecks);
      
      if (keys.length === 0) {
        decksList.innerHTML = '<div class="empty-state">No custom flashcards compiled found. Try creating or generating some first!</div>';
        return;
      }

      let html = '';
      keys.forEach(key => {
        const cards = rawDecks[key];
        if (!cards || cards.length === 0) return;
        
        html += '<div class="deck-card" onclick="openDeck(\\'' + key + '\\')">' +
          '<h4>🗂️ Subject Deck: ' + key.toUpperCase() + '</h4>' +
          '<p style="font-size: 12px; color:var(--text-muted); margin:0;">Contains ' + cards.length + ' study memory cards</p>' +
          '<div style="border-top:1px solid #222; margin-top:12px; padding-top:8px; font-size:11px; color:var(--gold); font-weight:600;">Launch Deck &rarr;</div>' +
        '</div>';
      });
      decksList.innerHTML = html;
    }

    function openDeck(deckId) {
      activeCards = rawDecks[deckId] || [];
      if (activeCards.length === 0) return;
      
      activeCardIndex = 0;
      document.getElementById('vDeckTitle').innerText = "Reviewing Deck: " + deckId.toUpperCase();
      document.getElementById('fcViewer').style.display = 'flex';
      renderActiveCard();
    }

    function renderActiveCard() {
      if (activeCards.length === 0) return;
      const card = activeCards[activeCardIndex];
      
      document.getElementById('fcContainer').classList.remove('flipped');
      document.getElementById('fcQuestion').innerText = card.question;
      document.getElementById('fcAnswer').innerText = card.answer + (card.explanation ? '\\n\\nℹ️ ' + card.explanation : '');
      document.getElementById('fcProgress').innerText = (activeCardIndex + 1) + ' / ' + activeCards.length;
    }

    function nextCard(offset) {
      activeCardIndex += offset;
      if (activeCardIndex >= activeCards.length) activeCardIndex = 0;
      if (activeCardIndex < 0) activeCardIndex = activeCards.length - 1;
      renderActiveCard();
    }

    function closeViewer() {
      document.getElementById('fcViewer').style.display = 'none';
    }

    window.onload = function() {
      renderOfflineAvatar();
      populateNotes();
      populateDecks();
    }
  </script>
</body>
</html>`;
}

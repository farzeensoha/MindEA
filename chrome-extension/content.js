// MindEase Content Script - Runs on all web pages

const TOXIC_PATTERNS = [
  /hate|hateful|racist|sexist|discrimination/i,
  /kill|death|violence|murder/i,
  /suicide|self-harm|hurt myself/i,
  /abuse|harassment|bully/i
];

const SENSITIVE_KEYWORDS = [
  'suicide', 'kill myself', 'sleeping pills', 'end it all', 
  'want to die', 'no reason to live', 'better off dead'
];

let greyscaleEnabled = false;
let lastScrollTime = Date.now();
let pageAnalyzed = false;

// Initialize
function init() {
  // Monitor scrolling
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      chrome.runtime.sendMessage({ type: 'SCROLL_DETECTED' });
    }, 200);
  });
  
  // Analyze page content after load
  if (document.readyState === 'complete') {
    analyzePage();
  } else {
    window.addEventListener('load', analyzePage);
  }
  
  // Listen for dynamic content changes
  observeContentChanges();
}
  // -------- SEMANTIC FEATURE EXTRACTION (AI CLASSIFICATION) --------
function extractSemanticFeatures(fullText) {
  const title = document.title || '';
  const description =
    document.querySelector('meta[name="description"]')?.content || '';

  const textSample = fullText
    .replace(/\s+/g, ' ')
    .slice(0, 3000); // performance-safe sample

  return {
    url: window.location.href,
    title,
    description,
    textSample
  };
}


function analyzePage() {
  if (pageAnalyzed) return;
  pageAnalyzed = true;
  
  // Get all text content
  const textContent = document.body.innerText;
  // 🔹 Send semantic data for AI-based page classification
chrome.runtime.sendMessage({
  type: 'SEMANTIC_PAGE_DATA',
  data: extractSemanticFeatures(textContent)
});

  
  // Check for sensitive keywords (crisis detection)
  for (const keyword of SENSITIVE_KEYWORDS) {
    if (textContent.toLowerCase().includes(keyword.toLowerCase())) {
      chrome.runtime.sendMessage({
        type: 'SENSITIVE_TEXT_DETECTED',
        data: { keyword }
      });
      break; // Only trigger once per page
    }
  }
  
  // Check for toxic patterns
  const toxicPatterns = TOXIC_PATTERNS.filter(pattern => pattern.test(textContent));
  if (toxicPatterns.length > 0) {
    chrome.runtime.sendMessage({
      type: 'TOXIC_CONTENT_FOUND',
      data: {
        type: 'text',
        patterns: toxicPatterns.length,
        url: window.location.href
      }
    });
  }
  
  // Analyze article headlines and titles
  analyzeHeadlines();
}

function analyzeHeadlines() {
  const headlines = document.querySelectorAll('h1, h2, h3, .headline, .title, article header');
  let negativeCount = 0;
  
  const negativeWords = ['crisis', 'disaster', 'terror', 'fear', 'death', 'war', 'attack', 'crash'];
  
  headlines.forEach(el => {
    const text = el.innerText.toLowerCase();
    if (negativeWords.some(word => text.includes(word))) {
      negativeCount++;
    }
  });
  
  if (negativeCount >= 3) {
    chrome.runtime.sendMessage({
      type: 'TOXIC_CONTENT_FOUND',
      data: {
        type: 'negative_headlines',
        count: negativeCount,
        url: window.location.href
      }
    });
  }
}

function observeContentChanges() {
  const observer = new MutationObserver((mutations) => {
    // Check new content for sensitive keywords
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent) {
          checkTextForSensitiveContent(node.textContent);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          checkTextForSensitiveContent(node.innerText);
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function checkTextForSensitiveContent(text) {
  if (!text) return;
  
  for (const keyword of SENSITIVE_KEYWORDS) {
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      chrome.runtime.sendMessage({
        type: 'SENSITIVE_TEXT_DETECTED',
        data: { keyword }
      });
      break;
    }
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SHOW_DOOMSCROLL_INTERVENTION') {
    showDoomscrollOverlay(message.data);
  } else if (message.type === 'SHOW_CRISIS_INTERVENTION') {
    showCrisisOverlay(message.data);
  } else if (message.type === 'ENABLE_GREYSCALE') {
    enableGreyscale();
  } else if (message.type === 'DISABLE_GREYSCALE') {
    disableGreyscale();
  } else if (message.type === 'SHOW_MINI_GAME') {
    showMiniGame();
  }
});

function showDoomscrollOverlay(data) {
  // Remove existing overlay
  const existing = document.getElementById('mindease-overlay');
  if (existing) existing.remove();
  
  const overlay = document.createElement('div');
  overlay.id = 'mindease-overlay';
  overlay.className = 'mindease-intervention';
  overlay.innerHTML = `
    <div class="mindease-modal">
      <div class="mindease-header">
        <span class="mindease-icon">🧘</span>
        <h2>Time for a Mindful Break?</h2>
      </div>
      <p class="mindease-message">${data.message}</p>
      <div class="mindease-suggestions">
        <h3>Try this instead:</h3>
        <ul>
          ${data.suggestions.map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>
      <div class="mindease-actions">
        <button class="mindease-btn mindease-btn-primary" id="mindease-game">Play Mind Game</button>
        <button class="mindease-btn mindease-btn-secondary" id="mindease-dashboard">Open Dashboard</button>
        <button class="mindease-btn mindease-btn-text" id="mindease-close">Continue Browsing</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Event listeners
  document.getElementById('mindease-game').addEventListener('click', () => {
    overlay.remove();
    chrome.runtime.sendMessage({ type: 'SHOW_GAME' });
    showMiniGame();
  });
  
  document.getElementById('mindease-dashboard').addEventListener('click', () => {
    window.open('http://localhost:3000/dashboard', '_blank');
    overlay.remove();
  });
  
  document.getElementById('mindease-close').addEventListener('click', () => {
    overlay.remove();
  });
}

function showCrisisOverlay(data) {
  const existing = document.getElementById('mindease-overlay');
  if (existing) existing.remove();
  
  const overlay = document.createElement('div');
  overlay.id = 'mindease-overlay';
  overlay.className = 'mindease-intervention mindease-crisis';
  overlay.innerHTML = `
    <div class="mindease-modal">
      <div class="mindease-header mindease-crisis-header">
        <span class="mindease-icon">💚</span>
        <h2>You're Not Alone</h2>
      </div>
      <p class="mindease-message">
        We detected content that suggests you might be going through a difficult time. 
        Please know that help is available and people care about you.
      </p>
      <div class="mindease-resources">
        <h3>Crisis Resources (Available 24/7):</h3>
        <div class="mindease-resource-list">
          ${data.resources.map(r => `
            <div class="mindease-resource">
              <strong>${r.name}</strong>
              ${r.contact ? `<span class="mindease-contact">${r.contact}</span>` : ''}
              ${r.url ? `<a href="${r.url}" target="_blank">Visit Website</a>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      <div class="mindease-actions">
        <button class="mindease-btn mindease-btn-primary" id="mindease-wellness">Talk to Wellness Bot</button>
        <button class="mindease-btn mindease-btn-text" id="mindease-crisis-close">Close</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  document.getElementById('mindease-wellness').addEventListener('click', () => {
    window.open('http://localhost:3000/wellness', '_blank');
    overlay.remove();
  });
  
  document.getElementById('mindease-crisis-close').addEventListener('click', () => {
    overlay.remove();
  });
}

function enableGreyscale() {
  if (greyscaleEnabled) return;
  greyscaleEnabled = true;
  
  const style = document.createElement('style');
  style.id = 'mindease-greyscale';
  style.textContent = `
    html {
      filter: grayscale(100%) !important;
      -webkit-filter: grayscale(100%) !important;
    }
  `;
  document.head.appendChild(style);
  
  // Show notification
  showGreyscaleNotification();
}

function disableGreyscale() {
  greyscaleEnabled = false;
  const style = document.getElementById('mindease-greyscale');
  if (style) style.remove();
}

function showGreyscaleNotification() {
  const notification = document.createElement('div');
  notification.className = 'mindease-toast';
  notification.innerHTML = `
    <span class="mindease-toast-icon">⏰</span>
    <span>Screen time limit reached. Greyscale mode enabled.</span>
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.remove(), 5000);
}

function showMiniGame() {
  const existing = document.getElementById('mindease-game-overlay');
  if (existing) existing.remove();
  
  const overlay = document.createElement('div');
  overlay.id = 'mindease-game-overlay';
  overlay.className = 'mindease-intervention';
  overlay.innerHTML = `
    <div class="mindease-modal mindease-game-modal">
      <div class="mindease-header">
        <h2>Memory Match Game</h2>
        <button class="mindease-close-btn" id="mindease-game-close">✕</button>
      </div>
      <p class="mindease-game-instruction">Match the pairs to clear your mind!</p>
      <div class="mindease-game-board" id="mindease-game-board"></div>
      <div class="mindease-game-stats">
        <span>Moves: <strong id="mindease-moves">0</strong></span>
        <span>Matches: <strong id="mindease-matches">0/8</strong></span>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  document.getElementById('mindease-game-close').addEventListener('click', () => {
    overlay.remove();
  });
  
  initMemoryGame();
}

function initMemoryGame() {
  const emojis = ['🌸', '🌺', '🌻', '🌼', '🌷', '🌹', '🏵️', '💐'];
  const cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
  
  const board = document.getElementById('mindease-game-board');
  let flippedCards = [];
  let matchedPairs = 0;
  let moves = 0;
  
  cards.forEach((emoji, index) => {
    const card = document.createElement('div');
    card.className = 'mindease-card';
    card.dataset.emoji = emoji;
    card.dataset.index = index;
    card.innerHTML = `
      <div class="mindease-card-inner">
        <div class="mindease-card-front">?</div>
        <div class="mindease-card-back">${emoji}</div>
      </div>
    `;
    
    card.addEventListener('click', () => handleCardClick(card));
    board.appendChild(card);
  });
  
  function handleCardClick(card) {
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    if (flippedCards.length >= 2) return;
    
    card.classList.add('flipped');
    flippedCards.push(card);
    
    if (flippedCards.length === 2) {
      moves++;
      document.getElementById('mindease-moves').textContent = moves;
      
      const [card1, card2] = flippedCards;
      if (card1.dataset.emoji === card2.dataset.emoji) {
        // Match!
        setTimeout(() => {
          card1.classList.add('matched');
          card2.classList.add('matched');
          flippedCards = [];
          matchedPairs++;
          document.getElementById('mindease-matches').textContent = `${matchedPairs}/8`;
          
          if (matchedPairs === 8) {
            setTimeout(() => {
              alert(`Congratulations! You completed the game in ${moves} moves! 🎉`);
            }, 500);
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          card1.classList.remove('flipped');
          card2.classList.remove('flipped');
          flippedCards = [];
        }, 1000);
      }
    }
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
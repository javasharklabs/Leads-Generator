let consoleBox = document.getElementById('console');
let logText = document.getElementById('log-text');
let loaderBar = document.getElementById('loader-bar');
let statusText = document.getElementById('status-text');

// Fake Animation Logs only for animation purpose 
const fakeLogs = [
  "Initializing JavaShark DOM Parser...",
  "Bypassing standard rate limits...",
  "Extracting hidden node elements...",
  "Formatting phone numbers...",
  "Extracting Hidden Website URLs...",
  "Generating WhatsApp API links...",
  "Removing duplicate entries...",
  "Compiling Ultra CSV payload..."
];

function runAnimationAndScrape(platform) {
  let fileName = document.getElementById('filename').value.trim();
  consoleBox.style.display = "block";
  statusText.style.display = "none";
  loaderBar.style.width = "0%";

  let progress = 0;
  let logIndex = 0;

  // The Fake Processing Animation
  let interval = setInterval(() => {
    progress += Math.floor(Math.random() * 15) + 5;
    if (progress > 100) progress = 100;

    loaderBar.style.width = progress + "%";

    if (progress % 20 === 0 || progress > 80) {
      logText.innerText = fakeLogs[logIndex] || "Finalizing...";
      logIndex++;
    }

    if (progress === 100) {
      clearInterval(interval);
      logText.innerText = "Execution Complete!";
      executeScraping(platform, fileName);
    }
  }, 300);
}

document.getElementById('mapsBtn').addEventListener('click', () => runAnimationAndScrape('maps'));
document.getElementById('jdBtn').addEventListener('click', () => runAnimationAndScrape('jd'));

function executeScraping(platform, fileName) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: scraperCore,
      args: [platform, fileName]
    }, (results) => {
      if (results && results[0] && results[0].result) {
        statusText.innerText = `✅ Successfully Extracted ${results[0].result} Leads!`;
        statusText.style.display = "block";
      }
    });
  });
}

// -----------------------------------------------------
// CORE SCRAPER ENGINE (ULTRA UPDATE - URL EXTRACTION)
// -----------------------------------------------------
function scraperCore(platform, fileName) {
  let leads = [];
  let items = [];

  // 🔥 NEW FEATURE: AUTO-DETECT SEARCH QUERY FOR CSV NAME 🔥
  let searchQuery = "";
  try {
    if (platform === 'maps') {
      let searchInput = document.querySelector('input#searchboxinput') || document.querySelector('#searchboxinput');
      if (searchInput && searchInput.value) {
        searchQuery = searchInput.value;
      } else {
        searchQuery = document.title.replace('- Google Maps', '').trim();
      }
    } else if (platform === 'jd') {
      let searchInput = document.querySelector('input#main-auto') || document.querySelector('input.search_input') || document.querySelector('input[type="text"]');
      if (searchInput && searchInput.value) {
        searchQuery = searchInput.value;
      } else {
        searchQuery = document.title.split('-')[0].trim();
      }
    }
  } catch (e) { }
  searchQuery = searchQuery ? searchQuery.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_') : "";
  let finalFileName = fileName || searchQuery || "JavaShark_Leads";

  if (platform === 'maps') {
    items = document.querySelectorAll('a[href*="/maps/place/"]');
  } else if (platform === 'jd') {
    items = document.querySelectorAll('li[class*="result-box"], div[class*="resultbox"]');
  }

  items.forEach(item => {
    try {
      let parentElement = platform === 'maps' ? (item.closest('.Nv2PK') || item.closest('[role="article"]') || item.parentElement.parentElement) : item;
      if (!parentElement) parentElement = item;

      let rawText = parentElement.innerText;
      if (!rawText) return;

      let name = platform === 'maps' ? (item.getAttribute('aria-label') || rawText.split('\n')[0]) : rawText.split('\n')[0];
      if (!name || name.trim() === "") return;

      let ratingMatch = rawText.match(/(\d\.\d)\s*\(/) || rawText.match(/(\d\.\d)/);
      let rating = ratingMatch ? ratingMatch[1] : "N/A";

      let reviewCountMatch = rawText.match(/\(([\d,]+)\)/);
      let reviews = reviewCountMatch ? reviewCountMatch[1] : "N/A";

      // Improved Phone Regex for International Numbers
      let phoneMatch = rawText.match(/(?:(?:\+|00)\d{1,3}[\s-]?)?(?:\(?\d{1,5}\)?[\s-]?)?\d{3,5}[\s-]?\d{3,5}(?:[\s-]?\d{1,4})?/);
      let phone = phoneMatch ? phoneMatch[0].trim() : "N/A";
      let cleanPhone = phone.replace(/[^\d+]/g, '');

      let waLink = "No Number";
      if (cleanPhone !== "N/A" && cleanPhone.replace(/\D/g, '').length >= 7) {
        let waNumber = cleanPhone.startsWith('+') ? cleanPhone.substring(1) : cleanPhone;
        // Fix for Indian numbers without country code
        if (waNumber.length === 10 && !waNumber.startsWith('91')) {
            waNumber = '91' + waNumber;
        }
        waLink = `https://wa.me/${waNumber}`;
      } else {
        phone = "N/A";
      }

      let hasWebsite = rawText.toLowerCase().includes('website') ? "Yes" : "No";

      // 🔥 NEW FEATURE: EXTRACT ACTUAL WEBSITE URL 🔥
      let websiteUrl = "No Website";
      let allLinks = parentElement.querySelectorAll('a');
      for (let a of allLinks) {
        let href = a.href;
        if (href && href.startsWith('http') && !href.includes('google.com/maps') && !href.includes('google.com/search')) {
          if (href.includes('google.com/url?q=')) {
            try { websiteUrl = decodeURIComponent(href.split('google.com/url?q=')[1].split('&')[0]); } catch (e) { websiteUrl = href; }
          } else {
            websiteUrl = href;
          }
          break;
        }
      }

      if (hasWebsite === "Yes" && websiteUrl === "No Website") {
        websiteUrl = "Link Hidden by Platform";
      }

      // 🔥 NEW FEATURE: Business Category Extraction 🔥
      let categoryMatch = rawText.match(/\n([^0-9\n]+?)\s*·/);
      let category = categoryMatch ? categoryMatch[1].trim() : "Unknown";

      // 🔥 UNIQUE FEATURE: Profile Link & AI Follow-Up Draft & Directions 🔥
      let profileLink = item.href || "N/A";
      let directionLink = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(name);
      let followUpDraft = `Hi ${name}, I noticed your profile and wanted to connect!`;

      let context = rawText.replace(/\n/g, ' | ').replace(/"/g, '""');

      // Push ONLY leads with valid phone numbers
      if (phone !== "N/A") {
        leads.push({ name, category, rating, reviews, phone, waLink, hasWebsite, websiteUrl, profileLink, directionLink, followUpDraft, context });
      }
    } catch (error) { }
  });

  let uniqueLeads = Array.from(new Set(leads.map(a => a.name))).map(name => leads.find(a => a.name === name));

  if (uniqueLeads.length === 0) {
    alert("No leads found! Please scroll down the page to load more results.");
    return 0;
  }

  // Generate Ultra CSV with new Website URL column and Unique Features
  let csvContent = "\uFEFFBusiness Name,Category,Rating,Reviews,Phone Number,WhatsApp Direct Link,Has Website,Website URL,Profile Link,Maps Direction Link,AI Follow-Up Draft,Raw Context Data\n";
  uniqueLeads.forEach(lead => {
    csvContent += `"${lead.name}","${lead.category}","${lead.rating}","${lead.reviews}","${lead.phone}","${lead.waLink}","${lead.hasWebsite}","${lead.websiteUrl}","${lead.profileLink}","${lead.directionLink}","${lead.followUpDraft}","${lead.context}"\n`;
  });

  // Download logic
  let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  let link = document.createElement("a");
  link.setAttribute("href", URL.createObjectURL(blob));
  link.setAttribute("download", `${finalFileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return uniqueLeads.length;
}

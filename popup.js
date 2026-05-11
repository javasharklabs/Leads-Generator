let consoleBox = document.getElementById('console');
let logText = document.getElementById('log-text');
let loaderBar = document.getElementById('loader-bar');
let statusText = document.getElementById('status-text');

// Fake Animation Logs
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
  let fileName = document.getElementById('filename').value || "JavaShark_Leads";
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
        if(results && results[0] && results[0].result) {
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

  if (platform === 'maps') {
    items = document.querySelectorAll('a[href*="/maps/place/"]');
  } else if (platform === 'jd') {
    items = document.querySelectorAll('li[class*="result-box"], div[class*="resultbox"]');
  }

  items.forEach(item => {
    try {
      let parentElement = platform === 'maps' ? item.parentElement.parentElement : item;
      let rawText = parentElement.innerText;
      if (!rawText) return;

      let name = platform === 'maps' ? (item.getAttribute('aria-label') || "Unknown") : rawText.split('\n')[0];
      
      let ratingMatch = rawText.match(/(\d\.\d)/);
      let rating = ratingMatch ? ratingMatch[1] : "N/A";
      
      let phoneMatch = rawText.match(/(?:\+91|0)?[ -]?\d{4,5}[ -]?\d{5,6}/);
      let phone = phoneMatch ? phoneMatch[0].replace(/[^0-9]/g, '') : "";

      let waLink = phone.length >= 10 ? `https://wa.me/91${phone.slice(-10)}` : "No Number";
      let hasWebsite = rawText.toLowerCase().includes('website') ? "Yes" : "No";
      
      // 🔥 NEW FEATURE: EXTRACT ACTUAL WEBSITE URL 🔥
      let websiteUrl = "No Website";
      
      // Look for all links inside this specific business card
      let allLinks = parentElement.querySelectorAll('a');
      for (let a of allLinks) {
          let href = a.href;
          // Conditions to find the real website link:
          // 1. Must be a valid link
          // 2. Not a Google Maps internal link
          // 3. Not a Google Search link
          if (href && href.startsWith('http') && !href.includes('google.com/maps') && !href.includes('google.com/search')) {
              // Decoder: Sometimes Google wraps URLs in a tracking link
              if (href.includes('google.com/url?q=')) {
                  try {
                      websiteUrl = decodeURIComponent(href.split('google.com/url?q=')[1].split('&')[0]);
                  } catch(e) {
                      websiteUrl = href;
                  }
              } else {
                  websiteUrl = href;
              }
              break; // Stop loop once the website is found
          }
      }

      // Fallback logic
      if (hasWebsite === "Yes" && websiteUrl === "No Website") {
          websiteUrl = "Link Hidden by Platform";
      }

      let context = rawText.replace(/\n/g, ' | ').replace(/"/g, '""'); 

      if(phone.length >= 10) {
        leads.push({ name, rating, phone, waLink, hasWebsite, websiteUrl, context });
      }
    } catch (error) {}
  });

  let uniqueLeads = Array.from(new Set(leads.map(a => a.name))).map(name => leads.find(a => a.name === name));

  if (uniqueLeads.length === 0) {
    alert("No leads with valid phone numbers found! Please scroll down the page to load more results.");
    return 0;
  }

  // Generate Ultra CSV with new Website URL column
  let csvContent = "\uFEFFBusiness Name,Rating,Phone Number,WhatsApp Direct Link,Has Website,Website URL,Raw Context Data\n";
  uniqueLeads.forEach(lead => {
    csvContent += `"${lead.name}","${lead.rating}","${lead.phone}","${lead.waLink}","${lead.hasWebsite}","${lead.websiteUrl}","${lead.context}"\n`;
  });

  // Download logic
  let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  let link = document.createElement("a");
  link.setAttribute("href", URL.createObjectURL(blob));
  link.setAttribute("download", `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return uniqueLeads.length; 
}
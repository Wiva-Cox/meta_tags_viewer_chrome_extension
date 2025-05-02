// Функция для получения тега title
function getTitle() {
  return document.title;
}

// Функция для получения мета-тега description
function getMetaDescription() {
  const metaTag = document.querySelector("meta[name='description']");
  return metaTag ? metaTag.getAttribute("content") : "🚫 No description available";
}

// Функция для получения тега h1
function getH1Tag() {
  const h1Tag = document.querySelector("h1");
  return h1Tag ? h1Tag.textContent : "🚫 No H1 tag found";
}

// Функция для получения всех мета-тегов с атрибутами 'property' или 'name',
// которые заканчиваются на 'title' или 'description'
function getMetaProperties() {
  const metaTags = document.querySelectorAll("meta[name], meta[property]");  // Ищем оба атрибута: 'name' и 'property'
  const titleMeta = [];
  const descriptionMeta = [];

  // Проходим по всем мета-тегам с атрибутом 'name' или 'property' и добавляем их в массив
  metaTags.forEach(tag => {
    const property = tag.getAttribute("property") || tag.getAttribute("name");
    const content = tag.getAttribute("content");

    // Проверка, если 'property' или 'name' заканчивается на 'title' или 'description'
    if (property && content) {
      if (property.endsWith("title")) {
        titleMeta.push({ property, content });
      } else if (property.endsWith("description")) {
        descriptionMeta.push({ property, content });
      }
    }
  });

  // Объединяем результаты: сначала titleMeta, затем descriptionMeta
  return titleMeta.concat(descriptionMeta);
}

// Даем информацию в popup
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  const tab = tabs[0];
  
  // Выполняем скрипт в контексте вкладки для получения данных
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: getTitle
  }, (results) => {
    const title = results[0].result;
    const titleElement = document.getElementById('page-title');
    titleElement.textContent = title || "🚫 No title available";
    titleElement.innerHTML += ` <span class="char-count">(${title ? title.length : 0} chars)</span>`;
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: getMetaDescription
  }, (results) => {
    const description = results[0].result;
    const descElement = document.getElementById('meta-description');
    descElement.textContent = description || "🚫 No description available";
    descElement.innerHTML += ` <span class="char-count">(${description ? description.length : 0} chars)</span>`;
  });
    
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: getH1Tag
  }, (results) => {
    const h1 = results[0].result;
    const h1Element = document.getElementById('page-h1');
    h1Element.textContent = h1 || "🚫 No h1 tag available";
    h1Element.innerHTML += ` <span class="char-count">(${h1 ? h1.length : 0} chars)</span>`;
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: getMetaProperties
  }, (results) => {
    const metaProperties = results[0].result;
    const propertiesTable = document.getElementById('meta-properties');

    // Для каждого найденного мета-тега добавляем строку в таблицу
    metaProperties.forEach(meta => {
      const row = propertiesTable.insertRow();
      const propertyCell = row.insertCell(0);
      const contentCell = row.insertCell(1);
      propertyCell.textContent = meta.property;
      contentCell.innerHTML = `${meta.content} <span class="char-count">(${meta.content.length} chars)</span>`;
    });
  });
});

// Function to handle small text elements
function handleSmallText() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];
    
    // Send message to content script to find small text
    chrome.tabs.sendMessage(tab.id, { action: 'findSmallText' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error finding small text:', chrome.runtime.lastError);
        return;
      }
      
      if (response) {
        console.log('Received small text elements:', response.elements.length);
        const smallTextTable = document.getElementById('small-text-table').getElementsByTagName('tbody')[0];
        smallTextTable.innerHTML = ''; // Clear existing rows
        
        // Update the header with the min font size value
        document.getElementById('min-font-size').textContent = response.minFontSize;
        
        response.elements.forEach((item, index) => {
          const row = smallTextTable.insertRow();
          
          // Text cell
          const textCell = row.insertCell(0);
          textCell.textContent = item.text;
          if (item.isHidden) {
            textCell.innerHTML += ' <span class="hidden-badge">(hidden)</span>';
          }
          // Make text clickable
          textCell.style.cursor = 'pointer';
          textCell.title = 'Click to scroll to element';
          textCell.addEventListener('click', () => {
            chrome.tabs.sendMessage(tab.id, { 
              action: 'scrollToElement',
              elementIndex: index
            });
          });
          
          // Font size cell
          const fontSizeCell = row.insertCell(1);
          fontSizeCell.textContent = `${item.fontSize}px`;
        });
      }
    });
  });
}

// Function to handle highlight all button
function handleHighlightAll() {
  const button = document.getElementById('highlight-all-button');
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];
    
    console.log('Sending toggleHighlightAll message');
    chrome.tabs.sendMessage(tab.id, { action: 'toggleHighlightAll' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error toggling highlight:', chrome.runtime.lastError);
        return;
      }
      
      if (response) {
        console.log('Received highlight response:', response);
        updateHighlightButtonState(response.isHighlighted);
        // Save state to localStorage
        localStorage.setItem('highlightState', response.isHighlighted);
      }
    });
  });
}

// Function to update highlight button state
function updateHighlightButtonState(isHighlighted) {
  const button = document.getElementById('highlight-all-button');
  if (isHighlighted) {
    button.textContent = 'Remove Highlight';
    button.classList.add('highlight-active');
  } else {
    button.textContent = 'Highlight All';
    button.classList.remove('highlight-active');
  }
}

// Function to handle tab switching
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Function to switch tabs
    function switchTab(tabId) {
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });

        // Add active class to selected button and corresponding content
        const selectedButton = document.querySelector(`[data-tab="${tabId}"]`);
        const activeContent = document.getElementById(tabId);
        
        if (selectedButton && activeContent) {
            selectedButton.classList.add('active');
            activeContent.classList.add('active');
            activeContent.style.display = 'block';
            
            // Save selected tab to localStorage
            localStorage.setItem('selectedTab', tabId);
        }
    }

    // Add click handlers to tab buttons
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Restore last selected tab or default to first tab
    const lastSelectedTab = localStorage.getItem('selectedTab');
    if (lastSelectedTab) {
        switchTab(lastSelectedTab);
    } else {
        const firstTab = document.querySelector('.tab-button');
        if (firstTab) {
            firstTab.click();
        }
    }
}

// Function to handle analytics data
function handleAnalytics() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];
    
    chrome.tabs.sendMessage(tab.id, { action: 'findAnalytics' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error finding analytics:', chrome.runtime.lastError);
        return;
      }
      
      if (response) {
        // Update Google Analytics
        const gaId = document.getElementById('ga-id');
        const gaStatus = document.getElementById('ga-status');
        gaId.textContent = response.ga.id || 'Not found';
        gaStatus.textContent = response.ga.status;
        gaStatus.className = response.ga.status === 'Found' ? 'status-found' : 'status-not-found';

        // Update Google Tag Manager
        const gtmId = document.getElementById('gtm-id');
        const gtmStatus = document.getElementById('gtm-status');
        gtmId.textContent = response.gtm.id || 'Not found';
        gtmStatus.textContent = response.gtm.status;
        gtmStatus.className = response.gtm.status === 'Found' ? 'status-found' : 'status-not-found';

        // Update Yandex Metrika
        const ymId = document.getElementById('ym-id');
        const ymStatus = document.getElementById('ym-status');
        ymId.textContent = response.ym.id || 'Not found';
        ymStatus.textContent = response.ym.status;
        ymStatus.className = response.ym.status === 'Found' ? 'status-found' : 'status-not-found';

        // Update Facebook Pixel
        const fbId = document.getElementById('fb-id');
        const fbStatus = document.getElementById('fb-status');
        fbId.textContent = response.fb.id || 'Not found';
        fbStatus.textContent = response.fb.status;
        fbStatus.className = response.fb.status === 'Found' ? 'status-found' : 'status-not-found';
      }
    });
  });
}

// Add event listeners when popup opens
document.addEventListener('DOMContentLoaded', () => {
    console.log('Popup loaded, initializing...');
    initializeTabs();
    handleSmallText();
    handleAnalytics();
    
    // Restore highlight button state
    const savedHighlightState = localStorage.getItem('highlightState') === 'true';
    updateHighlightButtonState(savedHighlightState);
    
    const highlightButton = document.getElementById('highlight-all-button');
    if (highlightButton) {
        highlightButton.addEventListener('click', handleHighlightAll);
        console.log('Highlight button event listener added');
    } else {
        console.error('Highlight button not found');
    }
});

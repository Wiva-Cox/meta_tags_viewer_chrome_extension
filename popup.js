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
        
        response.elements.forEach((item) => {
          const row = smallTextTable.insertRow();
          
          // Text cell
          const textCell = row.insertCell(0);
          textCell.textContent = item.text;
          
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
        button.textContent = response.isHighlighted ? 'Remove Highlight' : 'Highlight All';
      }
    });
  });
}

// Add event listeners when popup opens
document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup loaded, initializing...');
  handleSmallText();
  const highlightButton = document.getElementById('highlight-all-button');
  if (highlightButton) {
    highlightButton.addEventListener('click', handleHighlightAll);
    console.log('Highlight button event listener added');
  } else {
    console.error('Highlight button not found');
  }
});

// Функция для получения тега title
function getTitle() {
  return document.title;
}

// Функция для получения мета-тега description
function getMetaDescription() {
  const metaTag = document.querySelector("meta[name='description']");
  return metaTag ? metaTag.getAttribute("content") : "No description available";
}

// Функция для получения тега h1
function getH1Tag() {
  const h1Tag = document.querySelector("h1");
  return h1Tag ? h1Tag.textContent : "No H1 tag found";
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
    document.getElementById('page-title').textContent = title || "No title available";
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: getMetaDescription
  }, (results) => {
    const description = results[0].result;
    document.getElementById('meta-description').textContent = description || "No description available";
  });
    
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: getH1Tag
  }, (results) => {
    const h1 = results[0].result;
    document.getElementById('page-h1').textContent = h1 || "No h1 tag available";
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
      contentCell.textContent = meta.content;
    });
  });
});

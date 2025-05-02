// Константа для минимального размера шрифта
const MIN_FONT_SIZE = 12;

// Store found elements globally
let foundElements = [];

// Function to find text elements with font size less than 12px
function findSmallText() {
    const smallTextElements = [];
    const processedElements = new Set(); // To avoid duplicates
    
    // Function to process an element
    function processElement(element) {
        if (processedElements.has(element)) return;
        processedElements.add(element);

        const style = window.getComputedStyle(element);
        const fontSize = parseFloat(style.fontSize);
        const text = element.textContent.trim();
        
        // Skip if no text content or if element is a script/style
        if (!text || element.tagName === 'SCRIPT' || element.tagName === 'STYLE') return;
        
        // Check if element is hidden
        const isHidden = style.display === 'none' || 
                        style.visibility === 'hidden' || 
                        style.opacity === '0' ||
                        element.offsetParent === null;
        
        if (fontSize < MIN_FONT_SIZE && text) {
            smallTextElements.push({
                text: text,
                fontSize: fontSize,
                element: element,
                isHidden: isHidden
            });
        }
    }

    // Function to process all elements in a document
    function processDocument(doc) {
        const elements = doc.querySelectorAll('*');
        elements.forEach(processElement);

        // Process iframes
        const iframes = doc.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            try {
                if (iframe.contentDocument) {
                    processDocument(iframe.contentDocument);
                }
            } catch (e) {
                console.log('Cannot access iframe content:', e);
            }
        });
    }

    // Process main document
    processDocument(document);

    // Sort elements by font size
    smallTextElements.sort((a, b) => a.fontSize - b.fontSize);

    // Store found elements globally
    foundElements = smallTextElements;

    return smallTextElements;
}

// Function to scroll to element
function scrollToElement(index) {
    if (foundElements[index]) {
        const element = foundElements[index].element;
        
        // Highlight element temporarily
        const originalBackground = element.style.backgroundColor;
        const originalBorder = element.style.border;
        
        element.style.backgroundColor = 'yellow';
        element.style.border = '2px solid red';
        
        // Scroll to element
        element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center'
        });
        
        // Remove highlight after 2 seconds
        setTimeout(() => {
            element.style.backgroundColor = originalBackground;
            element.style.border = originalBorder;
        }, 2000);
    }
}

// Function to toggle highlight for all small text elements
function toggleHighlightAll() {
    console.log('toggleHighlightAll called');
    let isHighlighted = false;
    
    // Function to process document
    function processDocument(doc) {
        const elements = doc.querySelectorAll('*');
        
        // Check if any element is currently highlighted
        elements.forEach(element => {
            if (element.style.backgroundColor === 'yellow') {
                isHighlighted = true;
            }
        });
        
        // Toggle highlight state
        elements.forEach(element => {
            const style = window.getComputedStyle(element);
            const fontSize = parseFloat(style.fontSize);
            
            if (fontSize < MIN_FONT_SIZE && element.textContent.trim()) {
                if (isHighlighted) {
                    element.style.backgroundColor = '';
                    element.style.border = '';
                } else {
                    element.style.backgroundColor = 'yellow';
                    element.style.border = '2px solid red';
                }
            }
        });

        // Process iframes
        const iframes = doc.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            try {
                if (iframe.contentDocument) {
                    processDocument(iframe.contentDocument);
                }
            } catch (e) {
                console.log('Cannot access iframe content:', e);
            }
        });
    }

    // Process main document
    processDocument(document);
    
    return !isHighlighted; // Return new state
}

// Check initial highlight state when content script loads
function checkInitialHighlightState() {
    const elements = document.querySelectorAll('*');
    let isHighlighted = false;
    
    elements.forEach(element => {
        if (element.style.backgroundColor === 'yellow') {
            isHighlighted = true;
        }
    });
    
    // Send initial state to popup
    chrome.runtime.sendMessage({ 
        action: 'updateHighlightState',
        isHighlighted: isHighlighted
    });
}

// Function to find analytics tracking IDs
function findAnalyticsIds() {
    const analyticsData = {
        ga: { id: null, status: 'Not Found' },
        gtm: { id: null, status: 'Not Found' },
        ym: { id: null, status: 'Not Found' },
        fb: { id: null, status: 'Not Found' }
    };

    // Function to search in content
    function searchInContent(content) {
        if (!content) return;

        // Google Analytics
        const uaMatch = content.match(/UA-\d+-\d+/);
        if (uaMatch) {
            analyticsData.ga.id = uaMatch[0];
            analyticsData.ga.status = 'Found';
        }
        const gMatch = content.match(/G-[A-Z0-9]{10}/);
        if (gMatch) {
            analyticsData.ga.id = gMatch[0];
            analyticsData.ga.status = 'Found';
        }

        // Google Tag Manager
        const gtmMatch = content.match(/GTM-[A-Z0-9]{8}/);
        if (gtmMatch) {
            analyticsData.gtm.id = gtmMatch[0];
            analyticsData.gtm.status = 'Found';
        }

        // Yandex Metrika
        const ymMatch = content.match(/yaCounter(\d+)/);
        if (ymMatch) {
            analyticsData.ym.id = ymMatch[1];
            analyticsData.ym.status = 'Found';
        }
        const ymInitMatch = content.match(/ym\((\d+),\s*['"]init['"]\)/);
        if (ymInitMatch) {
            analyticsData.ym.id = ymInitMatch[1];
            analyticsData.ym.status = 'Found';
        }
        const ymModernMatch = content.match(/ym\((\d+),\s*["']init["']/);
        if (ymModernMatch) {
            analyticsData.ym.id = ymModernMatch[1];
            analyticsData.ym.status = 'Found';
        }

        // Facebook Pixel
        const fbMatch = content.match(/fbq\('init',\s*'(\d+)'\)/);
        if (fbMatch) {
            analyticsData.fb.id = fbMatch[1];
            analyticsData.fb.status = 'Found';
        }
    }

    // Function to search in all possible locations
    function searchAllLocations() {
        // Search in all scripts
        document.querySelectorAll('script').forEach(script => {
            // Search in script content
            if (script.textContent) {
                searchInContent(script.textContent);
            }
            // Search in script src
            if (script.src) {
                searchInContent(script.src);
            }
        });

        // Search in noscript tags (for GTM)
        document.querySelectorAll('noscript').forEach(noscript => {
            searchInContent(noscript.textContent);
        });

        // Search in iframes
        document.querySelectorAll('iframe').forEach(iframe => {
            try {
                if (iframe.contentDocument) {
                    iframe.contentDocument.querySelectorAll('script').forEach(script => {
                        if (script.textContent) {
                            searchInContent(script.textContent);
                        }
                        if (script.src) {
                            searchInContent(script.src);
                        }
                    });
                }
            } catch (e) {
                console.log('Cannot access iframe content:', e);
            }
        });

        // Search for Yandex Metrika in image src
        document.querySelectorAll('img[src*="mc.yandex.ru/watch/"]').forEach(img => {
            const src = img.getAttribute('src');
            const ymImageMatch = src.match(/mc\.yandex\.ru\/watch\/(\d+)/);
            if (ymImageMatch) {
                analyticsData.ym.id = ymImageMatch[1];
                analyticsData.ym.status = 'Found';
            }
        });

        // Search for GTM in dataLayer
        if (window.dataLayer) {
            const gtmMatch = window.dataLayer.toString().match(/GTM-[A-Z0-9]{8}/);
            if (gtmMatch) {
                analyticsData.gtm.id = gtmMatch[0];
                analyticsData.gtm.status = 'Found';
            }
        }

        // Search for GTM in window object
        if (window.google_tag_manager) {
            const gtmIds = Object.keys(window.google_tag_manager);
            if (gtmIds.length > 0) {
                const gtmMatch = gtmIds[0].match(/GTM-[A-Z0-9]{7}/);
                if (gtmMatch) {
                    analyticsData.gtm.id = gtmMatch[0];
                    analyticsData.gtm.status = 'Found';
                }
            }
        }
    }

    // Initial search
    searchAllLocations();

    // Set up MutationObserver to watch for dynamically added scripts
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeName === 'SCRIPT') {
                        if (node.textContent) {
                            searchInContent(node.textContent);
                        }
                        if (node.src) {
                            searchInContent(node.src);
                        }
                    }
                });
            }
        });
    });

    // Start observing
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    return analyticsData;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received:', request);
    
    if (request.action === 'findSmallText') {
        // Wait for a short time to allow dynamic content to load
        setTimeout(() => {
            const smallTextElements = findSmallText();
            console.log('Found small text elements:', smallTextElements.length);
            sendResponse({
                elements: smallTextElements,
                minFontSize: MIN_FONT_SIZE
            });
        }, 500); // Wait 500ms for dynamic content
        return true; // Keep the message channel open for async response
    } else if (request.action === 'toggleHighlightAll') {
        const newState = toggleHighlightAll();
        console.log('New highlight state:', newState);
        sendResponse({ isHighlighted: newState });
    } else if (request.action === 'scrollToElement') {
        scrollToElement(request.elementIndex);
        sendResponse({ success: true });
    } else if (request.action === 'findAnalytics') {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                // Wait additional time for scripts to load
                setTimeout(() => {
                    const analyticsData = findAnalyticsIds();
                    console.log('Found analytics data:', analyticsData);
                    sendResponse(analyticsData);
                }, 1000);
            });
        } else {
            // DOM already loaded, wait for scripts
            setTimeout(() => {
                const analyticsData = findAnalyticsIds();
                console.log('Found analytics data:', analyticsData);
                sendResponse(analyticsData);
            }, 1000);
        }
        return true; // Keep the message channel open for async response
    }
    
    return true; // Keep the message channel open for async response
});

// Check initial state when content script loads
checkInitialHighlightState();
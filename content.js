// Пустой файл, чтобы обеспечить возможность инъекции кода в страницы

// Константа для минимального размера шрифта
const MIN_FONT_SIZE = 12;

// Function to find text elements with font size less than 12px
function findSmallText() {
    const elements = document.querySelectorAll('*');
    const smallTextElements = [];
    
    elements.forEach(element => {
        const style = window.getComputedStyle(element);
        const fontSize = parseFloat(style.fontSize);
        
        if (fontSize < MIN_FONT_SIZE && element.textContent.trim()) {
            smallTextElements.push({
                text: element.textContent.trim(),
                fontSize: fontSize,
                element: element
            });
        }
    });
    
    return smallTextElements;
}

// Function to toggle highlight for all small text elements
function toggleHighlightAll() {
    console.log('toggleHighlightAll called');
    const elements = document.querySelectorAll('*');
    let isHighlighted = false;
    
    // Check if any element is currently highlighted
    elements.forEach(element => {
        if (element.style.backgroundColor === 'yellow') {
            isHighlighted = true;
        }
    });
    
    console.log('Current highlight state:', isHighlighted);
    
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
            console.log('Toggling element:', element.textContent.trim(), 'New background:', element.style.backgroundColor);
        }
    });
    
    return !isHighlighted; // Return new state
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received:', request);
    
    if (request.action === 'findSmallText') {
        const smallTextElements = findSmallText();
        console.log('Found small text elements:', smallTextElements.length);
        sendResponse({
            elements: smallTextElements,
            minFontSize: MIN_FONT_SIZE
        });
    } else if (request.action === 'toggleHighlightAll') {
        const newState = toggleHighlightAll();
        console.log('New highlight state:', newState);
        sendResponse({ isHighlighted: newState });
    }
    
    return true; // Keep the message channel open for async response
});
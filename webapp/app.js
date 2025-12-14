const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Init MainButton
tg.MainButton.textColor = "#FFFFFF";
tg.MainButton.color = "#2cab37";

// Tarot Deck (78 cards)
const totalCards = 78;
const maxSelection = 3;
let selectedIndices = [];
let deck = [];

// DOM Elements
const grid = document.getElementById('card-grid');
const statusText = document.getElementById('status');

// Initialize Deck (0 to 77)
for (let i = 0; i < totalCards; i++) {
    deck.push(i);
}

// Fisher-Yates Shuffle (Standard Random)
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Human Riffle Shuffle Simulation
function humanShuffle(array) {
    // 1. Cut the deck roughly in half
    const cutPoint = Math.floor(array.length / 2) + Math.floor(Math.random() * 10 - 5);
    const leftHalf = array.slice(0, cutPoint);
    const rightHalf = array.slice(cutPoint);

    // 2. Riffle them together (interleave)
    let shuffled = [];
    while (leftHalf.length > 0 || rightHalf.length > 0) {
        // Randomly take a chunk (1-3 cards) from left or right
        const takeLeft = Math.random() > 0.5;
        const chunkSize = Math.floor(Math.random() * 3) + 1;

        if (takeLeft && leftHalf.length > 0) {
            shuffled.push(...leftHalf.splice(0, chunkSize));
        } else if (!takeLeft && rightHalf.length > 0) {
            shuffled.push(...rightHalf.splice(0, chunkSize));
        } else {
            // If one pile is empty, take from the other
            if (leftHalf.length > 0) shuffled.push(...leftHalf.splice(0, chunkSize));
            if (rightHalf.length > 0) shuffled.push(...rightHalf.splice(0, chunkSize));
        }
    }
    return shuffled;
}

// Initial Shuffle
shuffle(deck);
// Apply Human Shuffle twice for realism
deck = humanShuffle(deck);
deck = humanShuffle(deck);


// Render Grid
if (grid) {
    deck.forEach((cardIndex, visualIndex) => {
        const cardContainer = document.createElement('div');
        cardContainer.className = 'card-container';
        cardContainer.dataset.index = visualIndex; // Visual position
        cardContainer.dataset.cardIndex = cardIndex; // Real card ID (0-77)

        const flipper = document.createElement('div');
        flipper.className = 'card';

        const front = document.createElement('div');
        front.className = 'card-face card-front';
        // Back image handled by CSS

        const back = document.createElement('div');
        back.className = 'card-face card-back';

        // Try to load image, fallback to number
        const img = document.createElement('img');
        img.src = `assets/cards/${cardIndex}.jpg`;
        img.onerror = () => { img.style.display = 'none'; back.innerText = `#${cardIndex}`; };
        back.appendChild(img);

        flipper.appendChild(front);
        flipper.appendChild(back);
        cardContainer.appendChild(flipper);

        // Click event on container
        cardContainer.addEventListener('click', () => handleCardClick(flipper));
        grid.appendChild(cardContainer);
    });
} else {
    console.error("Grid element not found!");
}

function handleCardClick(cardElement) {
    // Check if already flipped or max selection reached
    if (selectedIndices.length >= maxSelection || cardElement.classList.contains('flipped')) {
        return;
    }

    // Flip animation
    cardElement.classList.add('flipped');

    // Find the parent card-container to get the data-cardIndex
    const cardContainer = cardElement.closest('.card-container');
    const realIndex = parseInt(cardContainer.dataset.cardIndex);
    selectedIndices.push(realIndex);

    // Update UI
    if (selectedIndices.length < maxSelection) {
        if (statusText) statusText.innerText = `Выбрано: ${selectedIndices.length} / ${maxSelection}`;
        tg.HapticFeedback.impactOccurred('light');
    } else {
        if (statusText) statusText.innerText = "Готово! Нажмите кнопку внизу";
        tg.HapticFeedback.notificationOccurred('success');

        // Show MainButton
        tg.MainButton.setText(`Отправить (${selectedIndices.length})`);
        tg.MainButton.show();
    }
}

// Handle MainButton Click
tg.MainButton.onClick(() => {
    // 1. Construct indices string "10-22-77"
    const dataStr = selectedIndices.join('-');
    const botUsername = "df4dr4bot"; // Your bot username

    // 2. Open Deep Link
    // https://t.me/botname?start=tarot_10-22-77
    const url = `https://t.me/${botUsername}?start=tarot_${dataStr}`;

    tg.openTelegramLink(url);
    tg.close();
});
```

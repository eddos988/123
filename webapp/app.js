const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Настройка цветов под тему Telegram
document.body.style.backgroundColor = tg.backgroundColor || '#ffffff';

console.log('Telegram WebApp initialized:', tg.initData ? 'YES' : 'NO');

// --- SHUFFLE LOGIC ---
function riffleShuffle(deck) {
    let cutSize = Math.floor(27 + Math.random() * (43 - 27));
    if (deck.length < cutSize) cutSize = Math.floor(deck.length / 2);

    let rightHand = deck.slice(deck.length - cutSize);
    let leftHand = deck.slice(0, deck.length - cutSize);
    let shuffled = [];

    while (leftHand.length > 0 || rightHand.length > 0) {
        let lenLeft = leftHand.length;
        let lenRight = rightHand.length;
        let pRight = (lenLeft + lenRight) > 0 ? lenRight / (lenLeft + lenRight) : 0;

        if (Math.random() < pRight) {
            shuffled.push(rightHand.shift());
        } else {
            shuffled.push(leftHand.shift());
        }
    }

    return shuffled;
}

function humanShuffle(deckSize) {
    let deck = Array.from({ length: deckSize }, (_, i) => i);
    const iterations = 5 + Math.floor(Math.random() * 3);

    for (let i = 0; i < iterations; i++) {
        deck = riffleShuffle(deck);
    }
    return deck;
}

// --- APP LOGIC ---
let shuffledDeck = humanShuffle(78);
let selectedIndices = [];
let maxSelection = 3;

const grid = document.getElementById('card-grid');
const statusText = document.getElementById('status');

// Скрыть MainButton изначально
tg.MainButton.hide();

// Обработчик клика по MainButton - ВАЖНО: установить ДО первого использования
tg.MainButton.onClick(() => {
    console.log('MainButton clicked, sending:', selectedIndices);

    try {
        const dataToSend = JSON.stringify(selectedIndices);
        tg.sendData(dataToSend);
        console.log('Data sent successfully');
        // tg.close(); // Telegram usually closes automatically, but we can verify
    } catch (error) {
        console.error('Error sending data:', error);
        alert('Ошибка: ' + error.message);
    }
});

// Render Grid
if (grid) {
    shuffledDeck.forEach((cardIndex, visualIndex) => {
        const cardContainer = document.createElement('div');
        cardContainer.className = 'card-container';
        cardContainer.dataset.index = visualIndex;
        cardContainer.dataset.cardIndex = cardIndex; // Real card ID (0-77)

        const flipper = document.createElement('div');
        flipper.className = 'card';

        const faceFront = document.createElement('div');
        faceFront.className = 'card-face card-front';

        const faceBack = document.createElement('div');
        faceBack.className = 'card-face card-back';

        // Try to load image, fallback to number
        const img = document.createElement('img');
        img.src = `assets/cards/${cardIndex}.jpg`;
        img.onerror = () => {
            img.style.display = 'none';
            faceBack.innerText = `#${cardIndex}`;
        };
        faceBack.appendChild(img);

        flipper.appendChild(faceFront);
        flipper.appendChild(faceBack);
        cardContainer.appendChild(flipper);

        cardContainer.addEventListener('click', () => handleCardClick(flipper));
        grid.appendChild(cardContainer);
    });
} else {
    // Retry finding grid if script loaded in head? No, usually body bottom.
    console.error("Grid element not found!");
}

function handleCardClick(cardElement) {
    // Check if already flipped or max selection reached
    if (selectedIndices.length >= maxSelection || cardElement.classList.contains('flipped')) {
        return;
    }

    // Flip card
    cardElement.classList.add('flipped');

    // Find the parent card-container to get the data-cardIndex
    const cardContainer = cardElement.closest('.card-container');
    const realIndex = parseInt(cardContainer.dataset.cardIndex);
    selectedIndices.push(realIndex);

    // Update Status
    if (selectedIndices.length < maxSelection) {
        if (statusText) statusText.innerText = `Выбрано: ${selectedIndices.length} / ${maxSelection}`;
        tg.HapticFeedback.impactOccurred('light');
    } else {
        if (statusText) statusText.innerText = `Выбрано ${maxSelection} карты. Нажмите кнопку внизу`;
        tg.HapticFeedback.notificationOccurred('success');

        // Показать и активировать MainButton
        tg.MainButton.setText('Отправить карты');
        tg.MainButton.color = tg.themeParams.button_color || '#2cab37';
        tg.MainButton.textColor = tg.themeParams.button_text_color || '#ffffff';
        tg.MainButton.enable();
        tg.MainButton.show();

        console.log('Selected cards:', selectedIndices);
    }
}

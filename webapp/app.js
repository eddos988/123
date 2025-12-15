const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

console.log('=== TELEGRAM WEBAPP DEBUG ===');
console.log('initData:', tg.initData);
console.log('platform:', tg.platform);

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

// Render Grid
if (grid) {
    shuffledDeck.forEach((cardIndex) => {
        const cardContainer = document.createElement('div');
        cardContainer.className = 'card-container';

        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.cardIndex = cardIndex;

        const faceFront = document.createElement('div');
        faceFront.className = 'card-face card-front';

        const faceBack = document.createElement('div');
        faceBack.className = 'card-face card-back';

        // Removed image loading to prevent 404 errors as requested
        faceBack.innerText = `#${cardIndex}`;

        card.appendChild(faceFront);
        card.appendChild(faceBack);
        cardContainer.appendChild(card);

        cardContainer.addEventListener('click', () => handleCardClick(card));
        grid.appendChild(cardContainer);
    });
} else {
    console.error("Grid element not found!");
}

function sendDataToBot() {
    console.log('=== ATTEMPTING TO SEND DATA via DEEP LINK ===');
    console.log('Selected indices:', selectedIndices);

    // 1. Construct indices string "10-22-77"
    const dataStr = selectedIndices.join('-');
    const botUsername = "df4dr4bot"; // Your bot username

    // 2. Open Deep Link
    const url = `https://t.me/${botUsername}?start=tarot_${dataStr}`;

    console.log('Opening URL:', url);

    try {
        tg.openTelegramLink(url);
        tg.close();
    } catch (error) {
        console.error('ERROR opening link:', error);
        tg.showAlert('Ошибка ссылки: ' + error.message);
    }
}

// ВАЖНО: Устанавливаем обработчик ДО показа кнопки
tg.MainButton.onClick(sendDataToBot);

// Скрыть MainButton изначально
tg.MainButton.hide();

function handleCardClick(cardElement) {
    if (selectedIndices.length >= maxSelection || cardElement.classList.contains('flipped')) {
        return;
    }

    cardElement.classList.add('flipped');
    const realIndex = parseInt(cardElement.dataset.cardIndex);
    selectedIndices.push(realIndex);

    console.log('Card selected:', realIndex, 'Total:', selectedIndices.length);

    if (selectedIndices.length < maxSelection) {
        if (statusText) statusText.innerText = `Выбрано: ${selectedIndices.length} / ${maxSelection}`;
        if (tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('light');
        }
    } else {
        if (statusText) statusText.innerText = 'Нажмите кнопку "Отправить"';
        if (tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
        }

        console.log('=== SHOWING MAIN BUTTON ===');

        // Настраиваем и показываем кнопку
        tg.MainButton.setText('Отправить (через старт)');
        tg.MainButton.color = tg.themeParams.button_color || '#0088cc';
        tg.MainButton.textColor = tg.themeParams.button_text_color || '#ffffff';
        tg.MainButton.isVisible = true;
        tg.MainButton.isActive = true;
        tg.MainButton.enable();
        tg.MainButton.show();
    }
}

console.log('Script loaded.');

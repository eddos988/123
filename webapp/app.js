const tg = window.Telegram.WebApp;
tg.expand();

// --- SHUFFLE LOGIC (Ported from Python) ---

function riffleShuffle(deck, clumsyProbability = 0.0) {
    // 1. Cut
    let cutSize = Math.floor(27 + Math.random() * (43 - 27));
    if (deck.length < cutSize) cutSize = Math.floor(deck.length / 2);

    let rightHand = deck.slice(deck.length - cutSize);
    let leftHand = deck.slice(0, deck.length - cutSize);
    let shuffled = [];

    // 2. Interleave
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

    // 3. Clumsy drops (Reversal simulation - simplified track)
    // In Python we tracked (card, is_reversed). Here we just track index.
    // If we want to simulate reversals, we'd need to store objects.
    // For now, let's just shuffle INDICES. The bot will handle 'reversed' state generation 
    // or we can simulate it here if we want the APP to say "Reversed".
    // User requested: "Visual choice".

    return shuffled;
}

function humanShuffle(deckSize) {
    // Create initial ordered deck [0, 1, ... 77]
    let deck = Array.from({ length: deckSize }, (_, i) => i);

    // Shuffle 5-7 times
    const iterations = 5 + Math.floor(Math.random() * 3); // 5, 6, or 7

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
shuffledDeck.forEach((cardIndex, visualIndex) => {
    const cardContainer = document.createElement('div');
    cardContainer.className = 'card-container';

    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.cardIndex = cardIndex; // The REAL card index (0-77)

    // Front (Back of tarot card)
    const faceFront = document.createElement('div');
    faceFront.className = 'card-face card-front';

    // Back (Revealed face)
    const faceBack = document.createElement('div');
    faceBack.className = 'card-face card-back';

    // Try to load image, fallback to number
    const img = document.createElement('img');
    img.src = `assets/cards/${cardIndex}.jpg`;
    img.onerror = () => { img.style.display = 'none'; faceBack.innerText = `#${cardIndex}`; };
    faceBack.appendChild(img);

    card.appendChild(faceFront);
    card.appendChild(faceBack);
    cardContainer.appendChild(card);

    cardContainer.addEventListener('click', () => handleCardClick(card));
    grid.appendChild(cardContainer);
});

function handleCardClick(cardElement) {
    if (selectedIndices.length >= maxSelection || cardElement.classList.contains('flipped')) {
        return;
    }

    // 1. Flip immediately
    cardElement.classList.add('flipped');

    // 2. Add to selection
    const realIndex = parseInt(cardElement.dataset.cardIndex);
    selectedIndices.push(realIndex);

    // 3. Update Status
    if (selectedIndices.length < maxSelection) {
        statusText.innerText = `Выбрано: ${selectedIndices.length} / ${maxSelection}`;
        tg.HapticFeedback.impactOccurred('light');
    } else {
        statusText.innerText = "Готово! Передаю карты...";
        tg.HapticFeedback.notificationOccurred('success');

        // 4. Finish
        setTimeout(() => {
            tg.sendData(JSON.stringify(selectedIndices));
            tg.close();
        }, 1200);
    }
}

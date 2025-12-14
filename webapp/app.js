const tg = window.Telegram.WebApp;
tg.expand();

// --- SHUFFLE LOGIC (Ported from Python) ---

function riffleShuffle(deck, clumsyProbability = 0.0) {
    // 1. Cut
    let cutSize = Math.floor(27 + Math.random() * (43 - 27));
    if (deck.length < cutSize) cutSize = Math.floor(deck.length / 2);
    // Init MainButton
    tg.MainButton.textColor = "#FFFFFF";
    tg.MainButton.color = "#2cab37";

    // Tarot Deck (78 cards)
    const totalCards = 78;
    const maxSelection = 3;
    let selectedIndices = [];
    let deck = [];

    // DOM Elements
    const grid = document.getElementById('card-grid'); // Changed from 'grid' to 'card-grid' to match original HTML
    const statusText = document.getElementById('status');

    // Initialize Deck (0 to 77)
    for (let i = 0; i < totalCards; i++) {
        deck.push(i);
    }

    // Fisher-Yates Shuffle (Standard Random) - Initial State
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
    deck.forEach((cardIndex, visualIndex) => {
        const card = document.createElement('div');
        card.className = 'card-container'; // Changed from 'card' to 'card-container' to match original HTML structure
        card.dataset.index = visualIndex; // Visual position
        card.dataset.cardIndex = cardIndex; // Real card ID (0-77)

        const flipper = document.createElement('div');
        flipper.className = 'card'; // Changed from 'flipper' to 'card' to match original HTML structure

        const front = document.createElement('div');
        front.className = 'card-face card-front'; // Changed from 'front' to 'card-face card-front' to match original HTML structure
        // Back image handled by CSS

        const back = document.createElement('div');
        back.className = 'card-face card-back'; // Changed from 'back' to 'card-face card-back' to match original HTML structure
        // We don't show real faces in selection to keep mystery, 
        // or we could show them. For now, let's keep it mystery/generic back flip.
        // If we wanted faces: back.style.backgroundImage = `url('assets/cards/${cardIndex}.jpg')`
        // Try to load image, fallback to number
        const img = document.createElement('img');
        img.src = `assets/cards/${cardIndex}.jpg`;
        img.onerror = () => { img.style.display = 'none'; back.innerText = `#${cardIndex}`; };
        back.appendChild(img);

        flipper.appendChild(front);
        flipper.appendChild(back);
        card.appendChild(flipper);

        card.addEventListener('click', () => handleCardClick(flipper)); // Pass the flipper (inner card) to handleCardClick
        grid.appendChild(card);
    });

    function handleCardClick(cardElement) {
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
            statusText.innerText = `Выбрано: ${selectedIndices.length} / ${maxSelection}`;
            tg.HapticFeedback.impactOccurred('light');
        } else {
            statusText.innerText = "Готово! Нажмите кнопку внизу";
            tg.HapticFeedback.notificationOccurred('success');

            // Show MainButton
            tg.MainButton.setText(`Отправить (${selectedIndices.length})`);
            tg.MainButton.show();
        }
    }

    // Handle MainButton Click
    tg.MainButton.onClick(() => {
        const dataToSend = JSON.stringify(selectedIndices);

        try {
            if (tg.sendData) {
                tg.sendData(dataToSend);
            } else {
                alert('Ошибка: метод sendData недоступен!');
            }
        } catch (e) {
            alert('Ошибка отправки: ' + e.message);
        }
    });

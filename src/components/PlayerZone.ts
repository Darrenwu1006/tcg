import { Store, AppState, Card } from "../state/Store";
import { Card as CardComponent } from "./Card";

export class PlayerZone {
  private element: HTMLElement;
  private playerType: "me" | "opponent";
  private store: Store<AppState>;

  private expandedZone: string | null = null;
  private lastPerspective: "me" | "opponent" | null = null;

  constructor(playerType: "me" | "opponent", store: Store<AppState>) {
    this.playerType = playerType;
    this.store = store;
    this.element = document.createElement("div");
    this.element.className = `player-zone ${this.playerType}`;
    this.render();
    this.setupSubscription();

    // Setup drag for both players, but listener will check perspective
    this.setupGlobalDragSelection();
  }

  private setupGlobalDragSelection() {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let selectionBox: HTMLElement | null = null;
    let initialShiftKey = false;

    // Mouse Events
    document.addEventListener("mousedown", (e) => {
      // Only allow drag if not clicking on a card or interactive element
      if ((e.target as HTMLElement).closest(".card, button, .slot")) return;

      // Only allow drag if this player is the active viewer
      const state = this.store.getState();
      if (state.viewPerspective !== this.playerType) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialShiftKey = e.shiftKey;

      selectionBox = document.createElement("div");
      selectionBox.className = "selection-box";
      selectionBox.style.left = `${startX}px`;
      selectionBox.style.top = `${startY}px`;
      document.body.appendChild(selectionBox);

      if (!initialShiftKey) {
        this.store.setState({ selectedCards: [] });
      }
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging || !selectionBox) return;

      const currentX = e.clientX;
      const currentY = e.clientY;

      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
      const left = Math.min(currentX, startX);
      const top = Math.min(currentY, startY);

      selectionBox.style.width = `${width}px`;
      selectionBox.style.height = `${height}px`;
      selectionBox.style.left = `${left}px`;
      selectionBox.style.top = `${top}px`;
    });

    document.addEventListener("mouseup", () => {
      finishDrag();
    });

    // Touch Events
    document.addEventListener(
      "touchstart",
      (e) => {
        // Only allow drag if not clicking on a card or interactive element
        if ((e.target as HTMLElement).closest(".card, button, .slot")) return;

        // Only allow drag if this player is the active viewer
        const state = this.store.getState();
        if (state.viewPerspective !== this.playerType) return;

        // Prevent default scrolling behavior if we are starting a drag
        // But we need to be careful not to block scrolling entirely if not dragging
        // For now, let's assume if we touch empty space, we want to select.
        // e.preventDefault(); // This might be too aggressive

        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        initialShiftKey = false; // No shift key on touch usually

        selectionBox = document.createElement("div");
        selectionBox.className = "selection-box";
        selectionBox.style.left = `${startX}px`;
        selectionBox.style.top = `${startY}px`;
        document.body.appendChild(selectionBox);

        this.store.setState({ selectedCards: [] });
      },
      { passive: false }
    );

    document.addEventListener(
      "touchmove",
      (e) => {
        if (!isDragging || !selectionBox) return;
        e.preventDefault(); // Prevent scrolling while dragging selection

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;

        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        const left = Math.min(currentX, startX);
        const top = Math.min(currentY, startY);

        selectionBox.style.width = `${width}px`;
        selectionBox.style.height = `${height}px`;
        selectionBox.style.left = `${left}px`;
        selectionBox.style.top = `${top}px`;
      },
      { passive: false }
    );

    document.addEventListener("touchend", () => {
      finishDrag();
    });

    const finishDrag = () => {
      if (!isDragging) return;
      isDragging = false;

      if (selectionBox) {
        const boxRect = selectionBox.getBoundingClientRect();
        selectionBox.remove();
        selectionBox = null;

        // Select cards intersecting with box
        // We check ALL cards in the DOM that are relevant (Hand + Expanded View)
        // We need to ensure they have data-instance-id
        const cardEls = document.querySelectorAll(".card");
        const state = this.store.getState();
        const playerData = state[this.playerType];

        // Combine all possible cards to search from
        const allCards = [
          ...playerData.hand,
          ...playerData.field,
          ...playerData.deck,
          ...playerData.drop,
          ...playerData.set,
        ];

        let newSelectedCards: Card[] = initialShiftKey
          ? [...(state.selectedCards || [])]
          : [];

        cardEls.forEach((cardEl) => {
          const rect = cardEl.getBoundingClientRect();
          const instanceId = (cardEl as HTMLElement).dataset.instanceId;
          if (!instanceId) return;

          const cardObj = allCards.find((c) => c.instanceId === instanceId);
          if (!cardObj) return;

          if (
            rect.left < boxRect.right &&
            rect.right > boxRect.left &&
            rect.top < boxRect.bottom &&
            rect.bottom > boxRect.top
          ) {
            if (!newSelectedCards.find((c) => c.instanceId === instanceId)) {
              newSelectedCards.push(cardObj);
            }
          }
        });

        this.store.setState({
          selectedCards: newSelectedCards,
          playingCard:
            newSelectedCards.length === 1 ? newSelectedCards[0] : null,
        });
      }
    };
  }

  private setupSubscription() {
    this.store.subscribe((state) => {
      this.updateCounts(state);

      if (
        this.lastPerspective &&
        this.lastPerspective !== state.viewPerspective
      ) {
        this.expandedZone = null;
        this.renderExpandedOverlay();
      }
      this.lastPerspective = state.viewPerspective;

      if (this.expandedZone) {
        this.renderExpandedOverlay();
      }
    });
  }

  private updateCounts(state: AppState) {
    const playerData = this.playerType === "me" ? state.me : state.opponent;
    const school =
      this.playerType === "me" ? state.me.school : state.opponent.school;

    this.updateSetArea(playerData.set, school, state.viewPerspective);
    this.updateDeckArea(playerData.deck, school);
    this.updateDropArea(playerData.drop, school);

    const setEl = this.element.querySelector(".set-area .count");
    const deckEl = this.element.querySelector(".deck-area .count");

    if (setEl) setEl.textContent = playerData.set.length.toString();
    if (deckEl) deckEl.textContent = playerData.deck.length.toString();

    this.updateHand(playerData.hand);
    this.updateField(playerData.field);
  }

  private updateSetArea(
    setCards: Card[],
    school: string,
    viewPerspective: "me" | "opponent"
  ) {
    const setArea = this.element.querySelector(".set-area");
    if (!setArea) return;

    const setCardsContainer = setArea.querySelector(".set-cards-container");
    if (!setCardsContainer) return;

    const existingCardElements = Array.from(
      setCardsContainer.querySelectorAll<HTMLElement>(".set-card")
    );
    const newInstanceIds = new Set(setCards.map((card) => card.instanceId));

    // Remove old cards
    existingCardElements.forEach((el) => {
      if (!newInstanceIds.has(el.dataset.instanceId!)) {
        el.remove();
      }
    });

    // Add or update cards
    setCards.forEach((card) => {
      const existingCard = existingCardElements.find(
        (el) => el.dataset.instanceId === card.instanceId
      );

      if (existingCard) {
        // Card exists, check if interaction needs to be updated
        const shouldBeInteractive = this.playerType === viewPerspective;
        const hasClickListener = existingCard.style.cursor === "pointer";

        if (shouldBeInteractive !== hasClickListener) {
          // Interaction state changed, need to re-render
          const cardHtml = CardComponent.render(card, true, school); // Face down
          const cardWrapper = document.createElement("div");
          cardWrapper.innerHTML = cardHtml;
          const newCardEl = cardWrapper.firstElementChild as HTMLElement;
          newCardEl.classList.add("set-card");
          newCardEl.dataset.instanceId = card.instanceId;

          if (shouldBeInteractive) {
            newCardEl.addEventListener("click", () => {
              if (confirm("Add this card to your hand?")) {
                this.moveSetCardToHand(card);
              }
            });
            newCardEl.style.cursor = "pointer";
          }

          existingCard.replaceWith(newCardEl);
        }
      } else {
        // Card is new, create and append
        const cardHtml = CardComponent.render(card, true, school); // Face down
        const cardWrapper = document.createElement("div");
        cardWrapper.innerHTML = cardHtml;
        const cardEl = cardWrapper.firstElementChild as HTMLElement;
        cardEl.classList.add("set-card");
        cardEl.dataset.instanceId = card.instanceId;

        if (this.playerType === viewPerspective) {
          cardEl.addEventListener("click", () => {
            if (confirm("Add this card to your hand?")) {
              this.moveSetCardToHand(card);
            }
          });
          cardEl.style.cursor = "pointer";
        }
        setCardsContainer.appendChild(cardEl);
      }
    });

    // Handle placeholder
    const placeholder =
      setCardsContainer.querySelector<HTMLElement>(".set-card-slot");
    if (setCards.length > 0) {
      if (placeholder) placeholder.remove();
    } else {
      if (!placeholder) {
        const slot = document.createElement("div");
        slot.className = "slot set-card-slot";
        slot.setAttribute("data-pos", "set");
        slot.textContent = "Set";
        setCardsContainer.appendChild(slot);
      }
    }

    // Handle surrender button - Show when Set area is empty and viewing own zone
    const existingSurrenderBtn =
      setCardsContainer.querySelector<HTMLElement>(".surrender-btn");

    if (setCards.length === 0 && this.playerType === viewPerspective) {
      // Show surrender button
      if (!existingSurrenderBtn) {
        const surrenderBtn = document.createElement("button");
        surrenderBtn.className = "btn surrender-btn";
        surrenderBtn.textContent = "Surrender";
        surrenderBtn.addEventListener("click", () => this.handleSurrender());
        setCardsContainer.appendChild(surrenderBtn);
      }
    } else {
      // Remove surrender button if it exists
      if (existingSurrenderBtn) {
        existingSurrenderBtn.remove();
      }
    }
  }

  private updateDeckArea(deck: Card[], school: string) {
    const deckSlot = this.element.querySelector<HTMLElement>(".deck-slot");
    if (!deckSlot) return;

    const stackContainer = deckSlot.querySelector<HTMLElement>(".card-stack");

    if (deck.length > 0) {
      const schoolClass =
        school === "青葉城西"
          ? "seijoh"
          : school === "音駒"
          ? "nekoma"
          : school === "梟谷"
          ? "fukurodani"
          : "karasuno";

      if (stackContainer) {
        // Already exists, just update count
        stackContainer.dataset.count = deck.length.toString();

        // Also update the card back style in case school changed
        const cardDiv = stackContainer.querySelector(".card");
        if (cardDiv) {
          cardDiv.className = `card back ${schoolClass}`;
          const schoolNameDiv = cardDiv.querySelector(".school-name");
          if (schoolNameDiv) {
            schoolNameDiv.textContent = school;
          } else {
            // Should not happen if structure is consistent, but safe to rebuild
            cardDiv.innerHTML = `<div class="card-back-design"><div class="school-name">${school}</div></div>`;
          }
        }
      } else {
        // Needs to be created
        deckSlot.innerHTML = ""; // Clear "Deck" text
        const newStackContainer = document.createElement("div");
        newStackContainer.className = "card-stack";
        newStackContainer.dataset.count = deck.length.toString();

        const cardDiv = document.createElement("div");
        cardDiv.className = `card back ${schoolClass}`;
        cardDiv.innerHTML = `<div class="card-back-design"><div class="school-name">${school}</div></div>`;
        newStackContainer.appendChild(cardDiv);
        deckSlot.appendChild(newStackContainer);
      }
    } else {
      // Deck is empty, remove card visual and show text
      if (stackContainer) {
        deckSlot.innerHTML = "Deck";
      }
    }
  }

  private updateDropArea(drop: Card[], school: string) {
    const dropSlot = this.element.querySelector<HTMLElement>(".drop-slot");
    if (!dropSlot) return;

    const topCard = drop.length > 0 ? drop[drop.length - 1] : null;
    const existingCardEl = dropSlot.querySelector<HTMLElement>(".card");
    const existingCountEl = dropSlot.querySelector<HTMLElement>(".stack-count");

    // 1. Update Card
    if (topCard) {
      if (
        !existingCardEl ||
        existingCardEl.dataset.instanceId !== topCard.instanceId
      ) {
        if (existingCardEl) existingCardEl.remove();
        const cardHtml = CardComponent.render(topCard, false, school);
        if (cardHtml && cardHtml.trim().length > 0) {
          const cardWrapper = document.createElement("div");
          cardWrapper.innerHTML = cardHtml;
          const newCardEl = cardWrapper.firstElementChild as HTMLElement;
          // Prepend to keep count at bottom
          dropSlot.prepend(newCardEl);
        }
      }
    } else {
      if (existingCardEl) {
        existingCardEl.remove();
        dropSlot.textContent = "Drop"; // Show text only when removing last card
      }
    }

    // 2. Update Count
    if (drop.length > 1) {
      if (existingCountEl) {
        existingCountEl.textContent = drop.length.toString();
      } else {
        const countBadge = document.createElement("div");
        countBadge.className = "stack-count";
        countBadge.textContent = drop.length.toString();
        dropSlot.appendChild(countBadge);
      }
    } else {
      if (existingCountEl) existingCountEl.remove();
    }
  }

  private moveSetCardToHand(card: any) {
    const state = this.store.getState();
    const playerData = state[this.playerType];
    const newSet = playerData.set.filter(
      (c) => c.instanceId !== card.instanceId
    );
    const newHand = [...playerData.hand, card];

    this.store.setState({
      [this.playerType]: { ...playerData, set: newSet, hand: newHand },
    } as any);
  }

  private handleSurrender() {
    // Show confirmation dialog
    const confirmSurrender = confirm("確定投降嗎？");

    if (confirmSurrender) {
      const state = this.store.getState();
      const winner = this.playerType === "me" ? "opponent" : "me";

      // Increment winner's win count
      const newWinCount = { ...state.winCount };
      newWinCount[winner]++;

      // Set match winner and update win count
      this.store.setState({
        matchWinner: winner,
        winCount: newWinCount,
      } as any);

      this.store.addLog(
        `${this.playerType === "me" ? "我方" : "對手"} 投降了！勝者：${
          winner === "me" ? "我方" : "對手"
        }`
      );
    }
  }

  private attachDrawEvent() {
    const drawBtn = this.element.querySelector(".draw-btn");
    drawBtn?.addEventListener("click", () => {
      const state = this.store.getState();
      // Only allow draw if viewing this player's zone
      if (this.playerType !== state.viewPerspective) return;

      const playerData = state[this.playerType];
      const deck = [...playerData.deck];

      if (deck.length === 0) {
        alert("Deck is empty!");
        return;
      }

      const card = deck.shift(); // Draw top card
      if (card) {
        const newHand = [...playerData.hand, card];
        this.store.setState({
          [this.playerType]: { ...playerData, deck: deck, hand: newHand },
        } as any);
        this.store.addLog(
          `${this.playerType === "me" ? "我方" : "對手"} 抽了一張卡`
        );
      }
    });

    const shuffleBtn = this.element.querySelector(".shuffle-btn");
    shuffleBtn?.addEventListener("click", () => {
      const state = this.store.getState();
      if (state.viewPerspective === this.playerType) {
        this.store.shuffleDeck(this.playerType);
      } else {
        alert("You can only shuffle your own deck.");
      }
    });
  }

  private updateHand(hand: Card[]) {
    const handContainer = this.element.querySelector(".hand-cards");
    if (!handContainer) return;

    const state = this.store.getState();
    const school =
      this.playerType === "me" ? state.me.school : state.opponent.school;
    const isVisible = this.playerType === state.viewPerspective;

    const existingCardElements = Array.from(
      handContainer.querySelectorAll(".card[data-instance-id]")
    ) as HTMLElement[];
    const existingInstanceIds = new Set(
      existingCardElements.map((el) => el.dataset.instanceId)
    );
    const newInstanceIds = new Set(hand.map((card) => card.instanceId));

    // 1. Remove cards that are no longer in the hand
    existingCardElements.forEach((el) => {
      const instanceId = el.dataset.instanceId;
      if (instanceId && !newInstanceIds.has(instanceId)) {
        el.remove();
      }
    });

    // 2. Add or update cards
    hand.forEach((card) => {
      if (existingInstanceIds.has(card.instanceId)) {
        // Card already exists
        const cardEl = handContainer.querySelector(
          `.card[data-instance-id="${card.instanceId}"]`
        ) as HTMLElement;

        if (cardEl) {
          // Check if visibility has changed (need to re-render card)
          const wasVisible = !cardEl.classList.contains("back");

          if (wasVisible !== isVisible) {
            // Visibility changed, need to re-render the card
            const cardHtml = CardComponent.render(
              card,
              !isVisible, // isBack = !isVisible
              school
            );
            const cardWrapper = document.createElement("div");
            cardWrapper.innerHTML = cardHtml;
            const newCardEl = cardWrapper.firstElementChild as HTMLElement;

            if (newCardEl) {
              newCardEl.dataset.instanceId = card.instanceId;

              // Re-attach interaction events if now visible
              if (isVisible) {
                this.attachCardInteractionEvents(newCardEl, card);
              }

              // Update selection state
              const isSelected = !!state.selectedCards?.find(
                (c) => c.instanceId === card.instanceId
              );
              if (isSelected) {
                newCardEl.classList.add("playing", "selected");
                newCardEl.style.border = "2px solid #00ff88";
              }

              // Replace old card with new one
              cardEl.replaceWith(newCardEl);
            }
          } else {
            // Visibility unchanged, just update selection state
            const isSelected = !!state.selectedCards?.find(
              (c) => c.instanceId === card.instanceId
            );
            if (isSelected) {
              cardEl.classList.add("playing", "selected");
              cardEl.style.border = "2px solid #00ff88";
            } else {
              cardEl.classList.remove("playing", "selected");
              cardEl.style.border = ""; // Or original border
            }
          }
        }
      } else {
        // Card is new, create and append it
        const cardHtml = CardComponent.render(
          card,
          !isVisible, // isBack = !isVisible
          school
        );
        const cardWrapper = document.createElement("div");
        cardWrapper.innerHTML = cardHtml;
        const cardEl = cardWrapper.firstElementChild as HTMLElement;
        if (!cardEl) return;

        cardEl.dataset.instanceId = card.instanceId;

        if (isVisible) {
          this.attachCardInteractionEvents(cardEl, card);
        }

        const isSelected = !!state.selectedCards?.find(
          (c) => c.instanceId === card.instanceId
        );
        if (isSelected) {
          cardEl.classList.add("playing", "selected");
          cardEl.style.border = "2px solid #00ff88";
        }

        handContainer.appendChild(cardEl);
      }
    });
  }

  // Helper to avoid duplicating event listener logic
  private attachCardInteractionEvents(cardEl: HTMLElement, card: Card) {
    // Right-click for details
    cardEl.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.store.setState({ selectedCard: card });
    });

    // Left-click for details and selection
    cardEl.addEventListener("click", (e) => {
      e.stopPropagation();
      const currentState = this.store.getState();

      // Always show card details on left-click
      this.store.setState({ selectedCard: card });

      // Handle selection with Shift key
      let newSelected = [...(currentState.selectedCards || [])];

      if (e.shiftKey) {
        if (newSelected.find((c) => c.instanceId === card.instanceId)) {
          newSelected = newSelected.filter(
            (c) => c.instanceId !== card.instanceId
          );
        } else {
          newSelected.push(card);
        }
      } else {
        newSelected = [card];
      }

      this.store.setState({
        selectedCards: newSelected,
        playingCard: newSelected.length === 1 ? newSelected[0] : null,
      });
    });
  }

  private updateField(field: Card[]) {
    const state = this.store.getState();
    const school =
      this.playerType === "opponent" ? state.opponent.school : state.me.school;

    // Group new field cards by position
    const positionMap: Record<string, Card[]> = {};
    field.forEach((card) => {
      if (!card.position) return;
      if (!positionMap[card.position]) positionMap[card.position] = [];
      positionMap[card.position].push(card);
    });

    const slots = this.element.querySelectorAll<HTMLElement>(".slot[data-pos]");

    slots.forEach((slot) => {
      const pos = slot.dataset.pos;
      if (!pos) return;

      // We only care about field slots here, not hand/deck etc.
      if (
        [
          "serve",
          "event",
          "receive",
          "toss",
          "attack",
          "block-left",
          "block-center",
          "block-right",
        ].includes(pos)
      ) {
        const cardsInPos = positionMap[pos] || [];
        const topCard =
          cardsInPos.length > 0 ? cardsInPos[cardsInPos.length - 1] : null;

        const existingCardEl = slot.querySelector<HTMLElement>(
          ".card[data-instance-id]"
        );
        const existingInstanceId = existingCardEl?.dataset.instanceId;
        const existingCountEl = slot.querySelector<HTMLElement>(".stack-count");

        // 1. Update Card Element
        if (topCard) {
          if (existingCardEl && existingInstanceId === topCard.instanceId) {
            // Card is the same, do nothing to the element itself
          } else {
            // Card is new or different, replace the old one
            if (existingCardEl) existingCardEl.remove();

            const cardHtml = CardComponent.render(topCard, false, school);
            const cardWrapper = document.createElement("div");
            cardWrapper.innerHTML = cardHtml;
            const newCardEl = cardWrapper.firstElementChild as HTMLElement;

            if (newCardEl) {
              newCardEl.dataset.instanceId = topCard.instanceId;
              // Re-attach events for the new card
              this.attachFieldCardEvents(newCardEl, topCard);
              slot.appendChild(newCardEl);
            }
          }
        } else {
          // No top card, so remove any existing card element
          if (existingCardEl) {
            existingCardEl.remove();
          }
        }

        // 2. Update Stack Count
        if (cardsInPos.length > 1) {
          if (existingCountEl) {
            existingCountEl.textContent = cardsInPos.length.toString();
          } else {
            const countBadge = document.createElement("div");
            countBadge.className = "stack-count";
            countBadge.textContent = cardsInPos.length.toString();
            slot.appendChild(countBadge);
          }
        } else {
          if (existingCountEl) {
            existingCountEl.remove();
          }
        }
      }
    });
  }

  private attachFieldCardEvents(cardEl: HTMLElement, card: Card) {
    // Right-click for details on field cards
    cardEl.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.store.setState({ selectedCard: card });
    });

    // Left-click also shows details on field cards
    cardEl.addEventListener("click", (e) => {
      e.preventDefault();
      // Removed stopPropagation to allow slot click to handle "Open Stack" logic
      this.store.setState({ selectedCard: card });
    });

    cardEl.style.cursor = "pointer";
  }

  private render() {
    this.element.innerHTML = `
      <div class="left-side container">

        <div class="set-area">
          <h2>Set Area <span class="count">0</span></h2>
          <div class="set-cards-container">
            <div class="slot set-card-slot" data-pos="set">Set</div>
          </div>
        </div>
        <div class="function-area">
          <button class="btn back-btn">Back</button>
        </div>
      </div>

      <div class="center-court">
        <div class="court-area">
          <!-- Left: Serve -->
          <div class="serve-container">
            <div class="slot serve-slot" data-pos="serve">Serve</div>
          </div>

          <!-- Center: 2x3 Grid -->
          <div class="central-grid">
            <div class="row top-row block-row">
              <div class="slot block-left-slot" data-pos="block-left">Side</div>
              <div class="slot block-center-slot" data-pos="block-center">Center</div>
              <div class="slot block-right-slot" data-pos="block-right">Side</div>
            </div>
            <div class="row mid-row action-row">
              <div class="slot receive-slot" data-pos="receive">Receive</div>
              <div class="slot toss-slot" data-pos="toss">Toss</div>
              <div class="slot attack-slot" data-pos="attack">Attack</div>
            </div>
          </div>

          <!-- Right: Event -->
          <div class="event-container">
            <div class="slot event-slot" data-pos="event">Event</div>
          </div>
        </div>

        <div class="hand-area" data-pos="hand">
           <div class="hand-cards"></div>
        </div>
      </div>

      <div class="right-side container">
        <div class="deck-area">
        <h2>Deck <span class="count">0</span></h2>
        <div class="slot deck-slot" data-pos="deck">Deck</div>
        <div class="function-area">
          <button class="btn draw-btn">Draw</button>
          <button class="btn shuffle-btn">Shuffle</button>
        </div>
      </div>
      <div class="drop-area">
          <h2>Drop</h2>
          <div class="slot drop-slot" data-pos="drop">Drop</div>
        </div>
      </div>
    `;

    this.attachSlotEvents();
    this.attachDrawEvent();
    this.attachFunctionEvents();
    this.attachHandEvents();
  }

  private attachFunctionEvents() {
    const backBtn = this.element.querySelector(".back-btn");

    backBtn?.addEventListener("click", () => {
      const state = this.store.getState();
      if (this.playerType !== state.viewPerspective) return;
      this.store.undo();
    });
  }

  private attachHandEvents() {
    const handArea = this.element.querySelector(".hand-area");
    handArea?.addEventListener("click", (e) => {
      // If clicking a card in hand, that's handled by card click listener.
      // We want to handle clicking the empty area to return a card to hand.
      if ((e.target as HTMLElement).closest(".card")) return;

      const state = this.store.getState();
      if (this.playerType !== state.viewPerspective) return;

      // Check for selected cards
      if (state.selectedCards && state.selectedCards.length > 0) {
        // Move all selected cards to hand
        // But we need to pass ONE card to moveCard, and it will handle the rest.
        this.moveCard(state.selectedCards[0], "hand");
      }
    });
  }

  private attachSlotEvents() {
    const slots = this.element.querySelectorAll(".slot");
    slots.forEach((slot) => {
      slot.addEventListener("click", () => {
        const state = this.store.getState();
        const pos = slot.getAttribute("data-pos");
        const playingCard = state.playingCard;
        const selectedCards = state.selectedCards || [];

        // Interaction (Move/Play) - Only if Owner
        if (this.playerType === state.viewPerspective) {
          // Check if we are trying to move cards TO this slot
          // If selected cards are NOT already in this slot, we move them here.
          // If selected cards ARE in this slot (e.g. we just clicked one), we might want to open the stack.

          let isMoveAction = false;
          if (selectedCards.length > 0) {
            // Check if any selected card is NOT in this slot (or not in this position)
            // If so, it's a move action.
            const cardsInThisSlot = state[this.playerType].field.filter(
              (c) => c.position === pos
            );
            const selectedAreHere = selectedCards.every((sc) =>
              cardsInThisSlot.find((c) => c.instanceId === sc.instanceId)
            );

            if (!selectedAreHere) {
              isMoveAction = true;
            }
          }

          if (isMoveAction) {
            if (slot.classList.contains("deck-slot")) {
              this.moveCard(selectedCards[0], "deck");
              return;
            }
            if (slot.classList.contains("drop-slot")) {
              this.moveCard(selectedCards[0], "drop");
              return;
            }
            if (pos) {
              this.moveCard(selectedCards[0], pos);
              return;
            }
          }

          if (playingCard && pos && !isMoveAction) {
            // If we have a playing card but decided it's not a move action (e.g. it's already here),
            // maybe we want to open the stack?
            // Or if playingCard is set but not selected (e.g. right click?), usually playingCard == selectedCards[0]
          }
        }

        // Expansion - Allow for BOTH Owner and Enemy
        // Open if:
        // 1. No cards selected (pure click on empty slot)
        // 2. OR Cards selected but they are already HERE (clicked on stack to open it)
        const isStackOpenAction =
          !playingCard ||
          (selectedCards.length > 0 &&
            selectedCards.every((sc) => sc.position === pos));

        if (isStackOpenAction && pos) {
          if (
            [
              "serve",
              "event",
              "receive",
              "toss",
              "attack",
              "block-left",
              "block-center",
              "block-right",
              "drop",
            ].includes(pos)
          ) {
            this.expandedZone = pos;
            this.renderExpandedOverlay();
          }
        }
      });
    });

    // Add specific listeners that don't fit the generic click model
    const deckSlot = this.element.querySelector('.slot[data-pos="deck"]');
    deckSlot?.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.store.setState({ viewingDeckInfo: { player: this.playerType } });
    });
  }

  private renderExpandedOverlay() {
    let overlay = document.getElementById("global-expanded-overlay");

    if (!this.expandedZone) {
      if (overlay) {
        overlay.style.display = "none";
        overlay.innerHTML = "";
      }
      return;
    }

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "global-expanded-overlay";
      document.body.appendChild(overlay);
    }

    const state = this.store.getState();
    const playerData = state[this.playerType];
    let cards: Card[] = [];

    if (this.expandedZone === "drop") {
      cards = playerData.drop;
    } else {
      cards = playerData.field.filter((c) => c.position === this.expandedZone);
    }

    // Determine Position based on Viewer
    const isOwnerView = this.playerType === state.viewPerspective;

    // Reset classes
    overlay.className = "expanded-overlay"; // Reset to base class

    if (isOwnerView) {
      // Owner viewing own zone -> Overlay at TOP (Opposite side)
      overlay.classList.add("overlay-top");
    } else {
      // Viewing Enemy zone -> Overlay at BOTTOM (My side)
      overlay.classList.add("overlay-bottom");
    }

    // Separate Top Card and Guts
    let topCard: Card | null = null;
    let guts: Card[] = [];

    if (cards.length > 0) {
      topCard = cards[cards.length - 1];
      guts = cards.slice(0, cards.length - 1);
    }

    overlay.style.display = "flex";
    overlay.innerHTML = `
        <div class="expanded-content">
            <div class="expanded-header">
                <h3>${this.expandedZone.toUpperCase()} Stack ${
      !isOwnerView ? "(Read Only)" : ""
    }</h3>
                <div class="header-buttons">
                    ${
                      isOwnerView
                        ? '<button class="btn move-to-hand-btn">Move to Hand</button>'
                        : ""
                    }
                    <button class="close-btn">Close</button>
                </div>
            </div>
            
            <div class="stack-layout">
                <div class="active-unit-section">
                    <h4>Active Unit</h4>
                    <div class="active-card-container"></div>
                </div>
                <div class="guts-section">
                    <h4>Guts / Stack</h4>
                    <div class="expanded-grid">
                        <!-- Guts cards go here -->
                    </div>
                </div>
            </div>
        </div>
      `;

    const activeContainer = overlay.querySelector(".active-card-container");
    const grid = overlay.querySelector(".expanded-grid") as HTMLElement;
    const closeBtn = overlay.querySelector(".close-btn");
    const moveToHandBtn = overlay.querySelector(".move-to-hand-btn");

    closeBtn?.addEventListener("click", () => {
      this.expandedZone = null;
      this.renderExpandedOverlay();
    });

    // Move to Hand button
    moveToHandBtn?.addEventListener("click", () => {
      const state = this.store.getState();
      if (state.selectedCards && state.selectedCards.length > 0) {
        this.moveCard(state.selectedCards[0], "hand");
        this.expandedZone = null;
        this.renderExpandedOverlay();
      }
    });

    // Close on background click
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        this.expandedZone = null;
        this.renderExpandedOverlay();
      }
    });

    // Drag Selection Logic (Only if Interactive)
    if (isOwnerView) {
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let selectionBox: HTMLElement | null = null;
      let initialShiftKey = false;

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !selectionBox) return;

        const currentX = e.clientX;
        const currentY = e.clientY;
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        const left = Math.min(currentX, startX);
        const top = Math.min(currentY, startY);

        selectionBox.style.width = `${width}px`;
        selectionBox.style.height = `${height}px`;
        selectionBox.style.left = `${left}px`;
        selectionBox.style.top = `${top}px`;
      };

      const handleMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;

        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        if (selectionBox) {
          const boxRect = selectionBox.getBoundingClientRect();
          selectionBox.remove();
          selectionBox = null;

          const cardEls = grid.querySelectorAll(".card");
          let newSelectedCards: Card[] = initialShiftKey
            ? [...(this.store.getState().selectedCards || [])]
            : [];

          cardEls.forEach((cardEl) => {
            const rect = cardEl.getBoundingClientRect();
            const instanceId = (cardEl as HTMLElement).dataset.instanceId;
            if (!instanceId) return;

            const cardObj = cards.find((c) => c.instanceId === instanceId);
            if (!cardObj) return;

            if (
              rect.left < boxRect.right &&
              rect.right > boxRect.left &&
              rect.top < boxRect.bottom &&
              rect.bottom > boxRect.top
            ) {
              if (!newSelectedCards.find((c) => c.instanceId === instanceId)) {
                newSelectedCards.push(cardObj);
              }
            }
          });

          this.store.setState({
            selectedCards: newSelectedCards,
            playingCard:
              newSelectedCards.length === 1 ? newSelectedCards[0] : null,
          });
        }
      };

      grid.addEventListener("mousedown", (e) => {
        if ((e.target as HTMLElement).closest(".card")) return;

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialShiftKey = e.shiftKey;

        selectionBox = document.createElement("div");
        selectionBox.className = "selection-box";
        selectionBox.style.left = `${startX}px`;
        selectionBox.style.top = `${startY}px`;
        document.body.appendChild(selectionBox);

        if (!initialShiftKey) {
          this.store.setState({ selectedCards: [] });
        }

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      });

      // Ensure listeners are removed when overlay is closed externally
      const closeOverlayCleanup = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        if (selectionBox) selectionBox.remove();
        isDragging = false;
      };

      closeBtn?.addEventListener("click", closeOverlayCleanup);
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeOverlayCleanup();
      });
    }

    // Render Top Card
    if (topCard && activeContainer) {
      const cardHtml = CardComponent.render(topCard, false, playerData.school);
      const cardWrapper = document.createElement("div");
      cardWrapper.innerHTML = cardHtml;
      const cardEl = cardWrapper.firstElementChild as HTMLElement;
      cardEl.dataset.instanceId = topCard.instanceId;

      this.attachCardEvents(cardEl, topCard, isOwnerView);

      if (
        state.selectedCards?.find((c) => c.instanceId === topCard!.instanceId)
      ) {
        cardEl.classList.add("selected");
        cardEl.style.border = "2px solid #00ff88";
      }

      activeContainer.appendChild(cardEl);
    }

    // Render Guts
    guts.forEach((card) => {
      const cardHtml = CardComponent.render(card, false, playerData.school);
      const cardWrapper = document.createElement("div");
      cardWrapper.innerHTML = cardHtml;
      const cardEl = cardWrapper.firstElementChild as HTMLElement;
      cardEl.dataset.instanceId = card.instanceId;

      this.attachCardEvents(cardEl, card, isOwnerView);

      if (state.selectedCards?.find((c) => c.instanceId === card.instanceId)) {
        cardEl.classList.add("selected");
        cardEl.style.border = "2px solid #00ff88";
      }

      grid?.appendChild(cardEl);
    });
  }

  private attachCardEvents(
    cardEl: HTMLElement,
    card: Card,
    isInteractive: boolean
  ) {
    // Always allow Info (Right Click)
    cardEl.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.store.setState({ selectedCard: card });
    });

    // Touch Long Press for Info
    let longPressTimer: any;
    const longPressDuration = 500; // ms
    let startX = 0;
    let startY = 0;

    cardEl.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;

        // Start timer
        longPressTimer = setTimeout(() => {
          this.store.setState({ selectedCard: card });
          // Optional: Provide haptic feedback if possible, or visual cue
          if (navigator.vibrate) navigator.vibrate(50);
        }, longPressDuration);
      },
      { passive: true }
    );

    // Double Tap Logic
    let lastTapTime = 0;
    const doubleTapDelay = 300; // ms

    cardEl.addEventListener("touchend", () => {
      clearTimeout(longPressTimer);

      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTapTime;

      if (tapLength < doubleTapDelay && tapLength > 0) {
        // Double Tap Detected
        this.store.setState({ selectedCard: card });
        if (navigator.vibrate) navigator.vibrate(50);

        // Prevent default click behavior (selection) if double tap
        // But we can't easily prevent the click event from here since it's a separate event sequence.
        // However, showing the detail panel usually overlays everything, so it might be fine.
      }

      lastTapTime = currentTime;
    });

    cardEl.addEventListener(
      "touchmove",
      (e) => {
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = Math.abs(currentX - startX);
        const diffY = Math.abs(currentY - startY);

        // If moved significantly (> 10px), cancel long press
        if (diffX > 10 || diffY > 10) {
          clearTimeout(longPressTimer);
        }
      },
      { passive: true }
    );

    if (isInteractive) {
      cardEl.addEventListener("click", (e) => {
        // Removed stopPropagation to allow slot click to handle "Open Stack" logic
        // e.stopPropagation();
        const currentState = this.store.getState();

        // Always show card details on left-click
        this.store.setState({ selectedCard: card });

        // Handle selection with Shift key
        let newSelected = [...(currentState.selectedCards || [])];

        if (e.shiftKey) {
          if (newSelected.find((c) => c.instanceId === card.instanceId)) {
            newSelected = newSelected.filter(
              (c) => c.instanceId !== card.instanceId
            );
          } else {
            newSelected.push(card);
          }
        } else {
          newSelected = [card];
        }

        this.store.setState({
          selectedCards: newSelected,
          playingCard: newSelected.length === 1 ? newSelected[0] : null,
        });
      });
    } else {
      // Read Only - Show details on left-click
      cardEl.addEventListener("click", () => {
        // Removed stopPropagation
        // e.stopPropagation();
        this.store.setState({ selectedCard: card });
      });
      cardEl.style.cursor = "pointer";
    }
  }

  private moveCard(card: any, targetPos: string) {
    const state = this.store.getState();
    const playerData = state[this.playerType];

    // Determine cards to move
    // If multiple cards are selected, move all of them.
    // If only one (or passed `card` is not in selection), move just that one.
    let cardsToMove = [card];
    if (state.selectedCards && state.selectedCards.length > 0) {
      // If the clicked card is part of selection, move all selected.
      if (state.selectedCards.find((c) => c.instanceId === card.instanceId)) {
        cardsToMove = state.selectedCards;
      }
    }

    // Validate all cards
    // Simplified: All cards must be in valid source (Hand, Field, Drop)
    // We assume they are from the same source if selected together?
    // Or just filter valid ones.

    let newHand = [...playerData.hand];
    let newField = [...playerData.field];
    let newDeck = [...playerData.deck];
    let newDrop = [...playerData.drop];
    let logMsg = "";
    let movedCount = 0;

    cardsToMove.forEach((cToMove) => {
      const inHand = newHand.find((c) => c.instanceId === cToMove.instanceId);
      const inField = newField.find((c) => c.instanceId === cToMove.instanceId);
      const inDrop = newDrop.find((c) => c.instanceId === cToMove.instanceId);

      if (inHand) {
        newHand = newHand.filter((c) => c.instanceId !== cToMove.instanceId);
      } else if (inField) {
        newField = newField.filter((c) => c.instanceId !== cToMove.instanceId);
      } else if (inDrop) {
        newDrop = newDrop.filter((c) => c.instanceId !== cToMove.instanceId);
      } else {
        return; // Skip invalid card
      }

      if (targetPos === "deck") {
        newDeck.push(cToMove);
      } else if (targetPos === "drop") {
        newDrop.push(cToMove);
      } else if (targetPos === "hand") {
        newHand.push(cToMove);
      } else {
        newField.push({ ...cToMove, position: targetPos });
      }
      movedCount++;
    });

    if (movedCount === 0) {
      // No cards were moved, perhaps due to validation.
      return;
    } else if (movedCount === 1) {
      logMsg = `移動了 ${cardsToMove[0].name} 到 ${targetPos}`;
    } else {
      logMsg = `移動了 ${movedCount} 張卡片 到 ${targetPos}`;
    }

    const currentStats = this.calculateStats(newField);

    this.store.setState({
      [this.playerType]: {
        ...playerData,
        hand: newHand,
        field: newField,
        deck: newDeck,
        drop: newDrop,
        currentStats: currentStats,
      },
      playingCard: null,
      selectedCards: [], // Clear selection
      logs: this.store.getNewLogs(
        `${this.playerType === "me" ? "我方" : "對手"} ${logMsg}`
      ),
    } as any);
  }

  private calculateStats(field: Card[]) {
    const stats = { serve: 0, block: 0, receive: 0, toss: 0, attack: 0 };

    field.forEach((card) => {
      if (!card.stats || !card.position) {
        return;
      }

      // Map position to stat
      if (card.position === "serve") stats.serve += card.stats.serve || 0;
      if (card.position.startsWith("block"))
        stats.block += card.stats.block || 0;
      if (card.position === "receive") stats.receive += card.stats.receive || 0;
      if (card.position === "toss") stats.toss += card.stats.toss || 0;
      if (card.position === "attack") stats.attack += card.stats.attack || 0;
    });

    return stats;
  }

  getElement(): HTMLElement {
    return this.element;
  }
}

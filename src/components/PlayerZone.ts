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

    try {
      const setArea = this.element.querySelector(".set-area");
      const deckSlot = this.element.querySelector(".deck-slot");

      // Get School for Card Backs
      const school =
        this.playerType === "me" ? state.me.school : state.opponent.school;

      // Update Set Area
      if (setArea) {
        // Remove existing cards and slot
        const existingCards = setArea.querySelectorAll(".set-card, .slot");
        existingCards.forEach((el) => el.remove());

        // Keep the header
        const header = setArea.querySelector("h2");
        setArea.innerHTML = "";
        if (header) setArea.appendChild(header);

        const setCardsContainer = document.createElement("div");
        setCardsContainer.className = "set-cards-container";
        setArea.appendChild(setCardsContainer);

        // Render Set Cards (Face Down)
        if (playerData.set.length > 0) {
          playerData.set.forEach((card) => {
            const cardHtml = CardComponent.render(card, true, school); // Face down with school back
            const cardWrapper = document.createElement("div");
            cardWrapper.innerHTML = cardHtml;
            const cardEl = cardWrapper.firstElementChild as HTMLElement;
            cardEl.classList.add("set-card");
            cardEl.dataset.instanceId = card.instanceId;

            // Interaction: Add to Hand
            // Allow interaction if it's the active player's view
            const state = this.store.getState();
            if (this.playerType === state.viewPerspective) {
              cardEl.addEventListener("click", () => {
                if (confirm("Add this card to your hand?")) {
                  this.moveSetCardToHand(card);
                }
              });
              cardEl.style.cursor = "pointer";
            }

            setCardsContainer.appendChild(cardEl);
          });
        } else {
          // Restore placeholder slot if empty
          const slot = document.createElement("div");
          slot.className = "slot set-card-slot";
          slot.setAttribute("data-pos", "set");
          slot.textContent = "Set";
          setCardsContainer.appendChild(slot);
        }
      }

      // Update Deck Slot
      if (deckSlot) {
        // Only update visuals, don't re-attach listeners here if possible,
        // but innerHTML wipes them. So we need to re-attach or use a child container.
        // Let's use innerHTML for simplicity but ensure we don't leak.
        deckSlot.innerHTML = "Deck";

        if (playerData.deck.length > 0) {
          // Render top card face down
          const cardHtml = CardComponent.render(
            playerData.deck[0],
            true,
            school
          );
          const cardWrapper = document.createElement("div");
          cardWrapper.innerHTML = cardHtml;
          deckSlot.appendChild(cardWrapper.firstElementChild!);
        }

        // Re-attach listener because innerHTML wiped it
        // Ideally we'd move this to attachSlotEvents and NOT wipe innerHTML,
        // but the slot text "Deck" + card visual is simple enough to just re-render.
        deckSlot.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          this.store.setState({ viewingDeckInfo: { player: this.playerType } });
        });
      }

      // Update Drop Slot Visuals
      const dropSlot = this.element.querySelector(".drop-slot");
      if (dropSlot) {
        dropSlot.innerHTML = "Drop"; // Reset content

        if (playerData.drop.length > 0) {
          // Render card back
          const cardHtml = CardComponent.render(
            playerData.drop[playerData.drop.length - 1],
            true,
            school
          );
          const cardWrapper = document.createElement("div");
          cardWrapper.innerHTML = cardHtml;
          dropSlot.appendChild(cardWrapper.firstElementChild!);
        }
      }

      const setEl = this.element.querySelector(".set-area .count");
      const deckEl = this.element.querySelector(".deck-area .count");
      const dropEl = this.element.querySelector(".drop-area .count");

      if (setEl) setEl.textContent = playerData.set.length.toString();
      if (deckEl) deckEl.textContent = playerData.deck.length.toString();
      if (dropEl) dropEl.textContent = playerData.drop.length.toString();
    } catch (e) {
      console.error("Error updating counts:", e);
    }

    this.updateHand(playerData.hand);
    this.updateField(playerData.field);
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

    handContainer.innerHTML = "";
    hand.forEach((card) => {
      const cardHtml = CardComponent.render(
        card,
        !isVisible, // isBack = !isVisible
        school
      );
      const cardWrapper = document.createElement("div");
      cardWrapper.innerHTML = cardHtml;
      const cardEl = cardWrapper.firstElementChild as HTMLElement;
      cardEl.dataset.instanceId = card.instanceId;

      if (isVisible) {
        // Only allow interaction if I can see it (it's the active view)
        // Right-click for details
        cardEl.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          this.store.setState({ selectedCard: card });
        });

        // Left-click for selection (Play)
        cardEl.addEventListener("click", (e) => {
          e.stopPropagation();
          const currentState = this.store.getState();
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

        if (
          state.selectedCards?.find((c) => c.instanceId === card.instanceId)
        ) {
          cardEl.classList.add("playing");
          cardEl.classList.add("selected");
          cardEl.style.border = "2px solid #00ff88";
        }
      }

      handContainer.appendChild(cardEl);
    });
  }

  private updateField(field: Card[]) {
    // Clear all slots first
    const slots = this.element.querySelectorAll(".slot");
    slots.forEach((slot) => {
      // Clear existing content (cards and counts)
      // We want to keep the text label if it's a text node, but usually we just rebuild.
      // The easiest way is to remove .card and .stack-count
      const existingCards = slot.querySelectorAll(".card");
      existingCards.forEach((c) => c.remove());
      const existingCounts = slot.querySelectorAll(".stack-count");
      existingCounts.forEach((c) => c.remove());
    });

    // Place cards
    // Group by position to find the top card
    const positionMap: Record<string, Card[]> = {};
    field.forEach((card) => {
      if (!card.position) return;
      if (!positionMap[card.position]) positionMap[card.position] = [];
      positionMap[card.position].push(card);
    });

    Object.entries(positionMap).forEach(([pos, cards]) => {
      const slot = this.element.querySelector(`.${pos}-slot`);
      if (slot) {
        const topCard = cards[cards.length - 1]; // Last one is top
        const state = this.store.getState();
        const school =
          this.playerType === "opponent"
            ? state.opponent.school
            : state.me.school;
        const cardHtml = CardComponent.render(topCard, false, school);
        const cardWrapper = document.createElement("div");
        cardWrapper.innerHTML = cardHtml;
        const cardEl = cardWrapper.firstElementChild as HTMLElement;
        cardEl.dataset.instanceId = topCard.instanceId;

        // Right-click for details on field cards
        cardEl.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          e.stopPropagation(); // Prevent bubbling if necessary
          this.store.setState({ selectedCard: topCard });
        });

        slot.appendChild(cardEl);

        // Add a counter if > 1 card
        if (cards.length > 1) {
          const countBadge = document.createElement("div");
          countBadge.className = "stack-count";
          countBadge.textContent = cards.length.toString();
          slot.appendChild(countBadge);
        }
      }
    });
  }

  private render() {
    this.element.innerHTML = `
      <div class="left-side container">

        <div class="set-area">
          <h2>Set Area <span class="count">0</span></h2>
          <div class="slot set-card-slot" data-pos="set">Set</div>
        </div>
        <div class="function-area">
          <button class="btn shuffle-btn">Shuffle</button>
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
           <div class="hand-cards">Hand Area</div>
        </div>
      </div>

      <div class="right-side container">
        <div class="deck-area">
          <h2>Deck <span class="count">0</span></h2>
          <div class="slot deck-slot">Deck</div>
          <button class="btn draw-btn">Draw</button>
        </div>
        <div class="drop-area">
          <h2>Drop <span class="count">0</span></h2>
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
    const shuffleBtn = this.element.querySelector(".shuffle-btn");
    const backBtn = this.element.querySelector(".back-btn");

    shuffleBtn?.addEventListener("click", () => {
      const state = this.store.getState();
      if (this.playerType !== state.viewPerspective) return;

      const playerData = state[this.playerType];
      const newDeck = this.shuffle([...playerData.deck]);

      this.store.setState({
        [this.playerType]: { ...playerData, deck: newDeck },
        logs: this.store.getNewLogs(
          `${this.playerType === "me" ? "我方" : "對手"} 洗切了牌庫`
        ),
      } as any);
    });

    backBtn?.addEventListener("click", () => {
      const state = this.store.getState();
      if (this.playerType !== state.viewPerspective) return;
      this.store.undo();
    });
  }

  private shuffle(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      ([array[i], array[j]] = array[j]), array[i];
    }
    return array;
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
          if (selectedCards.length > 0) {
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

          if (playingCard && pos) {
            this.moveCard(playingCard, pos);
            return;
          }
        }

        // Expansion - Allow for BOTH Owner and Enemy
        if (!playingCard && selectedCards.length === 0 && pos) {
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
                <button class="close-btn">Close</button>
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

    closeBtn?.addEventListener("click", () => {
      this.expandedZone = null;
      this.renderExpandedOverlay();
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
        if (!isDragging) return;
        isDragging = false;

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

    cardEl.addEventListener("touchstart", () => {
      // Start timer
      longPressTimer = setTimeout(() => {
        this.store.setState({ selectedCard: card });
        // Optional: Provide haptic feedback if possible, or visual cue
      }, longPressDuration);
    });

    cardEl.addEventListener("touchend", () => {
      clearTimeout(longPressTimer);
    });

    cardEl.addEventListener("touchmove", () => {
      // If moved significantly, cancel long press
      clearTimeout(longPressTimer);
    });

    if (isInteractive) {
      cardEl.addEventListener("click", (e) => {
        e.stopPropagation();
        const currentState = this.store.getState();
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
      // Read Only - No Click Action (or maybe just highlight?)
      // For now, do nothing on click
      cardEl.style.cursor = "default";
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

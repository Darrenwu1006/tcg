import { Store, AppState, Card } from "../state/Store";
import { Card as CardComponent } from "./Card";

/**
 * ExpandedOverlay manages the overlay for viewing card stacks in detail.
 * Displays active unit and guts (stack) separately with interaction support.
 */
export class ExpandedOverlay {
  private store: Store<AppState>;
  private playerType: "me" | "opponent";
  private overlay: HTMLElement | null = null;

  // Callbacks for card events
  private attachCardEventsCallback: (
    cardEl: HTMLElement,
    card: Card,
    isInteractive: boolean
  ) => void;
  private moveCardCallback: (card: Card, targetPos: string) => void;
  private onCloseCallback?: () => void;

  constructor(
    store: Store<AppState>,
    playerType: "me" | "opponent",
    attachCardEventsCallback: (
      cardEl: HTMLElement,
      card: Card,
      isInteractive: boolean
    ) => void,
    moveCardCallback: (card: Card, targetPos: string) => void,
    onCloseCallback?: () => void
  ) {
    this.store = store;
    this.playerType = playerType;
    this.attachCardEventsCallback = attachCardEventsCallback;
    this.moveCardCallback = moveCardCallback;
    this.onCloseCallback = onCloseCallback;
  }

  /**
   * Render the expanded overlay for a specific zone
   * @param expandedZone - The zone to expand (e.g., "drop", "serve", "attack")
   */
  public render(expandedZone: string | null) {
    if (!this.overlay) {
      this.overlay = document.getElementById("global-expanded-overlay");
      if (!this.overlay) {
        this.overlay = document.createElement("div");
        this.overlay.id = "global-expanded-overlay";
        document.body.appendChild(this.overlay);
      }
    }

    if (!expandedZone) {
      if (this.overlay) {
        this.overlay.style.display = "none";
        this.overlay.innerHTML = "";
      }
      return;
    }

    const state = this.store.getState();
    const playerData = state[this.playerType];
    let cards: Card[] = [];

    if (expandedZone === "drop") {
      cards = playerData.drop;
    } else {
      cards = playerData.field.filter((c) => c.position === expandedZone);
    }

    // Determine Position based on Viewer
    const isOwnerView = this.playerType === state.viewPerspective;

    // Reset classes
    this.overlay.className = "expanded-overlay"; // Reset to base class

    if (isOwnerView) {
      // Owner viewing own zone -> Overlay at TOP (Opposite side)
      this.overlay.classList.add("overlay-top");
    } else {
      // Viewing Enemy zone -> Overlay at BOTTOM (My side)
      this.overlay.classList.add("overlay-bottom");
    }

    // Separate Top Card and Guts
    let topCard: Card | null = null;
    let guts: Card[] = [];

    if (cards.length > 0) {
      topCard = cards[cards.length - 1];
      guts = cards.slice(0, cards.length - 1);
    }

    this.overlay.style.display = "flex";
    this.overlay.innerHTML = `
        <div class="expanded-content">
            <div class="expanded-header">
                <h3>${expandedZone.toUpperCase()} Stack ${
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

    const activeContainer = this.overlay.querySelector(
      ".active-card-container"
    );
    const grid = this.overlay.querySelector(".expanded-grid") as HTMLElement;
    const closeBtn = this.overlay.querySelector(".close-btn");
    const moveToHandBtn = this.overlay.querySelector(".move-to-hand-btn");

    closeBtn?.addEventListener("click", () => {
      this.close();
    });

    // Move to Hand button
    moveToHandBtn?.addEventListener("click", () => {
      const state = this.store.getState();
      if (state.selectedCards && state.selectedCards.length > 0) {
        this.moveCardCallback(state.selectedCards[0], "hand");
        this.close();
      }
    });

    // Close on background click
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // Drag Selection Logic (Only if Interactive)
    if (isOwnerView) {
      this.setupOverlayDragSelection(grid, cards);
    }

    // Render Top Card
    if (topCard && activeContainer) {
      const cardHtml = CardComponent.render(topCard, false, playerData.school);
      const cardWrapper = document.createElement("div");
      cardWrapper.innerHTML = cardHtml;
      const cardEl = cardWrapper.firstElementChild as HTMLElement;
      cardEl.dataset.instanceId = topCard.instanceId;

      this.attachCardEventsCallback(cardEl, topCard, isOwnerView);

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

      this.attachCardEventsCallback(cardEl, card, isOwnerView);

      if (state.selectedCards?.find((c) => c.instanceId === card.instanceId)) {
        cardEl.classList.add("selected");
        cardEl.style.border = "2px solid #00ff88";
      }

      grid?.appendChild(cardEl);
    });
  }

  /**
   * Set up drag selection within the expanded overlay
   */
  private setupOverlayDragSelection(grid: HTMLElement, cards: Card[]) {
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

    const closeBtn = this.overlay?.querySelector(".close-btn");
    closeBtn?.addEventListener("click", closeOverlayCleanup);
    this.overlay?.addEventListener("click", (e) => {
      if (e.target === this.overlay) closeOverlayCleanup();
    });
  }

  /**
   * Close the overlay and clean up
   */
  public close() {
    if (this.overlay) {
      this.overlay.style.display = "none";
      this.overlay.innerHTML = "";
    }
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }
}

import { Store, AppState, Card } from "../state/Store";

/**
 * DragSelection handles global drag-to-select functionality for cards.
 * Supports both mouse and touch events.
 */
export class DragSelection {
  private store: Store<AppState>;
  private playerType: "me" | "opponent";

  // Drag state
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private selectionBox: HTMLElement | null = null;
  private initialShiftKey = false;

  // Event handlers (stored to enable cleanup)
  private mouseDownHandler: (e: MouseEvent) => void;
  private mouseMoveHandler: (e: MouseEvent) => void;
  private mouseUpHandler: () => void;
  private touchStartHandler: (e: TouchEvent) => void;
  private touchMoveHandler: (e: TouchEvent) => void;
  private touchEndHandler: () => void;

  constructor(store: Store<AppState>, playerType: "me" | "opponent") {
    this.store = store;
    this.playerType = playerType;

    // Bind handlers
    this.mouseDownHandler = this.handleMouseDown.bind(this);
    this.mouseMoveHandler = this.handleMouseMove.bind(this);
    this.mouseUpHandler = this.handleMouseUp.bind(this);
    this.touchStartHandler = this.handleTouchStart.bind(this);
    this.touchMoveHandler = this.handleTouchMove.bind(this);
    this.touchEndHandler = this.handleTouchEnd.bind(this);

    this.setupGlobalDragSelection();
  }

  private setupGlobalDragSelection() {
    // Mouse Events
    document.addEventListener("mousedown", this.mouseDownHandler);
    document.addEventListener("mousemove", this.mouseMoveHandler);
    document.addEventListener("mouseup", this.mouseUpHandler);

    // Touch Events
    document.addEventListener("touchstart", this.touchStartHandler, {
      passive: false,
    });
    document.addEventListener("touchmove", this.touchMoveHandler, {
      passive: false,
    });
    document.addEventListener("touchend", this.touchEndHandler);
  }

  private handleMouseDown(e: MouseEvent) {
    // Only allow drag if not clicking on a card or interactive element
    if ((e.target as HTMLElement).closest(".card, button, .slot")) return;

    // Only allow drag if this player is the active viewer
    const state = this.store.getState();
    if (state.viewPerspective !== this.playerType) return;

    this.isDragging = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.initialShiftKey = e.shiftKey;

    this.selectionBox = document.createElement("div");
    this.selectionBox.className = "selection-box";
    this.selectionBox.style.left = `${this.startX}px`;
    this.selectionBox.style.top = `${this.startY}px`;
    document.body.appendChild(this.selectionBox);

    if (!this.initialShiftKey) {
      this.store.setState({ selectedCards: [] });
    }
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.isDragging || !this.selectionBox) return;

    const currentX = e.clientX;
    const currentY = e.clientY;

    const width = Math.abs(currentX - this.startX);
    const height = Math.abs(currentY - this.startY);
    const left = Math.min(currentX, this.startX);
    const top = Math.min(currentY, this.startY);

    this.selectionBox.style.width = `${width}px`;
    this.selectionBox.style.height = `${height}px`;
    this.selectionBox.style.left = `${left}px`;
    this.selectionBox.style.top = `${top}px`;
  }

  private handleMouseUp() {
    this.finishDrag();
  }

  private handleTouchStart(e: TouchEvent) {
    // Only allow drag if not clicking on a card or interactive element
    if ((e.target as HTMLElement).closest(".card, button, .slot")) return;

    // Only allow drag if this player is the active viewer
    const state = this.store.getState();
    if (state.viewPerspective !== this.playerType) return;

    this.isDragging = true;
    this.startX = e.touches[0].clientX;
    this.startY = e.touches[0].clientY;
    this.initialShiftKey = false; // No shift key on touch usually

    this.selectionBox = document.createElement("div");
    this.selectionBox.className = "selection-box";
    this.selectionBox.style.left = `${this.startX}px`;
    this.selectionBox.style.top = `${this.startY}px`;
    document.body.appendChild(this.selectionBox);

    this.store.setState({ selectedCards: [] });
  }

  private handleTouchMove(e: TouchEvent) {
    if (!this.isDragging || !this.selectionBox) return;
    e.preventDefault(); // Prevent scrolling while dragging selection

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    const width = Math.abs(currentX - this.startX);
    const height = Math.abs(currentY - this.startY);
    const left = Math.min(currentX, this.startX);
    const top = Math.min(currentY, this.startY);

    this.selectionBox.style.width = `${width}px`;
    this.selectionBox.style.height = `${height}px`;
    this.selectionBox.style.left = `${left}px`;
    this.selectionBox.style.top = `${top}px`;
  }

  private handleTouchEnd() {
    this.finishDrag();
  }

  private finishDrag() {
    if (!this.isDragging) return;
    this.isDragging = false;

    if (this.selectionBox) {
      const boxRect = this.selectionBox.getBoundingClientRect();
      this.selectionBox.remove();
      this.selectionBox = null;

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

      let newSelectedCards: Card[] = this.initialShiftKey
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
        playingCard: newSelectedCards.length === 1 ? newSelectedCards[0] : null,
      });
    }
  }

  /**
   * Clean up event listeners to prevent memory leaks.
   * Call this when the PlayerZone component is destroyed.
   */
  public cleanup() {
    document.removeEventListener("mousedown", this.mouseDownHandler);
    document.removeEventListener("mousemove", this.mouseMoveHandler);
    document.removeEventListener("mouseup", this.mouseUpHandler);
    document.removeEventListener("touchstart", this.touchStartHandler);
    document.removeEventListener("touchmove", this.touchMoveHandler);
    document.removeEventListener("touchend", this.touchEndHandler);

    // Clean up any remaining selection box
    if (this.selectionBox) {
      this.selectionBox.remove();
      this.selectionBox = null;
    }
  }
}

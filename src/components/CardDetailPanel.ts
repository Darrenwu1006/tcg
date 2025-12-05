import { Store, AppState, Card } from "../state/Store";
import { renderBlockBar } from "../utils/renderHelpers";

export class CardDetailPanel {
  private element: HTMLElement;
  private store: Store<AppState>;

  constructor(store: Store<AppState>) {
    this.store = store;
    this.element = document.createElement("div");
    this.element.className = "card-detail-panel";
    this.render();
    this.setupSubscription();
  }

  private setupSubscription() {
    this.store.subscribe((state) => {
      if (state.viewingDeckInfo) {
        this.renderDeckInfo(state);
      } else {
        this.updateContent(state.selectedCard);
      }
    });
  }

  private updateContent(card: Card | null) {
    if (card) {
      this.renderCardDetails(card);
    } else {
      this.render(); // Show placeholder
    }
  }

  private renderDeckInfo(state: AppState) {
    const info = state.viewingDeckInfo;
    if (!info) return;

    const playerData = state[info.player];
    const allCards = [
      ...playerData.deck,
      ...playerData.hand,
      ...playerData.field,
      ...playerData.drop,
      ...playerData.set,
    ];

    // Calculate Stats
    const cardStats = new Map<
      string,
      {
        name: string;
        total: number;
        remaining: number;
        id: string;
        rarity: string;
        type: "CHARACTER" | "EVENT";
      }
    >();

    // Count Totals
    allCards.forEach((card) => {
      const key = card.id;
      if (!cardStats.has(key)) {
        cardStats.set(key, {
          name: card.name,
          total: 0,
          remaining: 0,
          id: card.id,
          rarity: card.rarity || "",
          type: card.type,
        });
      }
      const stat = cardStats.get(key)!;
      stat.total++;
    });

    // Count Remaining (in Deck)
    playerData.deck.forEach((card) => {
      const key = card.id;
      if (cardStats.has(key)) {
        cardStats.get(key)!.remaining++;
      }
    });

    // Convert to Array and Sort
    const statsArray = Array.from(cardStats.values()).sort((a, b) =>
      a.id.localeCompare(b.id)
    );

    // Group by type
    const characterCards = statsArray.filter((s) => s.type === "CHARACTER");
    const eventCards = statsArray.filter((s) => s.type === "EVENT");

    // Helper function to render card rows
    const renderCardRows = (cards: typeof statsArray) => {
      return cards
        .map(
          (stat) => `
            <tr class="${stat.remaining === 0 ? "empty" : ""}">
                <td class="card-info-cell">
                    <div class="card-name-row">
                        <span class="card-name">${stat.name}</span>
                        ${
                          stat.rarity
                            ? `<span class="card-rarity">(${stat.rarity})</span>`
                            : ""
                        }
                    </div>
                    <div class="card-id">${stat.id}</div>
                </td>
                <td class="card-count">${stat.remaining}/${stat.total}</td>
            </tr>
        `
        )
        .join("");
    };

    this.element.innerHTML = `
        <div class="deck-info-panel">
            <div class="deck-info-header">
                <h3>Deck List (${info.player === "me" ? "My" : "Opponent"})</h3>
                <button class="close-btn">Close</button>
            </div>
            <div class="deck-info-content">
                ${
                  characterCards.length > 0
                    ? `
                <div class="deck-group">
                    <h4 class="deck-group-header">角色卡 Character Cards</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>卡片資訊</th>
                                <th>剩餘/總數</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderCardRows(characterCards)}
                        </tbody>
                    </table>
                </div>
                `
                    : ""
                }
                ${
                  eventCards.length > 0
                    ? `
                <div class="deck-group">
                    <h4 class="deck-group-header">事件卡 Event Cards</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>卡片資訊</th>
                                <th>剩餘/總數</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderCardRows(eventCards)}
                        </tbody>
                    </table>
                </div>
                `
                    : ""
                }
            </div>
        </div>
      `;

    this.element.querySelector(".close-btn")?.addEventListener("click", () => {
      this.store.setState({ viewingDeckInfo: null });
    });
  }

  private renderCardDetails(card: Card) {
    const isEvent = card.type === "EVENT";

    const statsHtml = !isEvent
      ? `
        <div class="detail-stats">
          <div class="detail-stat"><span>Serve</span><span>${renderBlockBar(
            card.stats?.serve,
            true // Show value in detail panel
          )}</span></div>
          <div class="detail-stat"><span>Block</span><span>${renderBlockBar(
            card.stats?.block,
            true
          )}</span></div>
          <div class="detail-stat"><span>Receive</span><span>${renderBlockBar(
            card.stats?.receive,
            true
          )}</span></div>
          <div class="detail-stat"><span>Toss</span><span>${renderBlockBar(
            card.stats?.toss,
            true
          )}</span></div>
          <div class="detail-stat"><span>Attack</span><span>${renderBlockBar(
            card.stats?.attack,
            true
          )}</span></div>
        </div>
      `
      : ``;

    this.element.innerHTML = `
      <div class="detail-content ${isEvent ? "event" : "character"}">
        <div class="detail-header">
          <h2>${card.name}</h2>
          <div class="detail-id">${card.id}</div>
          <div class="detail-meta">
              ${
                card.rarity
                  ? `<span class="rarity">稀有度: ${card.rarity}</span>`
                  : ""
              }
              ${card.role ? `<span class="role">位置: ${card.role}</span>` : ""}
          </div>
        </div>
        ${statsHtml}
        <div class="detail-text">
          <div class="detail-text-header">
            <h3>技能</h3>
            ${
              card.timing && card.timing !== "-"
                ? `<div class="timing-badges">${this.renderTimingBadges(
                    card.timing
                  )}</div>`
                : ""
            }
          </div>
          <p>${card.skill || card.description || "無技能"}</p>
          ${
            card.note && card.note !== "-"
              ? `<h3>注釋</h3><p>${card.note}</p>`
              : ""
          }
        </div>
      </div>
    `;
  }

  private renderTimingBadges(timing: string): string {
    if (!timing || timing === "-") return "";

    const timings = timing.split(",").map((t) => t.trim());
    const badges = timings.map((t) => {
      return `<span class="timing-badge">${t}</span>`;
    });

    return badges.join("");
  }

  private render() {
    this.element.innerHTML = `
      <div class="placeholder">
        <h3>Card Details</h3>
        <p>Click a card to view details.</p>
      </div>
    `;
  }

  public getElement(): HTMLElement {
    return this.element;
  }
}

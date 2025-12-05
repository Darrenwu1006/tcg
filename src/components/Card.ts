import { Card as CardType } from "../state/Store";

export class Card {
  static render(
    card: CardType,
    isBack: boolean = false,
    school: string = "烏野"
  ): string {
    const getSchoolClass = (schoolName: string): string => {
      switch (schoolName) {
        case "青葉城西":
          return "seijoh";
        case "烏野":
          return "karasuno";
        case "音駒":
          return "nekoma";
        case "梟谷":
          return "fukurodani";
        case "混合學校":
          return "mixed";
        default:
          return "karasuno";
      }
    };

    // Use card's own school for front face, player's school for back
    // This allows mixed school decks to show cards in their respective colors
    const cardSchool = isBack ? school : card.school || school;
    const schoolClass = getSchoolClass(cardSchool);

    if (isBack) {
      return `
        <div class="card back ${schoolClass}">
          <div class="card-back-design">
          </div>
        </div>
      `;
    }

    const isEvent = card.type === "EVENT";
    const stats = card.stats || {
      serve: 0,
      block: 0,
      receive: 0,
      toss: 0,
      attack: 0,
    };

    const renderBlockBar = (value: number | null | undefined): string => {
      const val = value === null ? 0 : value ?? 0;
      const maxBlocks = 6;
      const filledBlocks = Math.min(Math.max(val, 0), maxBlocks);
      const emptyBlocks = maxBlocks - filledBlocks;

      let blocksHtml = '<div class="block-bar-container">';
      for (let i = 0; i < filledBlocks; i++) {
        blocksHtml += '<div class="block filled"></div>';
      }
      for (let i = 0; i < emptyBlocks; i++) {
        blocksHtml += '<div class="block empty"></div>';
      }
      blocksHtml += "</div>";

      return blocksHtml;
    };

    const statsHtml = !isEvent
      ? `
        <div class="card-stats">
          <div class="stat">S: ${renderBlockBar(stats.serve)}</div>
          <div class="stat">B: ${renderBlockBar(stats.block)}</div>
          <div class="stat">R: ${renderBlockBar(stats.receive)}</div>
          <div class="stat">T: ${renderBlockBar(stats.toss)}</div>
          <div class="stat">A: ${renderBlockBar(stats.attack)}</div>
        </div>
      `
      : ``;

    return `
      <div class="card ${
        isEvent ? "event" : "character"
      } ${schoolClass}" data-id="${card.id}">
        <div class="card-header">
          <div class="card-name">${card.name}</div>
        </div>
        ${statsHtml}
      </div>
    `;
  }
}

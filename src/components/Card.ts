import { Card as CardType } from "../state/Store";
import { getSchoolClass } from "../constants/schools";
import { renderBlockBar } from "../utils/renderHelpers";

export class Card {
  static render(
    card: CardType,
    isBack: boolean = false,
    school: string = "烏野"
  ): string {
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

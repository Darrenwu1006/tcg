import { Card as CardType } from "../state/Store";

export class Card {
  static render(
    card: CardType,
    isBack: boolean = false,
    school: string = "karasuno"
  ): string {
    if (isBack) {
      const schoolName =
        school === "seijoh"
          ? "Aoba Johsai"
          : school === "karasuno"
          ? "Karasuno"
          : school === "nekoma"
          ? "Nekoma"
          : school === "fukurodani"
          ? "Fukurodani"
          : "Unknown";
      return `
        <div class="card back ${school}">
          <div class="card-back-design">
             <div class="school-name">${schoolName}</div>
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

    // Helper to render a stat if it exists (non-zero or specific logic)
    // For now, render all stats for characters
    const formatStat = (val: number | null | undefined) =>
      val === null ? "-" : val ?? 0;

    const statsHtml = !isEvent
      ? `
        <div class="card-stats">
          <div class="stat serve">S:${formatStat(stats.serve)}</div>
          <div class="stat block">B:${formatStat(stats.block)}</div>
          <div class="stat receive">R:${formatStat(stats.receive)}</div>
          <div class="stat toss">T:${formatStat(stats.toss)}</div>
          <div class="stat attack">A:${formatStat(stats.attack)}</div>
        </div>
      `
      : ``;

    return `
      <div class="card ${isEvent ? "event" : "character"}" data-id="${card.id}">
        <div class="card-header">
          <div class="card-name">${card.name}</div>
        </div>
        ${statsHtml}
      </div>
    `;
  }
}

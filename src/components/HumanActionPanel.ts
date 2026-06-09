import { GameAction } from "../engine/Actions";
import { EngineGameState } from "../engine/GameState";
import { AppState, Card, Store } from "../state/Store";
import { HumanVsAIController } from "../services/HumanVsAIController";
import {
  describeGameAction,
  getPhaseDescription,
} from "../services/StateConverter";

type ActionGroup = {
  title: string;
  actions: GameAction[];
};

export class HumanActionPanel {
  private element: HTMLElement;

  constructor(
    private store: Store<AppState>,
    private controller: HumanVsAIController
  ) {
    this.element = document.createElement("div");
    this.element.className = "human-action-panel";
    this.store.subscribe(() => this.render());
    this.render();
  }

  private render(): void {
    const appState = this.store.getState();
    const engineState = this.controller.getEngineState();

    if (appState.playMode !== "vsComputer" || !engineState) {
      this.element.classList.add("hidden");
      this.element.innerHTML = "";
      return;
    }

    this.element.classList.remove("hidden");

    const isHumanTurn = engineState.turnPlayer === "me";
    const actions = this.controller.getLegalHumanActions();
    const phaseLabel = getPhaseDescription(engineState.phase);
    const selectedCard = appState.playingCard;
    const selectedActions = selectedCard
      ? actions.filter((action) => this.actionUsesCard(action, selectedCard))
      : [];
    const remainingActions =
      selectedActions.length > 0
        ? actions.filter((action) => !selectedActions.includes(action))
        : actions;

    this.element.innerHTML = `
      <div class="human-action-header">
        <span>Vs Computer</span>
        <strong>${phaseLabel}</strong>
      </div>
      <div class="human-turn-summary">
        <span>你：手牌 ${appState.me.hand.length} / 牌庫 ${appState.me.deck.length} / Drop ${appState.me.drop.length}</span>
        <span>AI：手牌 ${appState.opponent.hand.length} / 牌庫 ${appState.opponent.deck.length} / Drop ${appState.opponent.drop.length}</span>
      </div>
      <div class="human-action-status">${this.getStatusText(
        engineState,
        isHumanTurn
      )}</div>
      ${selectedCard ? `<div class="human-selected-card"></div>` : ""}
      <div class="human-action-content"></div>
    `;

    const selectedCardElement = this.element.querySelector(
      ".human-selected-card"
    );
    if (selectedCardElement && selectedCard) {
      selectedCardElement.textContent = `已選：${selectedCard.name}`;
    }

    const content = this.element.querySelector(".human-action-content");
    if (!content) return;

    if (!isHumanTurn) {
      const runBtn = document.createElement("button");
      runBtn.className = "btn human-action-btn";
      runBtn.textContent = "讓 AI 行動";
      runBtn.addEventListener("click", () => {
        this.controller.runOpponentUntilHuman();
        this.render();
      });
      content.appendChild(runBtn);
      return;
    }

    if (actions.length === 0) {
      content.innerHTML = `<div class="human-action-empty">目前沒有合法動作</div>`;
      return;
    }

    if (selectedCard && selectedActions.length === 0) {
      const empty = document.createElement("div");
      empty.className = "human-action-empty";
      empty.textContent = "這張牌現在沒有合法動作";
      content.appendChild(empty);
    }

    const groups: ActionGroup[] = [];
    if (selectedActions.length > 0) {
      groups.push({ title: "這張牌可以做", actions: selectedActions });
    }
    groups.push(...this.groupActions(remainingActions));

    groups
      .filter((group) => group.actions.length > 0)
      .forEach((group) => {
        const section = document.createElement("section");
        section.className = "human-action-group";

        const title = document.createElement("h3");
        title.textContent = group.title;
        section.appendChild(title);

        const list = document.createElement("div");
        list.className = "human-action-list";

        group.actions.forEach((action) => {
          list.appendChild(this.createActionButton(action, engineState));
        });

        section.appendChild(list);
        content.appendChild(section);
      });
  }

  private createActionButton(
    action: GameAction,
    engineState: EngineGameState
  ): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "btn human-action-btn";

    const label = document.createElement("span");
    label.className = "human-action-label";
    label.textContent = this.getActionLabel(action);
    button.appendChild(label);

    const meta = this.getActionMeta(action, engineState);
    if (meta) {
      const metaElement = document.createElement("span");
      metaElement.className = "human-action-meta";
      metaElement.textContent = meta;
      button.appendChild(metaElement);
    }

    button.addEventListener("click", () => {
      this.controller.executeHumanAction(action);
      this.controller.runOpponentUntilHuman();
      this.render();
    });
    return button;
  }

  private getActionLabel(action: GameAction): string {
    const engineState = this.controller.getEngineState();
    if (!engineState) return action.type;

    const card = this.getPrimaryCard(action, engineState);

    switch (action.type) {
      case "PLAY_SERVE":
        return `用 ${card?.name || "這張牌"} 發球`;
      case "CHOOSE_DEFENSE":
        return action.choice === "block" ? "這球用攔網處理" : "這球用接球處理";
      case "PLAY_BLOCK":
        return `用 ${this.getBlockNames(action, engineState)} 攔網`;
      case "PLAY_RECEIVE":
        return `用 ${card?.name || "這張牌"} 接球`;
      case "PLAY_TOSS":
        return `用 ${card?.name || "這張牌"} 托球`;
      case "PLAY_ATTACK":
        return `用 ${card?.name || "這張牌"} 攻擊`;
      case "ACTIVATE_SKILL":
        return `發動 ${card?.name || "這張牌"} 的技能`;
      case "USE_EVENT":
        return `使用事件：${card?.name || "這張牌"}`;
      case "MULLIGAN":
        return `調整 ${action.cardInstanceIds.length} 張手牌`;
      case "DECLARE_LOST":
        return "宣告 Lost";
      case "PASS":
        return engineState.phase === "setup" ? "不調整手牌" : "繼續流程";
      default:
        return describeGameAction(action, engineState);
    }
  }

  private getActionMeta(
    action: GameAction,
    engineState: EngineGameState
  ): string | null {
    const stat = this.getActionStat(action, engineState);
    if (!stat) return null;
    return stat;
  }

  private getActionStat(
    action: GameAction,
    engineState: EngineGameState
  ): string | null {
    const card = this.getPrimaryCard(action, engineState);
    if (!card?.stats) return null;

    switch (action.type) {
      case "PLAY_SERVE":
        return card.stats.serve !== null ? `Serve ${card.stats.serve}` : null;
      case "PLAY_RECEIVE":
        return card.stats.receive !== null
          ? `Receive ${card.stats.receive}`
          : null;
      case "PLAY_TOSS":
        return card.stats.toss !== null ? `Toss ${card.stats.toss}` : null;
      case "PLAY_ATTACK":
        return card.stats.attack !== null ? `Attack ${card.stats.attack}` : null;
      case "PLAY_BLOCK": {
        const total = action.cardInstanceIds.reduce((sum, id) => {
          const blockCard = this.findCardByInstanceId(engineState, id);
          return sum + (blockCard?.stats?.block ?? 0);
        }, 0);
        return `Block ${total}`;
      }
      default:
        return null;
    }
  }

  private getStatusText(
    engineState: EngineGameState,
    isHumanTurn: boolean
  ): string {
    if (!isHumanTurn) return "AI 正在處理對手回合";

    switch (engineState.phase) {
      case "setup":
        return "開局調整手牌，決定要不要重抽。";
      case "serve":
        return "輪到你發球，選一張有發球數值的角色。";
      case "start":
        return "選擇這球要用攔網還是接球處理。";
      case "block":
        return "選 1 到 3 張角色進行攔網。";
      case "draw":
        return "接球軸流程推進中。";
      case "receive":
        return "選一張角色接球。";
      case "toss":
        return "選一張角色托球。";
      case "attack":
        return "選一張角色攻擊。";
      case "end":
        return "這回合收尾，繼續到下一步。";
      default:
        return "輪到你行動。";
    }
  }

  private groupActions(actions: GameAction[]): ActionGroup[] {
    const groups: ActionGroup[] = [
      { title: "主要行動", actions: [] },
      { title: "防守選擇", actions: [] },
      { title: "調整與流程", actions: [] },
    ];

    actions.forEach((action) => {
      if (
        [
          "PLAY_SERVE",
          "PLAY_BLOCK",
          "PLAY_RECEIVE",
          "PLAY_TOSS",
          "PLAY_ATTACK",
          "ACTIVATE_SKILL",
          "USE_EVENT",
        ].includes(action.type)
      ) {
        groups[0].actions.push(action);
      } else if (action.type === "CHOOSE_DEFENSE") {
        groups[1].actions.push(action);
      } else {
        groups[2].actions.push(action);
      }
    });

    return groups;
  }

  private actionUsesCard(action: GameAction, card: Card): boolean {
    switch (action.type) {
      case "PLAY_SERVE":
      case "PLAY_RECEIVE":
      case "PLAY_TOSS":
      case "PLAY_ATTACK":
      case "ACTIVATE_SKILL":
      case "USE_EVENT":
        return action.cardInstanceId === card.instanceId;
      case "PLAY_BLOCK":
        return action.cardInstanceIds.includes(card.instanceId);
      case "MULLIGAN":
        return action.cardInstanceIds.includes(card.instanceId);
      default:
        return false;
    }
  }

  private getPrimaryCard(
    action: GameAction,
    engineState: EngineGameState
  ): Card | undefined {
    switch (action.type) {
      case "PLAY_SERVE":
      case "PLAY_RECEIVE":
      case "PLAY_TOSS":
      case "PLAY_ATTACK":
      case "ACTIVATE_SKILL":
      case "USE_EVENT":
        return this.findCardByInstanceId(engineState, action.cardInstanceId);
      case "PLAY_BLOCK":
        return this.findCardByInstanceId(engineState, action.cardInstanceIds[0]);
      default:
        return undefined;
    }
  }

  private getBlockNames(
    action: Extract<GameAction, { type: "PLAY_BLOCK" }>,
    engineState: EngineGameState
  ): string {
    return action.cardInstanceIds
      .map((id) => this.findCardByInstanceId(engineState, id)?.name || "卡片")
      .join(" + ");
  }

  private findCardByInstanceId(
    engineState: EngineGameState,
    instanceId: string
  ): Card | undefined {
    const zones = [
      engineState.me.hand,
      engineState.me.field,
      engineState.me.drop,
      engineState.me.set,
      engineState.me.deck,
      engineState.opponent.hand,
      engineState.opponent.field,
      engineState.opponent.drop,
      engineState.opponent.set,
      engineState.opponent.deck,
    ];

    for (const zone of zones) {
      const card = zone.find((candidate) => candidate.instanceId === instanceId);
      if (card) return card;
    }

    return undefined;
  }

  getElement(): HTMLElement {
    return this.element;
  }
}

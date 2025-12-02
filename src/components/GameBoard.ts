import { Store, AppState } from "../state/Store";
import { PlayerZone } from "./PlayerZone";

export class GameBoard {
  private element: HTMLElement;
  private store: Store<AppState>;
  private opponentZone: PlayerZone;
  private meZone: PlayerZone;

  constructor(store: Store<AppState>) {
    this.store = store;
    this.element = document.createElement("div");
    this.element.className = "game-board";

    this.opponentZone = new PlayerZone("opponent", this.store);
    this.meZone = new PlayerZone("me", this.store);

    this.render();
    this.setupSubscription();
  }

  private setupSubscription() {
    this.store.subscribe((state) => {
      this.updatePerspective(state.viewPerspective);
    });
  }

  private updatePerspective(perspective: "me" | "opponent") {
    if (perspective === "opponent") {
      this.element.classList.add("rotated");
    } else {
      this.element.classList.remove("rotated");
    }
  }

  private render() {
    this.element.appendChild(this.opponentZone.getElement());

    const net = document.createElement("div");
    net.className = "net";
    this.element.appendChild(net);

    this.element.appendChild(this.meZone.getElement());

    // Switch View Button (Temporary placement)
    const switchBtn = document.createElement("button");
    switchBtn.className = "switch-view-btn";
    switchBtn.innerText = "Switch View";
    switchBtn.onclick = () => {
      const current = this.store.getState().viewPerspective;
      this.store.setState({
        viewPerspective: current === "me" ? "opponent" : "me",
      });
    };
    document.body.appendChild(switchBtn); // Append to body to stay fixed
  }

  getElement(): HTMLElement {
    return this.element;
  }
}

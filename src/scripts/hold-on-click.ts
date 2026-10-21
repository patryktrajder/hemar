export default class HoldOnClick {
  constructor(private readonly container: HTMLElement) {
    container.addEventListener("click", this.toggle);
  }

  private toggle = () => {
    this.container.classList.toggle("hold");
  };
}

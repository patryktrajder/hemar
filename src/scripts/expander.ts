import Constants from "./constants";
import Utils from "./utils";

export default class Expander {
  private readonly button: HTMLButtonElement;
  private readonly svgUse: SVGUseElement;
  private readonly container: HTMLElement;
  private isExpanded: boolean = false;

  constructor(private readonly expander: HTMLElement) {
    this.button = expander.querySelector("button") as HTMLButtonElement;
    this.container = expander.querySelector(".container") as HTMLElement;
    this.svgUse = expander.querySelector("use") as SVGUseElement;

    this.button.setAttribute("aria-label", "Show more");
    this.button.addEventListener("click", this.toggle);
    addEventListener("resize", this.handleWindowResize);
  }

  private toggle = () => {
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded) {
      this.button.setAttribute("aria-label", "Show less");
      this.container.style.height = this.container.scrollHeight + "px";
      this.svgUse.href.baseVal = "#icon-chevron-up";
    } else {
      this.button.setAttribute("aria-label", "Show more");
      this.container.style.height = Constants.expanderMinHeight + "rem";
      this.svgUse.href.baseVal = "#icon-chevron-down";
      if (window.scrollY > this.expander.offsetTop)
        window.scrollTo(
          window.scrollX,
          this.expander.offsetTop - Utils.remToPx(Constants.headerMinHeight)
        );
    }
  };

  private handleWindowResize = () => {
    if (this.isExpanded) {
      this.container.style.height = "auto";
      this.container.style.height = this.container.scrollHeight + "px";
    }
  };
}

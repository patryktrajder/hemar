import Utils from "./utils";

export default class LanguageDropdown {
  private readonly dropArrow: SVGUseElement;
  private readonly list: HTMLElement;
  private isExpanded: boolean = false;

  constructor(dropdown: HTMLElement) {
    let currentLanguage = dropdown.querySelector("button") as HTMLButtonElement;
    this.dropArrow = currentLanguage.querySelector(
      ".arrow use"
    ) as SVGUseElement;
    this.list = dropdown.querySelector(".list") as HTMLElement;

    currentLanguage.addEventListener("click", this.toggle);

    for (let i = 0; i < this.list.childElementCount; i++) {
      let flagButton = this.list.children[i] as HTMLElement;
      let language = flagButton.dataset.lang as string;
      flagButton.addEventListener("click", () => this.changeLanguage(language));
    }
  }

  public static getLanguage(): string {
    if (location.pathname.substr(0, 7) === "/en-gb/") return "en-gb";
    else if (location.pathname.substr(0, 4) === "/de/") return "de";
    else return "pl";
  }

  private changeLanguage(language: string): any {
    let url;
    if (language === "pl") {
      let index = Utils.nthIndex(window.location.pathname, "/", 2);
      url = window.location.pathname.substr(index);
    } else if (LanguageDropdown.getLanguage() == "pl") {
      url = "/" + language + window.location.pathname;
    } else {
      let index = Utils.nthIndex(window.location.pathname, "/", 2);
      url = "/" + language + window.location.pathname.substr(index);
    }
    window.location.href = url + window.location.search;
  }

  private toggle = () => {
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded) {
      this.list.style.height = this.list.scrollHeight + "px";
      this.dropArrow.href.baseVal = "#icon-arrow-drop-up";
    } else {
      this.list.style.height = "0";
      this.dropArrow.href.baseVal = "#icon-arrow-drop-down";
    }
  };
}

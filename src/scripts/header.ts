import Constants from "./constants";
import Utils from "./utils";

export default class Header {
  private readonly menu: HTMLElement;
  private readonly navigation: HTMLElement;
  private readonly mediaQuery: MediaQueryList;
  private readonly wrapper: HTMLDivElement;
  private headerHeight: number;
  private isMenuHorizontal: boolean = false;
  private isOpen: boolean = false;

  constructor(private readonly header: HTMLElement) {
    this.wrapper = header.querySelector("div") as HTMLDivElement;
    this.menu = this.wrapper.querySelector(".menu") as HTMLElement;
    this.navigation = this.menu.querySelector("nav") as HTMLElement;
    const menuButton = this.menu.querySelector(
      ".menu-button"
    ) as HTMLButtonElement;
    const anchors = this.navigation.querySelectorAll("a");

    this.mediaQuery = window.matchMedia(
      "(max-width: " + Constants.headerMenuWidthThreshold + "px)"
    );
    this.headerHeight = this.getInitialHeaderHeight();

    this.navigation.addEventListener("transitionend", this.onToggled);
    menuButton.addEventListener("click", this.toggle);

    for (let i = 0; i < anchors.length; i++)
      anchors[i].addEventListener("click", this.handleAnchorClick);

    this.handleHeaderHeightChange();
    setTimeout(() => {
      this.mediaQuery.addEventListener("change", this.handleMediaQueryChange);
      document.addEventListener("scroll", this.handleHeaderHeightChange);
      setTimeout(() => header.classList.add("animate"));
    }); // wait for header to render
  }

  private getInitialHeaderHeight = () => {
    const remScale = Utils.remToPx(1);
    let headerMaxHeight;

    if (this.mediaQuery.matches)
      headerMaxHeight = Constants.headerMaxHeightMobile;
    else headerMaxHeight = Constants.headerMaxHeightDesktop;

    return Math.max(
      headerMaxHeight * remScale - window.pageYOffset,
      Constants.headerMinHeight * remScale
    );
  };

  private handleAnchorClick = () => {
    if (this.mediaQuery.matches) this.toggle();
  };

  private handleMediaQueryChange = () => {
    this.header.classList.remove("animate");
    this.handleHeaderHeightChange();
    getComputedStyle(this.navigation).transition;
    this.header.classList.add("animate");
  };
  private handleHeaderHeightChange = () => {
    const remScale = Utils.remToPx(1);
    const headerMinHeight = Constants.headerMinHeight * remScale;
    let headerMaxHeight;

    if (this.mediaQuery.matches)
      headerMaxHeight = Constants.headerMaxHeightMobile;
    else headerMaxHeight = Constants.headerMaxHeightDesktop;

    this.headerHeight = Math.max(
      headerMaxHeight * remScale - window.pageYOffset,
      headerMinHeight
    );

    if (this.headerHeight <= headerMinHeight) {
      this.wrapper.style.removeProperty("padding-bottom");
      if (this.mediaQuery.matches) {
        this.isMenuHorizontal = false;
        this.header.classList.remove("horizontal");
      } else if (!this.isMenuHorizontal) {
        this.isMenuHorizontal = true;
        this.header.classList.add("horizontal");
      }
    } else {
      this.isMenuHorizontal = false;
      this.header.classList.remove("horizontal");
      if (!this.mediaQuery.matches) {
        this.wrapper.style.paddingBottom =
          ((Constants.headerDivMaxPaddingBottom -
            Constants.headerDivMinPaddingBottom) *
            (this.headerHeight - headerMinHeight)) /
            ((Constants.headerMaxHeightDesktop - Constants.headerMinHeight) *
              remScale) +
          Constants.headerDivMinPaddingBottom +
          "rem";
      }
    }

    this.header.style.height = this.headerHeight + "px";
  };

  private onToggled = () => {
    if (this.isOpen) {
      this.navigation.style.overflow = "auto";
      this.navigation.classList.add("opened");
    }
  };

  private toggle = () => {
    document.body.classList.toggle("hide-overflow");
    this.menu.classList.toggle("open");
    this.navigation.style.removeProperty("overflow");

    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.navigation.style.height =
        "calc((100vh - " + this.headerHeight + "px)";
    } else {
      this.navigation.style.removeProperty("height");
      this.navigation.classList.remove("opened");
    }
  };
}

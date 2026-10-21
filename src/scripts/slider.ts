import Constants from "./constants";
import Utils from "./utils";

export interface ISliderOptions {
  isCyclic: boolean;
  showNavDots: boolean;
  slideDuration: number;
  snapItems: boolean;
}

const defaultOptions: ISliderOptions = {
  isCyclic: false,
  showNavDots: false,
  slideDuration: 0,
  snapItems: true
};

// items should have the same width
// snapItems == false with arrows not supported
// cyclic lists with items narrower than items container not supported
export default class Slider {
  private readonly firstItem: HTMLElement;
  private readonly items: HTMLElement;
  private readonly leftArrow?: HTMLElement;
  private readonly rightArrow?: HTMLElement;
  private readonly navDots?: HTMLUListElement;
  private readonly nItems: number;
  private readonly options: ISliderOptions;
  private readonly secondItem: HTMLElement;
  private readonly wrapper: HTMLElement;
  private abortClick: boolean = false;
  private contentWidth: number = 0;
  private contentWidthMod: number = 0;
  private currentIndex: number = 0;
  private isGrabbing: boolean = false;
  private isTimerSet: boolean = false;
  private isTimerStopped: boolean = false;
  private itemWidthWithGap: number = 0;
  private lastIndex: number = 0;
  private lastItemOverflow: number = 0;
  private minMarginLeft: number = 0;
  private nAddedCopiesLeft: number = 0;
  private nAddedCopiesRight: number = 0;
  private previousItemWidthWithGap: number = 0;
  private previousOffset: number = 0;
  private realCurrentIndex: number = 0;
  private sliding: boolean = false;
  private startMarginLeft: number = 0;
  private startX: number = 0;
  private timer?: number;

  constructor(
    private readonly slider: HTMLElement,
    options?: Partial<ISliderOptions>
  ) {
    this.options = { ...defaultOptions, ...options };
    this.wrapper = slider.querySelector(".wrapper") as HTMLElement;
    this.items = this.wrapper.querySelector(".items") as HTMLElement;
    this.leftArrow = slider.querySelector(".left") as HTMLElement;
    this.rightArrow = slider.querySelector(".right") as HTMLElement;
    this.nItems = this.items.childElementCount;
    this.firstItem = this.items.children[0] as HTMLElement;
    this.secondItem = this.items.children[1] as HTMLElement;
    this.slider = slider;

    this.handleWindowResize();

    if (this.options.slideDuration > 0) {
      this.timer = window.setTimeout(
        this.autoSlide,
        this.options.slideDuration
      );
      this.isTimerSet = true;
      slider.addEventListener("pointerenter", this.handlePointerEnter);
      slider.addEventListener("pointerleave", this.handlePointerLeave);
    }

    if (this.options.showNavDots) {
      this.navDots = slider.querySelector("ul") as HTMLUListElement;
      this.setUpNavDots();
    }

    this.setUpArrows();
    this.items.addEventListener(
      "transitionend",
      this.handleFirstPictureTransitionEnd
    );
    this.items.addEventListener("dragstart", (e) => {
      e.preventDefault();
    });
    addEventListener("resize", this.handleWindowResize);
  }

  public update(): void {
    this.handleWindowResize();
  }

  private autoSlide = () => {
    this.slideRight(1);
  };

  private beforeSlide = (newIndex: number) => {
    this.updateNavDots(newIndex);
    this.currentIndex = newIndex;
    if (this.options.slideDuration > 0) {
      clearTimeout(this.timer);
      this.isTimerSet = false;
    }
  };

  private calculateContentWidth = (itemWidthWithGap: number): number => {
    return (
      this.firstItem.clientWidth +
      itemWidthWithGap * (this.items.childElementCount - 1)
    );
  };

  private calculateItemWidthWithGap = (): number => {
    const itemMarginLeft = parseFloat(
      getComputedStyle(this.secondItem).marginLeft
    );
    return this.firstItem.clientWidth + itemMarginLeft;
  };

  private calculateLastIndex = (
    itemWidthWithGap: number,
    minMarginLeft: number
  ): number => {
    return Math.ceil(-minMarginLeft / itemWidthWithGap);
  };

  private calculateLastItemOverflow = (itemWidthWithGap: number): number => {
    return (
      itemWidthWithGap -
      ((this.items.clientWidth - this.firstItem.clientWidth) % itemWidthWithGap)
    );
  };

  private calculateMinMarginLeft = (contentWidth: number): number => {
    const minMargin = this.items.clientWidth - contentWidth;
    if (minMargin > 0) return 0;
    return minMargin;
  };

  private calculateIndex = (marginLeft: number): number => {
    return this.calculateRealIndex(marginLeft) % this.nItems;
  };

  private calculateRealIndex = (
    marginLeft: number,
    offset: number = 0
  ): number => {
    if (
      !this.options.isCyclic &&
      marginLeft - this.minMarginLeft < this.lastItemOverflow / 2
    )
      return ~~(
        -marginLeft / this.itemWidthWithGap +
        offset +
        1 -
        this.lastItemOverflow / this.itemWidthWithGap / 2
      );
    return ~~(-marginLeft / this.itemWidthWithGap + offset + 0.5);
  };

  private changeMarginLeftWithoutTransition = (newMarginLeft: number) => {
    this.items.classList.add("notransition");
    this.items.style.marginLeft = newMarginLeft + "px";
    getComputedStyle(this.items).marginLeft; // flush pending style changes
    this.items.classList.remove("notransition");
  };

  private drag = (offset: number) => {
    this.previousOffset = offset;

    let marginLeft = this.startMarginLeft + offset;
    if (this.options.isCyclic) {
      marginLeft = Utils.modNeg(marginLeft, this.contentWidthMod);
    } else {
      if (marginLeft < this.minMarginLeft) marginLeft = this.minMarginLeft;
      else if (marginLeft > 0) marginLeft = 0;

      this.updateArrows(marginLeft);
    }
    this.items.style.marginLeft = marginLeft + "px";

    const newIndex = this.calculateIndex(marginLeft);
    this.updateNavDots(newIndex);
    this.currentIndex = newIndex;
  };

  private dragEnd = (offset: number) => {
    this.previousOffset = 0;

    this.isGrabbing = false;
    this.items.classList.remove("notransition");
    this.items.style.transitionTimingFunction = "ease-out";

    if (!this.options.snapItems) return;

    let dragSlideTreshold = Constants.dragSlideThreshold;
    let snapTreshold = 0.5;
    let marginLeft = this.startMarginLeft + offset;
    if (this.options.isCyclic) {
      marginLeft = Utils.modNeg(marginLeft, this.contentWidthMod);
    } else {
      if (marginLeft < this.minMarginLeft) marginLeft = this.minMarginLeft;
      else if (marginLeft > 0) marginLeft = 0;

      if (marginLeft - this.itemWidthWithGap < this.minMarginLeft) {
        const lastItemInvisiblePart =
          this.lastItemOverflow / this.itemWidthWithGap;
        snapTreshold = lastItemInvisiblePart / 2;
        if (snapTreshold < Constants.dragSlideThreshold)
          dragSlideTreshold = snapTreshold;
      }
    }

    const partialIndex = -marginLeft / this.itemWidthWithGap;
    const offsetRatio = offset / this.itemWidthWithGap;
    let additionalOffset = 0;
    if (offsetRatio > dragSlideTreshold) additionalOffset = -0.5;
    else if (offsetRatio < -dragSlideTreshold) additionalOffset = 0.5;

    this.realCurrentIndex = this.calculateRealIndex(marginLeft);
    let newRealIndex = this.calculateRealIndex(marginLeft, additionalOffset);

    setTimeout(() => {
      if (this.realCurrentIndex > newRealIndex) this.slideLeft(1);
      else if (this.realCurrentIndex < newRealIndex) this.slideRight(1);
      else if (partialIndex - ~~partialIndex > snapTreshold) this.slideRight(0);
      else this.slideLeft(0);

      this.items.addEventListener("transitionend", this.handleTransitionEnd);
    });
  };

  private dragStart = () => {
    this.contentWidthMod = this.nItems * this.itemWidthWithGap;
    this.isGrabbing = true;
    this.sliding = true;
    this.startMarginLeft = parseFloat(getComputedStyle(this.items).marginLeft);

    if (this.options.isCyclic) {
      this.startMarginLeft += this.nAddedCopiesLeft * this.itemWidthWithGap;
      this.startMarginLeft = Utils.modNeg(
        this.startMarginLeft,
        this.contentWidthMod
      );

      this.removeCopies();
      const firstItemCopy = this.firstItem.cloneNode(true) as HTMLElement;
      this.items.insertBefore(firstItemCopy, null);
      this.nAddedCopiesRight++;
    } else {
      this.updateArrows(this.startMarginLeft);
      this.handleFirstPictureTransitionEnd();
    }

    const newIndex = this.calculateIndex(this.startMarginLeft);
    this.updateNavDots(newIndex);
    this.currentIndex = newIndex;

    this.items.style.marginLeft = this.startMarginLeft + "px";
    this.items.classList.add("notransition");
  };

  private handleClick = (e: MouseEvent) => {
    if (this.abortClick) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  private handleDragEnd = (e: PointerEvent) => {
    this.wrapper.classList.remove("dragging");
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    this.wrapper.removeEventListener(
      "pointermove",
      this.handlePointerMove,
      true
    );
    this.wrapper.removeEventListener("pointerup", this.handleDragEnd, true);
    this.wrapper.removeEventListener(
      "lostpointercapture",
      this.handleDragEnd,
      true
    );

    let offset;
    if (e.type === "lostpointercapture") offset = this.previousOffset;
    else offset = e.x - this.startX;

    this.dragEnd(offset);
  };

  private handleNavDotClick = (li: HTMLLIElement) => {
    let index = Number(li.dataset.index);
    if (index === this.currentIndex) return;

    let slideBy = index - this.currentIndex;
    if (slideBy < 0) this.slideLeft(-slideBy);
    else this.slideRight(slideBy);
  };

  private handlePointerDown = (e: PointerEvent) => {
    this.abortClick = false;
    this.startX = e.x;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    this.wrapper.addEventListener("pointermove", this.handlePointerMove, true);
    this.wrapper.addEventListener("pointerup", this.handleDragEnd, true);
    this.wrapper.addEventListener(
      "lostpointercapture",
      this.handleDragEnd,
      true
    );
    this.dragStart();
  };

  private handlePointerEnter = () => {
    clearTimeout(this.timer);
    this.isTimerSet = false;
    this.isTimerStopped = true;
  };

  private handlePointerMove = (e: PointerEvent) => {
    const offset = e.x - this.startX;
    if (Math.abs(offset) > Constants.abortClickDistance) {
      this.abortClick = true;
      this.wrapper.classList.add("dragging");
      e.stopPropagation();
      e.preventDefault();
    }
    this.drag(offset);
  };

  private handlePointerLeave = () => {
    if (this.isGrabbing) return;
    this.timer = window.setTimeout(this.autoSlide, this.options.slideDuration);
    this.isTimerSet = true;
    this.isTimerStopped = false;
  };

  private handleFirstPictureTransitionEnd = () => {
    this.items.style.transitionTimingFunction = "ease";
    this.sliding = false;
    if (
      this.options.slideDuration > 0 &&
      !this.isTimerSet &&
      !this.isTimerStopped
    ) {
      this.timer = window.setTimeout(
        this.autoSlide,
        this.options.slideDuration
      );
      this.isTimerSet = true;
    }
  };

  private handleTransitionEnd = () => {
    this.items.removeEventListener("transitionend", this.handleTransitionEnd);

    this.removeCopies();

    if (!this.isGrabbing) {
      let marginLeft = -this.currentIndex * this.itemWidthWithGap;
      if (!this.options.isCyclic && marginLeft < this.minMarginLeft)
        marginLeft = this.minMarginLeft;

      this.realCurrentIndex = this.currentIndex;
      this.changeMarginLeftWithoutTransition(marginLeft);
      this.handleFirstPictureTransitionEnd();
    }
  };

  private handleWindowResize = () => {
    this.itemWidthWithGap = this.calculateItemWidthWithGap();
    this.contentWidth = this.calculateContentWidth(this.itemWidthWithGap);
    this.minMarginLeft = this.calculateMinMarginLeft(this.contentWidth);
    this.lastItemOverflow = this.calculateLastItemOverflow(
      this.itemWidthWithGap
    );
    this.lastIndex = this.calculateLastIndex(
      this.itemWidthWithGap,
      this.minMarginLeft
    );
    let marginLeft;

    if (this.contentWidth < this.items.clientWidth) {
      marginLeft = 0;
      this.wrapper.classList.add("center");
      this.wrapper.removeEventListener(
        "pointerdown",
        this.handlePointerDown,
        true
      );
      this.items.removeEventListener("click", this.handleClick, true);
    } else {
      marginLeft = -this.realCurrentIndex * this.itemWidthWithGap;
      this.wrapper.classList.remove("center");
      this.wrapper.addEventListener(
        "pointerdown",
        this.handlePointerDown,
        true
      );
      this.items.addEventListener("click", this.handleClick, true);
    }

    if (this.sliding) {
      const previousMarginLeft = parseFloat(
        getComputedStyle(this.items).marginLeft
      );
      const midTransitionMarginLeft =
        (previousMarginLeft * this.itemWidthWithGap) /
        this.previousItemWidthWithGap;

      this.changeMarginLeftWithoutTransition(midTransitionMarginLeft);

      if (marginLeft === midTransitionMarginLeft) {
        this.handleTransitionEnd();
      } else {
        this.items.style.marginLeft = marginLeft + "px";
        this.items.style.transitionTimingFunction = "ease-out"; // make it so there is no easily noticable jump in sliding velocity
      }
    } else {
      this.changeMarginLeftWithoutTransition(marginLeft);
    }

    if (!this.options.isCyclic) this.updateArrows(marginLeft);

    this.previousItemWidthWithGap = this.itemWidthWithGap;
  };

  private overflowLeft = (newIndex: number, by: number) => {
    let itemCopy, itemRef;

    let leftMargin = parseFloat(getComputedStyle(this.items).marginLeft);
    leftMargin -= this.itemWidthWithGap;

    for (let i = by; i > 1; i--) {
      itemRef = this.items.children[this.nAddedCopiesLeft + newIndex + by - 1];
      itemCopy = itemRef.cloneNode(true) as HTMLElement;
      this.items.insertBefore(itemCopy, this.items.firstChild);
      leftMargin -= this.itemWidthWithGap;
    }

    itemRef = this.items.children[this.nAddedCopiesLeft + newIndex + by - 1];
    itemCopy = itemRef.cloneNode(true) as HTMLElement;

    if (this.nAddedCopiesLeft > 0)
      this.items.style.transitionTimingFunction = "ease-out"; // make it so there is no easily noticable jump in sliding velocity
    this.items.insertBefore(itemCopy, this.items.firstChild);
    this.changeMarginLeftWithoutTransition(leftMargin);
    this.items.style.marginLeft = "0";

    this.nAddedCopiesLeft += by;

    this.items.addEventListener("transitionend", this.handleTransitionEnd);
  };

  private overflowRight = (newIndex: number, by: number) => {
    for (let i = by - 1; i >= 0; i--) {
      let itemRef = this.items.children[this.nAddedCopiesLeft + newIndex - i];
      let itemCopy = itemRef.cloneNode(true) as HTMLElement;
      this.items.insertBefore(itemCopy, null);
    }

    this.items.style.marginLeft =
      -this.realCurrentIndex * this.itemWidthWithGap + "px";
    if (this.nAddedCopiesRight > 0)
      this.items.style.transitionTimingFunction = "ease-out"; // make it so there is no easily noticable jump in sliding velocity

    this.nAddedCopiesRight += by;

    this.items.addEventListener("transitionend", this.handleTransitionEnd);
  };

  private setUpArrows = () => {
    this.leftArrow?.addEventListener("click", () => {
      this.slideLeft(1);
      this.items.style.transitionTimingFunction = "ease-out";
    });
    this.rightArrow?.addEventListener("click", () => {
      this.slideRight(1);
      this.items.style.transitionTimingFunction = "ease-out";
    });

    if (!this.options.isCyclic) {
      if (this.leftArrow) this.leftArrow.style.display = "none";
      if (this.rightArrow && this.minMarginLeft === 0)
        this.rightArrow.style.display = "none";
    }
  };

  private setUpNavDots = () => {
    const _this: Slider = this;
    let li: HTMLLIElement = document.createElement("li");
    li.className = "circle current";
    li.dataset.index = "0";
    li.addEventListener("click", function () {
      _this.handleNavDotClick(this);
    });
    this.navDots?.appendChild(li);

    for (let i = 1; i < this.nItems; i++) {
      li = document.createElement("li");
      li.className = "circle";
      li.dataset.index = i.toString();
      li.addEventListener("click", function () {
        _this.handleNavDotClick(this);
      });
      this.navDots?.appendChild(li);
    }
  };

  private removeCopies = () => {
    while (this.nAddedCopiesLeft > 0) {
      this.items.removeChild(this.items.children[0]);
      this.nAddedCopiesLeft--;
    }

    while (this.nAddedCopiesRight > 0) {
      this.items.removeChild(this.items.lastChild as ChildNode);
      this.nAddedCopiesRight--;
    }
  };

  private slide = () => {
    let marginLeft = -this.realCurrentIndex * this.itemWidthWithGap;
    if (!this.options.isCyclic) {
      if (marginLeft < this.minMarginLeft) marginLeft = this.minMarginLeft;
      this.updateArrows(marginLeft);
    }

    this.items.style.marginLeft = marginLeft + "px";
    if (this.sliding) this.items.style.transitionTimingFunction = "ease-out";
  };

  private slideLeft = (by: number) => {
    const newIndex = (this.currentIndex - by + this.nItems) % this.nItems;
    this.beforeSlide(newIndex);

    if (this.realCurrentIndex < by) {
      this.overflowLeft(newIndex, by);
    } else {
      this.realCurrentIndex -= by;
      this.slide();
    }
    this.sliding = true;
  };

  private slideRight = (by: number) => {
    let newIndex = (this.currentIndex + by) % this.nItems;
    this.realCurrentIndex += by;
    this.beforeSlide(newIndex);

    if (this.realCurrentIndex >= this.items.childElementCount) {
      this.overflowRight(newIndex, by);
    } else {
      this.slide();
    }
    this.sliding = true;
  };

  private updateArrows = (marginLeft: number) => {
    if (this.leftArrow) {
      if (this.calculateIndex(marginLeft) === 0)
        this.leftArrow.style.display = "none";
      else this.leftArrow.style.removeProperty("display");
    }
    if (this.rightArrow) {
      if (this.calculateIndex(marginLeft) === this.lastIndex)
        this.rightArrow.style.display = "none";
      else this.rightArrow.style.removeProperty("display");
    }
  };

  private updateNavDots = (newIndex: number) => {
    if (!this.options.showNavDots) return;
    this.navDots?.children[this.currentIndex].classList.remove("current");
    this.navDots?.children[newIndex].classList.add("current");
  };
}

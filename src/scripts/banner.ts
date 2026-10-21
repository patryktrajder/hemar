import Constants from "./constants";
import Slider from "./slider";

export default class Banner {
  private readonly nThumbs?: number;
  private readonly slider?: Slider;
  private nLoadedThumbs: number = 0;

  constructor(banner: HTMLElement) {
    const bannerSlider = banner.querySelector(".slider") as HTMLElement;
    if (bannerSlider) {
      this.slider = new Slider(bannerSlider, {
        isCyclic: true,
        showNavDots: true,
        slideDuration: Constants.autoPlaySlideDuration
      });

      const items = bannerSlider.querySelector<HTMLElement>(".items");
      if (items) {
        this.nThumbs = items.childElementCount;
        for (let i = 0; i < this.nThumbs; i++) {
          let thumb = items.children[i] as HTMLImageElement;
          thumb.addEventListener("load", () => this.handleThumbLoad(thumb), {
            once: true
          });
        }
      }
    }
  }

  private handleThumbLoad = (thumb: HTMLImageElement) => {
    this.nLoadedThumbs++;
    if (this.nLoadedThumbs === this.nThumbs) {
      this.slider?.update();
    }
  };
}

import Constants from "./constants";
import Slider from "./slider";

export default class Gallery {
  private readonly previewAspectRatio: number = 0.5625; // 16:9
  private readonly previewAspectRatio4to3: number = 0.75; // 4:3
  private readonly is4to3: boolean;

  private readonly closeButton: HTMLButtonElement;
  private readonly full: HTMLElement;
  private readonly fullContainer: HTMLElement;
  private readonly fullImg: HTMLImageElement;
  private readonly nThumbs?: number;
  private readonly preview: HTMLDivElement;
  private readonly previewImg: HTMLImageElement;
  private readonly previewImgOverlay: HTMLDivElement;
  private readonly previewImgWrapper: HTMLDivElement;
  private readonly previewArrowLeft?: HTMLButtonElement;
  private readonly previewArrowRight?: HTMLButtonElement;
  private readonly slider?: Slider;

  private abortClick: boolean = false;
  private isGrabbing: boolean = false;
  private nLoadedThumbs: number = 0;
  private startLeft: number = 0;
  private startTop: number = 0;
  private startX: number = 0;
  private startY: number = 0;
  private currentIndex: number = 0;
  private thumbs: HTMLImageElement[] = [];

  constructor(private readonly gallery: Element) {
    this.is4to3 = gallery.classList.contains("gallery--4to3");

    this.full = gallery.querySelector(".full") as HTMLElement;
    this.fullContainer = this.full.querySelector(".container") as HTMLElement;
    this.fullImg = this.fullContainer.querySelector("img") as HTMLImageElement;
    this.closeButton = this.full.querySelector(".close") as HTMLButtonElement;
    this.preview = gallery.querySelector(".preview") as HTMLDivElement;
    this.previewImgWrapper = this.preview.querySelector(
      ".image-loading"
    ) as HTMLDivElement;
    this.previewImgOverlay = this.previewImgWrapper.querySelector(
      ".overlay"
    ) as HTMLDivElement;
    this.previewImg = this.previewImgWrapper.querySelector(
      "img"
    ) as HTMLImageElement;

    this.previewArrowLeft = this.preview.querySelector(
      ".preview-arrow.left"
    ) as HTMLButtonElement | null || undefined;
    this.previewArrowRight = this.preview.querySelector(
      ".preview-arrow.right"
    ) as HTMLButtonElement | null || undefined;

    this.previewImg.addEventListener("click", this.showFullImage);
    this.fullImg.addEventListener("dragstart", (e) => {
      e.preventDefault();
    });

    this.setUpZoom();

    const sliderElement = gallery.querySelector<HTMLElement>(".slider");
    if (sliderElement) {
      this.slider = new Slider(sliderElement);
      const list = sliderElement.querySelector<HTMLElement>(".items");
      if (list) {
        this.thumbs = Array.from(list.children) as HTMLImageElement[];
        this.nThumbs = this.thumbs.length;

        for (let i = 0; i < this.thumbs.length; i++) {
          const thumb = this.thumbs[i];
          thumb.addEventListener("click", () => {
            this.currentIndex = i;
            this.showPreview(thumb);
          });
          thumb.addEventListener("load", () => this.handleThumbLoad(thumb), {
            once: true
          });
        }
      }
    }

    this.previewArrowLeft?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showPrevPreview();
    });

    this.previewArrowRight?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showNextPreview();
    });
  }

  private getCurrentPreviewAspectRatio(): number {
    return this.is4to3 ? this.previewAspectRatio4to3 : this.previewAspectRatio;
  }

  public showPreview = (img: HTMLImageElement) => {
    let ratio: number;
    let width1x: number = Constants.galleryPreviewWidth;

    if (img.dataset.ratio) {
      ratio = parseFloat(img.dataset.ratio) / 100;
    } else {
      ratio = this.getCurrentPreviewAspectRatio();
    }

    const ratioMultiplier = this.getCurrentPreviewAspectRatio() / ratio;

    this.previewImg.sizes =
      `(max-width: 768px) calc((100vw - 2rem) * ${ratioMultiplier}),` +
      `(max-width: 70em) calc((100vw - 4.5em) * 3 / 5 * ${ratioMultiplier}),` +
      `calc(65.5em * 3 / 5 * ${ratioMultiplier})`;

    if (this.is4to3) {
      const imgBasePath = img.src.replace(/-w\d+\.jpg$/i, "");

      this.previewImg.src = `${imgBasePath}-w800.jpg`;
      this.previewImg.srcset =
        `${imgBasePath}-w800.jpg 800w, ` +
        `${imgBasePath}-w1200.jpg 1200w, ` +
        `${imgBasePath}-w1600.jpg 1600w, ` +
        `${imgBasePath}-w2132.jpg 2132w`;
    } else {
      if (img.dataset.ratio) {
        width1x = Math.round(Constants.galleryPreviewHeight / ratio);
      }

      const imgBasePath = img.src.slice(0, -"h100.jpg".length);

      this.previewImg.src = `${imgBasePath}h400.jpg`;
      this.previewImg.srcset =
        `${imgBasePath}h${Constants.galleryPreviewHeight}.jpg ${width1x}w,` +
        `${imgBasePath}w${2 * width1x}.jpg ${2 * width1x}w,` +
        `${imgBasePath}w${3 * width1x}.jpg ${3 * width1x}w,` +
        `${imgBasePath}w${4 * width1x}.jpg ${4 * width1x}w`;
    }

    this.previewImgOverlay.classList.add("spinner");
    this.previewImg.addEventListener(
      "load",
      () => {
        this.previewImgWrapper.style.paddingTop = ratio * 100 + "%";
        this.preview.style.maxWidth =
          (this.getCurrentPreviewAspectRatio() / ratio) * 100 + "%";
        this.previewImgOverlay.classList.remove("spinner");
      },
      { once: true }
    );
  };

  private showPrevPreview = () => {
    if (!this.thumbs.length) return;
    this.currentIndex =
      (this.currentIndex - 1 + this.thumbs.length) % this.thumbs.length;
    this.showPreview(this.thumbs[this.currentIndex]);
  };

  private showNextPreview = () => {
    if (!this.thumbs.length) return;
    this.currentIndex = (this.currentIndex + 1) % this.thumbs.length;
    this.showPreview(this.thumbs[this.currentIndex]);
  };

  private handleThumbLoad = (_thumb: HTMLImageElement) => {
    this.nLoadedThumbs++;
    if (this.nThumbs && this.nLoadedThumbs === this.nThumbs) {
      this.slider?.update();
    }
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.isGrabbing) return;
    e.preventDefault();

    const offsetX = e.x - this.startX;
    const offsetY = e.y - this.startY;

    if (
      Math.abs(offsetX) > Constants.abortClickDistance ||
      Math.abs(offsetY) > Constants.abortClickDistance
    ) {
      this.abortClick = true;
      this.fullImg.classList.add("dragging");
    }

    let left = this.startLeft + offsetX;
    let top = this.startTop + offsetY;

    const maxLeft = this.full.clientWidth / 2;
    const maxTop = this.full.clientHeight / 2;
    const minLeft = maxLeft - this.fullImg.naturalWidth;
    const minTop = maxTop - this.fullImg.naturalHeight;

    left = Math.min(Math.max(left, minLeft), maxLeft);
    top = Math.min(Math.max(top, minTop), maxTop);

    this.fullImg.style.left = left + "px";
    this.fullImg.style.top = top + "px";
  };

  private handleDragEnd = (e: PointerEvent) => {
    this.isGrabbing = false;
    this.fullImg.classList.remove("dragging");
    this.fullImg.releasePointerCapture(e.pointerId);
    this.fullImg.removeEventListener("pointermove", this.handlePointerMove);
    this.fullImg.removeEventListener("pointerup", this.handleDragEnd);
    this.fullImg.removeEventListener("lostpointercapture", this.handleDragEnd);
  };

  private handlePointerDown = (e: PointerEvent) => {
    e.stopPropagation();
    this.abortClick = false;
    this.isGrabbing = true;
    this.startX = e.x;
    this.startY = e.y;
    this.startLeft = parseFloat(this.fullImg.style.left);
    this.startTop = parseFloat(this.fullImg.style.top);
    this.fullImg.setPointerCapture(e.pointerId);
    this.fullImg.addEventListener("pointermove", this.handlePointerMove);
    this.fullImg.addEventListener("pointerup", this.handleDragEnd);
    this.fullImg.addEventListener("lostpointercapture", this.handleDragEnd);
  };

  private showFullImage = () => {
    if (this.is4to3) {
      this.fullImg.src = this.previewImg.src.replace(/-w\d+\.jpg$/i, "-w2132.jpg");
    } else {
      this.fullImg.src = this.previewImg.src.replace("-h400.jpg", ".jpg");
    }

    this.fullContainer.classList.add("spinner");
    this.full.style.display = "block";
    document.body.style.overflow = "hidden";

    this.fullImg.addEventListener(
      "load",
      () => {
        this.fullContainer.classList.remove("spinner");
      },
      { once: true }
    );
  };

  private setUpZoom = () => {
    this.full.addEventListener("click", () => {
      document.body.style.overflow = Constants.bodyOverflow;
      this.full.style.display = "none";
      this.zoomOut();
    });

    this.fullImg.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();

      if (this.full.classList.contains("zoom")) {
        if (this.abortClick) return;

        const offsetX = e.x - this.startX;
        const offsetY = e.y - this.startY;

        if (
          Math.abs(offsetX) > Constants.abortClickDistance ||
          Math.abs(offsetY) > Constants.abortClickDistance
        ) {
          return;
        }

        this.zoomOut();
      } else {
        this.zoomIn(e);
      }
    });
  };

  private zoomIn = (e: MouseEvent) => {
    const xRatio = e.offsetX / this.fullImg.width;
    const yRatio = e.offsetY / this.fullImg.height;
    const left = -xRatio * this.fullImg.naturalWidth + e.x;
    const top = -yRatio * this.fullImg.naturalHeight + e.y;

    this.fullImg.style.left = left + "px";
    this.fullImg.style.top = top + "px";
    this.fullImg.style.bottom = "auto";
    this.fullImg.style.right = "auto";
    this.full.classList.add("zoom");
    this.fullImg.addEventListener("pointerdown", this.handlePointerDown);
  };

  private zoomOut = () => {
    this.full.classList.remove("zoom");
    this.fullImg.style.left = "0";
    this.fullImg.style.top = "0";
    this.fullImg.style.bottom = "0";
    this.fullImg.style.right = "0";
    this.fullImg.removeEventListener("pointerdown", this.handlePointerDown);
  };
}
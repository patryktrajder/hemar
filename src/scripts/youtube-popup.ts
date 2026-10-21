export default class YoutubePopup {
  private popup: HTMLElement | null;
  private videoBox: HTMLElement | null;
  private openButtons: NodeListOf<HTMLButtonElement>;
  private closeButtons: NodeListOf<HTMLElement>;
  private youtubePreconnected = false;

  constructor() {
    this.popup = document.getElementById("youtube-popup");
    this.videoBox = document.getElementById("youtube-popup-video");
    this.openButtons = document.querySelectorAll<HTMLButtonElement>(".js-youtube-popup-open");
    this.closeButtons = document.querySelectorAll<HTMLElement>("[data-youtube-close]");

    // Jeśli na stronie nie ma popupu YouTube, nic nie rób.
    if (!this.popup || !this.videoBox || this.openButtons.length === 0) return;

    this.bindEvents();

    // Nie obciąża startu strony — odpala dopiero po 3 sekundach.
    window.setTimeout(() => this.addYoutubePreconnect(), 3000);
  }

  private getPageLang(): string {
    return document.documentElement.lang.toLowerCase();
  }

  private getLoadingText(): string {
    // Opcjonalne ręczne nadpisanie z HTML:
    // <div class="youtube-popup" data-loading-text="...">
    if (this.popup?.dataset.loadingText) {
      return this.popup.dataset.loadingText;
    }

    const pageLang = this.getPageLang();

    if (pageLang.startsWith("pl")) {
      return "Ładowanie filmu...";
    }

    if (pageLang.startsWith("de")) {
      return "Video wird geladen...";
    }

    return "Loading video...";
  }

  private getIframeTitle(): string {
    const pageLang = this.getPageLang();

    if (pageLang.startsWith("pl")) {
      return "Film YouTube";
    }

    if (pageLang.startsWith("de")) {
      return "YouTube-Video";
    }

    return "YouTube video";
  }

  private addYoutubePreconnect(): void {
    if (this.youtubePreconnected) return;
    this.youtubePreconnected = true;

    const links: Array<{ rel: string; href: string }> = [
      { rel: "preconnect", href: "https://www.youtube-nocookie.com" },
      { rel: "preconnect", href: "https://www.google.com" },
      { rel: "dns-prefetch", href: "//www.youtube-nocookie.com" },
      { rel: "dns-prefetch", href: "//www.google.com" }
    ];

    links.forEach((item) => {
      const link = document.createElement("link");
      link.rel = item.rel;
      link.href = item.href;
      document.head.appendChild(link);
    });
  }

  private normalizeYoutubeStart(startSeconds?: string): string {
    if (!startSeconds) return "0";

    const trimmedStart = startSeconds.trim();

    // Obsługa prostego zapisu w sekundach, np. data-youtube-start="69"
    if (/^\d+$/.test(trimmedStart)) {
      return trimmedStart;
    }

    return "0";
  }

  private cleanYoutubeId(videoId: string): string {
    const trimmedVideoId = videoId.trim();

    // Awaryjnie, gdyby gdzieś zostało stare data-youtube-id="ID?start=69"
    if (trimmedVideoId.includes("?")) {
      return trimmedVideoId.split("?")[0];
    }

    return trimmedVideoId;
  }

  private openYoutubePopup(videoId: string | undefined, startSeconds?: string): void {
    if (!videoId || !this.popup || !this.videoBox) return;

    const cleanVideoId = this.cleanYoutubeId(videoId);
    const start = this.normalizeYoutubeStart(startSeconds);

    if (!cleanVideoId) return;

    const params = new URLSearchParams({
      rel: "0",
      autoplay: "1"
    });

    // Jeśli nie ma data-youtube-start, film zaczyna od początku.
    // Jeśli data-youtube-start istnieje i jest większe niż 0, dodajemy start do URL.
    if (start !== "0") {
      params.set("start", start);
    }

    // Jeśli użytkownik kliknie przed upływem 3 sekund,
    // preconnect wykona się natychmiast.
    this.addYoutubePreconnect();

    this.popup.classList.add("is-open");
    this.popup.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    this.videoBox.classList.add("is-loading");

    const loadingText = this.getLoadingText();
    const iframeTitle = this.getIframeTitle();

    this.videoBox.innerHTML = `
      <div class="youtube-popup__loader">${loadingText}</div>

      <iframe
        src="https://www.youtube-nocookie.com/embed/${cleanVideoId}?${params.toString()}"
        title="${iframeTitle}"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen>
      </iframe>
    `;

    const iframe = this.videoBox.querySelector<HTMLIFrameElement>("iframe");

    if (iframe) {
      iframe.addEventListener("load", () => {
        this.videoBox?.classList.remove("is-loading");
      });
    }
  }

  private closeYoutubePopup(): void {
    if (!this.popup || !this.videoBox) return;

    this.popup.classList.remove("is-open");
    this.popup.setAttribute("aria-hidden", "true");

    // Usuwa iframe, więc film przestaje grać po zamknięciu.
    this.videoBox.innerHTML = "";
    this.videoBox.classList.remove("is-loading");

    document.body.style.overflow = "";
  }

  private bindEvents(): void {
    this.openButtons.forEach((button) => {
      button.addEventListener("mouseenter", () => this.addYoutubePreconnect(), { once: true });
      button.addEventListener("touchstart", () => this.addYoutubePreconnect(), { once: true });

      button.addEventListener("click", () => {
        this.openYoutubePopup(button.dataset.youtubeId, button.dataset.youtubeStart);
      });
    });

    this.closeButtons.forEach((button) => {
      button.addEventListener("click", () => this.closeYoutubePopup());
    });

    document.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.key === "Escape" && this.popup?.classList.contains("is-open")) {
        this.closeYoutubePopup();
      }
    });
  }
}
import Constants from "./constants";
import { gtag } from "./gtag";

export default class Cookies {
  private readonly container: HTMLDivElement;
  private readonly backdrop: HTMLDivElement;
  private readonly acceptButton: HTMLButtonElement;
  private readonly rejectButton: HTMLButtonElement;

  constructor(private readonly template: HTMLTemplateElement) {
    const fragment = this.template.content.cloneNode(true) as DocumentFragment;

    this.backdrop = fragment.querySelector("#cookies-backdrop") as HTMLDivElement;
    this.container = fragment.querySelector("#cookies-notice") as HTMLDivElement;
    this.acceptButton = this.container.querySelector(".accept") as HTMLButtonElement;
    this.rejectButton = this.container.querySelector(".reject") as HTMLButtonElement;

    const consentCookie = Cookies.getCookie(Constants.consentCookieName);
    this.initAnalytics(consentCookie === "1");

    if (consentCookie) {
      return;
    }

    this.acceptButton.addEventListener("click", this.accept);
    this.rejectButton.addEventListener("click", this.reject);

    document.body.appendChild(fragment);

    window.setTimeout(() => {
      this.show();
    }, 100);
  }

  public static getCookie(name: string): string | null {
    const cookies = document.cookie;
    const prefix = name + "=";
    const separator = "; ";
    let start = cookies.indexOf(separator + prefix);

    if (start !== -1) {
      start += separator.length;
    } else {
      start = cookies.indexOf(prefix);
      if (start !== 0) {
        return null;
      }
    }

    let end = cookies.indexOf(";", start);
    if (end === -1) {
      end = cookies.length;
    }

    return decodeURIComponent(cookies.substring(start + prefix.length, end));
  }

  public static removeCookie(name: string, path: string): void {
    Cookies.setCookie(name, "", 0, path);
  }

  public static setCookie(
    name: string,
    value: string,
    maxAge: number,
    path: string
  ): void {
    document.cookie = `${name}=${value}; Max-Age=${maxAge}; Path=${path}; SameSite=Strict; Secure`;
  }

  private show(): void {
    this.container.classList.remove("cookies-hidden");
    this.backdrop.classList.remove("cookies-backdrop-hidden");
  }

  private hide(): void {
    this.container.classList.add("cookies-hidden");
    this.backdrop.classList.add("cookies-backdrop-hidden");

    window.setTimeout(() => {
      this.backdrop.remove();
      this.container.remove();
    }, 400);
  }

  private accept = (): void => {
    Cookies.setCookie(
      Constants.consentCookieName,
      "1",
      Constants.consentMaxAge,
      "/"
    );
    this.updateConsent(true);
    this.hide();
  };

  private reject = (): void => {
    Cookies.setCookie(
      Constants.consentCookieName,
      "0",
      Constants.consentMaxAge,
      "/"
    );
    this.updateConsent(false);
    this.hide();
  };

  private initAnalytics(consent: boolean): void {
    const grantStatus = consent ? "granted" : "denied";

    gtag("js", new Date());
    gtag("consent", "default", {
      analytics_storage: grantStatus,
      ad_storage: grantStatus,
      ad_user_data: grantStatus,
      ad_personalization: grantStatus
    });
    gtag("config", "G-ZYTND6L39E", { anonymize_ip: true });
  }

  private updateConsent(consent: boolean): void {
    const grantStatus = consent ? "granted" : "denied";

    gtag("consent", "update", {
      analytics_storage: grantStatus,
      ad_storage: grantStatus,
      ad_user_data: grantStatus,
      ad_personalization: grantStatus
    });
  }
}
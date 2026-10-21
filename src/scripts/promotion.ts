export default class Promotion {
  private readonly oldPriceValueElement?: HTMLElement | null;
  private readonly oldPriceElement: HTMLElement | null;
  private readonly priceElement: HTMLElement;
  private readonly priceValueElement: HTMLElement;
  private readonly promotionInfo: HTMLElement | null;

  constructor(product: HTMLElement, endDate: Date) {
    this.oldPriceElement = product.querySelector<HTMLElement>("s.price");
    this.oldPriceValueElement = this.oldPriceElement?.querySelector<
      HTMLElement
    >(".value");
    this.priceElement = product.querySelector("div.price") as HTMLElement;
    this.priceValueElement = this.priceElement?.querySelector(
      ".value"
    ) as HTMLElement;
    this.promotionInfo = product.querySelector<HTMLElement>(".promotion-info");

    const timeRemaining = endDate.getTime() - Date.now();

    if (timeRemaining > 0) setTimeout(this.endPromotion, timeRemaining);
    else this.endPromotion();
  }

  private endPromotion() {
    if (this.oldPriceValueElement)
      this.priceValueElement.innerText = this.oldPriceValueElement.innerText;
    this.oldPriceElement?.remove();
    this.promotionInfo?.remove();
    this.priceElement.innerHTML = this.priceElement.innerHTML.replace("*", "");
  }
}

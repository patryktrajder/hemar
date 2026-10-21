export default class Constants {
  public static readonly abortClickDistance: number = 3; // px
  public static readonly autoPlaySlideDuration: number = 5000; // s
  public static readonly bodyOverflow = document.body.style.overflow;
  public static readonly consentCookieName = "consent";
  public static readonly consentMaxAge: number = 60 * 60 * 24 * 30; // 30 days in seconds
  public static readonly expanderMinHeight = 5.5; // rem
  public static readonly dragSlideThreshold: number = 0.2; // [0, 1]
  public static readonly galleryPreviewHeight: number = 400; // px
  public static readonly galleryPreviewWidth: number = 711; // px, 16:9
  public static readonly headerDivMaxPaddingBottom: number = 2; // rem
  public static readonly headerDivMinPaddingBottom: number = 0.75; // rem
  public static readonly headerMaxHeightDesktop: number = 11.75; // rem
  public static readonly headerMaxHeightMobile: number = 7; // rem
  public static readonly headerMenuWidthThreshold: number = 899; // px
  public static readonly headerMinHeight: number = 4; // rem
}

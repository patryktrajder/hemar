export default class Utils {
  public static mod(n: number, m: number): number {
    return ((n % m) + m) % m;
  }
  public static modNeg(n: number, m: number): number {
    return ((n % m) - m) % m;
  }

  public static nthIndex(
    originalString: string,
    searchString: string,
    n: number
  ) {
    let L = originalString.length;
    let i = -1;
    while (n-- && i++ < L) {
      i = originalString.indexOf(searchString, i);
      if (i < 0) break;
    }
    return i;
  }

  public static remToPx(nRem: number) {
    return nRem * parseInt(getComputedStyle(document.documentElement).fontSize);
  }
}

import Banner from "./scripts/banner";
import Checkbox from "./scripts/checkbox";
import Cookies from "./scripts/cookies";
import Expander from "./scripts/expander";
import Gallery from "./scripts/gallery";
import Header from "./scripts/header";
import HoldOnClick from "./scripts/hold-on-click";
import LanguageDropdown from "./scripts/language-dropdown";
import Slider from "./scripts/slider";
import YoutubePopup from "./scripts/youtube-popup";
import "./scripts/purchase-panel";

const banners = document.getElementsByClassName("banner");
for (let i = 0; i < banners.length; i++) new Banner(banners[i] as HTMLElement);

let checkbox = document.querySelector("#super-booster-2000 .checkbox");
if (checkbox) new Checkbox(checkbox as HTMLElement, 689, 599, 155, 139, true);

let cookieNotice = document.getElementById("cookies-notice-template");
if (cookieNotice) new Cookies(cookieNotice as HTMLTemplateElement);

const sliders = document.getElementsByClassName("regular slider");
for (let i = 0; i < sliders.length; i++) new Slider(sliders[i] as HTMLElement);

const galleries = document.getElementsByClassName("gallery");
for (let i = 0; i < galleries.length; i++) new Gallery(galleries[i]);

const expanders = document.getElementsByClassName("expander");
for (let i = 0; i < expanders.length; i++)
  new Expander(expanders[i] as HTMLElement);

const header = document.querySelector("body > header");
if (header) new Header(header as HTMLElement);

const holdContainer = document.querySelector(".hold-on-click");
if (holdContainer) new HoldOnClick(holdContainer as HTMLElement);

const languageDropdowns = document.getElementsByClassName("language-dropdown");
for (let i = 0; i < languageDropdowns.length; i++)
  new LanguageDropdown(languageDropdowns[i] as HTMLElement);

new YoutubePopup();

// import Promotion from "./scripts/promotion";
// const products = document.getElementsByClassName("product-details");
// for (let i = 0; i < products.length; i++)
//   new Promotion(products[i] as HTMLElement, new Date(2020, 4, 18));

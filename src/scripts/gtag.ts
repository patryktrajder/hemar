declare namespace Gtag {
  interface Gtag {
    (
      command: "config",
      targetId: string,
      config?: ConfigParams | ControlParams | EventParams | CustomParams
    ): void;
    (
      command: "consent",
      consentMode: "default" | "update",
      config: ConsentParams
    ): void;
    (command: "set", config: CustomParams): void;
    (command: "js", config: Date): void;
    (
      command: "event",
      eventName: EventNames | string,
      eventParams?: ControlParams | EventParams | CustomParams
    ): void;
  }

  interface ConfigParams {
    send_page_view?: boolean;
    transport_type?: string;
  }

  interface CustomParams {
    [key: string]: any;
  }

  interface ControlParams {
    anonymize_ip?: boolean;
    groups?: string | string[];
    send_to?: string | string[];
    event_callback?: () => void;
    event_timeout?: number;
  }

  type EventNames =
    | "add_payment_info"
    | "add_to_cart"
    | "add_to_wishlist"
    | "begin_checkout"
    | "checkout_progress"
    | "exception"
    | "generate_lead"
    | "login"
    | "page_view"
    | "purchase"
    | "refund"
    | "remove_from_cart"
    | "screen_view"
    | "search"
    | "select_content"
    | "set_checkout_option"
    | "share"
    | "sign_up"
    | "timing_complete"
    | "view_item"
    | "view_item_list"
    | "view_promotion"
    | "view_search_results";

  interface EventParams {
    checkout_option?: string;
    checkout_step?: number;
    content_id?: string;
    content_type?: string;
    coupon?: string;
    currency?: string;
    description?: string;
    fatal?: boolean;
    items?: Item[];
    method?: string;
    number?: string;
    page_title?: string;
    page_location?: string;
    page_path?: string;
    promotions?: Promotion[];
    screen_name?: string;
    search_term?: string;
    shipping?: Currency;
    tax?: Currency;
    transaction_id?: string;
    value?: number;
    event_label?: string;
    event_category?: string;
  }

  type Currency = string | number;

  interface Item {
    brand?: string;
    category?: string;
    creative_name?: string;
    creative_slot?: string;
    id?: string;
    location_id?: string;
    name?: string;
    price?: Currency;
    quantity?: number;
  }

  interface Promotion {
    creative_name?: string;
    creative_slot?: string;
    id?: string;
    name?: string;
  }

  interface ConsentParams {
    ad_storage?: GrantStatus;
    analytics_storage?: GrantStatus;
    ad_user_data?: GrantStatus;
    ad_personalization?: GrantStatus;
    functionality_storage?: GrantStatus;
    personalization_storage?: GrantStatus;
    security_storage?: GrantStatus;
    region?: string[];
    wait_for_update?: number;
  }

  type GrantStatus = "granted" | "denied";
}

(window as any).dataLayer = (window as any).dataLayer || [];
export const gtag: Gtag.Gtag = function () {
  (window as any).dataLayer.push(arguments);
};
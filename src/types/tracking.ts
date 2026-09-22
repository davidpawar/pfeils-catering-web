/**
 * Value types Plausible accepts in a custom property.
 */
export type TrackingPrimitive = string | number | boolean | null;

/**
 * Extra metadata sent alongside an event, for example `form_id` or `lang`.
 */
export type TrackingEventProps = Record<string, TrackingPrimitive>;

/**
 * One tracking event as a component passes it to `window.trackEvent`.
 *
 * Values use UPPERCASE_SNAKE_CASE. The pageview event is the exception and
 * uses the lowercase `eventAction: "pageview"`, because Plausible fills Entry
 * and Exit pages only for that name.
 */
export type TrackingEventInput = {

  /**
   * Describes what happened.
   * Example: when a user opens an FAQ accordion item, this could be
   * `"FAQ_ITEM_OPENED"`.
   */
  eventAction: string;

  /**
   * Describes where the interaction happened.
   * Example: for an FAQ accordion interaction, this could be `"FAQ"`.
   */
  eventCategory: string;

  /**
   * Optionally describes which specific element was affected.
   * Example: for an FAQ accordion, this could be the opened item like
   * `"PRICING_QUESTION"` or `"DELIVERY_AREA"`.
   */
  eventName?: string;

  /**
   * Optional extra metadata that should travel with the event.
   * Example: this can include helper values like `FORM_ID`, `LANG`, or UTM data.
   */
  props?: TrackingEventProps;
};

/**
 * Signature of the global `window.trackEvent`, set up in `BaseHead`.
 */
export type TrackEvent = (event: TrackingEventInput) => void;

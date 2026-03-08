export type TrackingPrimitive = string | number | boolean | null;

export type TrackingEventProps = Record<string, TrackingPrimitive>;

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

export type TrackEvent = (event: TrackingEventInput) => void;

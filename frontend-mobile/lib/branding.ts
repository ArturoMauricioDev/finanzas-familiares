import { brand } from "./generated/tokens";
import { defaultLocale, messages } from "./i18n/messages.generated";

export const BRAND_NAME = brand.name;
export const BRAND_TAGLINE = brand.tagline;
export const STORE_TITLE_ES = brand.webTitle;
export const STORE_TITLE_GLOBAL = brand.mobileTitle;
export const BRAND_DESCRIPTION = messages[defaultLocale].app.description;

export { brand };
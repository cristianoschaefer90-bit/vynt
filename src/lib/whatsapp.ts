import { STORE } from "./config";

export const waLink = (text: string) => `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(text)}`;

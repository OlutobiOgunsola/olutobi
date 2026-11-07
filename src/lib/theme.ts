export type Theme = "light" | "dark";
export const THEME_KEY = "theme";

/** Runs before first paint (inlined in the root layout) so a saved choice never flashes. */
export const themeScript = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

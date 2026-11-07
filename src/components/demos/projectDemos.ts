import type { ComponentType } from "react";
import { TenancyDemo } from "./TenancyDemo";
import { BookingDemo } from "./BookingDemo";
import { VigilDemo } from "./VigilDemo";
import { IntentDemo } from "./IntentDemo";
import { LedgerDemo } from "./LedgerDemo";
import { GoroutineDemo } from "./GoroutineDemo";

/** The one idea each project is built around, as a live demo on its page. */
export const projectDemos: Record<string, ComponentType> = {
  zignalyft: TenancyDemo,
  zignastay: BookingDemo,
  vigil: VigilDemo,
  ducent: IntentDemo,
  sentinel: LedgerDemo,
  "go-systems-lab": GoroutineDemo,
};

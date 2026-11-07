import type { DemoSpec } from "@/content/lab/types";
import { customDemos } from "./registry";
import { FlowScenario } from "./FlowScenario";
import { ArrayAlgo } from "./ArrayAlgo";
import { GridPath } from "./GridPath";

/** Resolves a lab entry's demo spec to the component that plays it. */
export function LabDemo({ spec }: { spec: DemoSpec }) {
  switch (spec.kind) {
    case "flow":
      return <FlowScenario scene={spec.scene} />;
    case "array":
      return <ArrayAlgo algo={spec.algo} />;
    case "grid":
      return <GridPath algo={spec.algo} />;
    case "custom": {
      const Demo = customDemos[spec.key];
      return Demo ? <Demo /> : null;
    }
  }
}

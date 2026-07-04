// What this app needs to run at full capability. Drives describe() in /api/state
// so a Clawnify agent (or Claude Code) can see exactly what to wire before using
// the app — and the dashboard renders a connect step for anything missing.
// Declaring a requirement never provisions it; the Fatture in Cloud connection is
// added in the Clawnify dashboard.

import type { RequireSpec } from "@clawnify/connections";

export const REQUIRES: RequireSpec[] = [{ service: "fattureincloud", as: "integration" }];

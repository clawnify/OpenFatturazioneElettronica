// Worker bindings. In production Clawnify injects the CREDENTIALS broker binding
// and CLAWNIFY_ORG_ID; the Fatture in Cloud connection is resolved per-request by
// @clawnify/connections straight off `env`. The FATTUREINCLOUD_* vars are
// local-dev fallbacks only — the SDK reads FATTUREINCLOUD_BEARER_TOKEN when no
// broker is present so the template runs standalone. FATTUREINCLOUD_COMPANY_ID
// pins which azienda to read when an account has more than one (optional; the
// provider otherwise uses the first company returned by /user/companies).

import type { CredentialBinding } from "@clawnify/connections";

export type Bindings = {
  CREDENTIALS?: CredentialBinding;
  CLAWNIFY_ORG_ID?: string;
  // Local-dev fallbacks:
  FATTUREINCLOUD_BEARER_TOKEN?: string;
  FATTUREINCLOUD_COMPANY_ID?: string;
};

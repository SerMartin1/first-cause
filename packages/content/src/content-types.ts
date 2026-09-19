import { resourceContentTypeSpec } from "./schema/resource-definition.js";
import { goodContentTypeSpec } from "./schema/good-definition.js";
import { companyArchetypeContentTypeSpec } from "./schema/company-archetype-definition.js";
import { productionMethodContentTypeSpec } from "./schema/production-method-definition.js";
import { discoveryContentTypeSpec } from "./schema/discovery-definition.js";
import { serviceContentTypeSpec } from "./schema/service-definition.js";
import { transportModeContentTypeSpec } from "./schema/transport-mode-definition.js";
import { interventionContentTypeSpec } from "./schema/intervention-definition.js";
import { eventTypeContentTypeSpec } from "./schema/event-type-definition.js";
import { chronicleTemplateContentTypeSpec } from "./schema/chronicle-template-definition.js";
import { knowledgeDomainContentTypeSpec } from "./schema/knowledge-domain-definition.js";
import type { AnyContentTypeSpec, ContentTypeName } from "./schema/reference-field.js";

/**
 * Every content definition type in M2 scope, keyed by name. The content
 * pack loader (`loaders/content-pack.ts`) and the semantic validators
 * (`validators/*`) both iterate this map generically instead of hardcoding
 * per-type logic. Each spec's definition type is erased to the common
 * `{ readonly id: string }` bound here -- generic consumers only need
 * `id`, reference-field values and `implementationPhase`; full
 * per-type field typing is still available from each schema module
 * directly (e.g. `ResourceDefinitionSchema`).
 */
export const CONTENT_TYPE_SPECS: Readonly<Record<ContentTypeName, AnyContentTypeSpec>> = {
  resource: resourceContentTypeSpec as unknown as AnyContentTypeSpec,
  good: goodContentTypeSpec as unknown as AnyContentTypeSpec,
  companyArchetype: companyArchetypeContentTypeSpec as unknown as AnyContentTypeSpec,
  productionMethod: productionMethodContentTypeSpec as unknown as AnyContentTypeSpec,
  discovery: discoveryContentTypeSpec as unknown as AnyContentTypeSpec,
  service: serviceContentTypeSpec as unknown as AnyContentTypeSpec,
  transportMode: transportModeContentTypeSpec as unknown as AnyContentTypeSpec,
  intervention: interventionContentTypeSpec as unknown as AnyContentTypeSpec,
  eventType: eventTypeContentTypeSpec as unknown as AnyContentTypeSpec,
  chronicleTemplate: chronicleTemplateContentTypeSpec as unknown as AnyContentTypeSpec,
  knowledgeDomain: knowledgeDomainContentTypeSpec as unknown as AnyContentTypeSpec,
};

import { ResourceDefinitionSchema } from "../schema/resource-definition.js";
import { createDefinitionLoader } from "./create-definition-loader.js";

export const loadResourceDefinitions = createDefinitionLoader(ResourceDefinitionSchema);

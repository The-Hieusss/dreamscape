import { createContext } from "react";
import type { CollisionMap } from "./collisions";

export const CollisionContext = createContext<CollisionMap | null>(null);

import { playersApi } from "./players";
import { trainingsApi } from "./trainings";
import { matchesApi } from "./matches";

export const api = { ...playersApi, ...trainingsApi, ...matchesApi };

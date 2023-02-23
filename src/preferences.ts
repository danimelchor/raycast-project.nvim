
import { getPreferenceValues } from "@raycast/api";
import { Preferences } from "./types";

const preferences: Preferences = getPreferenceValues();

export const terminal = preferences.terminal;
export const args = preferences.args;
export const projectsPath = preferences.projectsPath;

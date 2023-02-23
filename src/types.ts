export type Preferences = {
  terminal: string
  args: string
  projectsPath: string
}

export interface SearchResult {
  project_name: string;
  full_path: string;
}

export interface EnvType {
  env: Record<string, string>;
  cwd: string;
  shell: string;
}



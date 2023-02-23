import { ActionPanel, Action, List, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import fs from "fs";
import tildify from "tildify";
import untildify from "untildify";
import { exec } from "child_process";
import { shellEnv } from "shell-env";
import { terminal, args, projectsPath } from "./preferences";
import { EnvType, SearchResult } from "./types";
import { usePromise } from "@raycast/utils";

let cachedEnv: null | EnvType = null;

const getCachedEnv = async () => {
  if (cachedEnv) {
    return cachedEnv;
  }

  const env = await shellEnv();
  cachedEnv = {
    env: env,
    cwd: env.HOME || `/Users/${process.env.USER}`,
    shell: env.SHELL,
  };
  return cachedEnv;
};

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const { isLoading, data, revalidate } = usePromise(
    async (query) => {
      // Read file
      let data = "";
      try {
        data = await fs.promises.readFile(untildify(projectsPath), "utf8");
      } catch (err: any) {
        showToast({ title: "Error", style: Toast.Style.Failure, message: err.toString() })
      }

      const results = data
        .trim()
        .split("\n")
        .map((full_path: String) => {
          if (full_path.charAt(full_path.length - 1) == "/") {
            full_path = full_path.slice(0, -1);
          }
          const project_name = full_path.split("/").pop() || "";

          return {
            project_name,
            full_path
          } as SearchResult;
        })
        .filter((searchResult: SearchResult) => {
          return searchResult.project_name.toLowerCase().includes(query.toLowerCase());
        })
        .reverse();

      return results;
    }, [searchText])

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search recent nvim projects..."
      throttle
    >
      <List.Section title="Results" subtitle={data?.length + ""}>
        {data?.map((searchResult: SearchResult) => (
          <SearchListItem key={searchResult.project_name} searchResult={searchResult} revalidate={revalidate} />
        ))}
      </List.Section>
    </List>
  );
}

async function openInEditor(path: string) {
  const execEnv = await getCachedEnv();
  exec(`${terminal} ${args} nvim "${path}"`, execEnv);
}

async function deleteProject(path: string, cb: () => void) {
  const file_data = await fs.promises.readFile(untildify(projectsPath), "utf8")
  const new_data = file_data.split("\n").filter((line: string) => line !== path).join("\n")
  await fs.promises.writeFile(untildify(projectsPath), new_data)
  cb()
}

function SearchListItem({ searchResult, revalidate }: { searchResult: SearchResult, revalidate: () => void }) {
  const { project_name, full_path } = searchResult;
  const prettyPath = tildify(searchResult.full_path);

  return (
    <List.Item
      title={project_name}
      subtitle={prettyPath}
      icon={{ fileIcon: full_path }}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action
              title={`Open in neovim`}
              icon="action-icon.png"
              onAction={() => openInEditor(full_path)}
            />
            <Action.ShowInFinder path={full_path} />
            <Action.OpenWith path={full_path} shortcut={{ modifiers: ["cmd"], key: "o" }} />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action
              title={`Delete ${project_name} project`}
              icon="trash.png"
              onAction={() => deleteProject(full_path, revalidate)}
              shortcut={{ modifiers: ["cmd"], key: "d" }}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action.CopyToClipboard title="Copy Name" content={project_name} shortcut={{ modifiers: ["cmd"], key: "." }} />
            <Action.CopyToClipboard
              title="Copy Path"
              content={prettyPath}
              shortcut={{ modifiers: ["cmd", "shift"], key: "." }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}



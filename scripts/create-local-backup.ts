import { createWriteStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";

const backupRoot = process.env.PCS_BACKUP_DIR ?? "data/backups";
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = join(backupRoot, timestamp);

function run(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "inherit", "inherit"] });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
      }
    });
  });
}

function writeCommandOutput(command: string, args: string[], outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "inherit"] });

    child.stdout.pipe(output);
    child.on("error", reject);
    output.on("error", reject);
    child.on("close", (code) => {
      output.end();
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
      }
    });
  });
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

await mkdir(backupDir, { recursive: true });

await writeCommandOutput(
  "docker",
  [
    "compose",
    "exec",
    "-T",
    "db",
    "pg_dump",
    "-U",
    "pcs",
    "-d",
    "personal_context_system",
    "--format=custom",
    "--no-owner",
    "--no-privileges"
  ],
  join(backupDir, "database.dump")
);

if (await pathExists("data/attachments")) {
  await run("tar", ["-czf", join(backupDir, "attachments.tar.gz"), "-C", "data", "attachments"]);
}

await writeFile(
  join(backupDir, "README.md"),
  [
    "# Personal Context System Backup",
    "",
    `Created: ${new Date().toISOString()}`,
    "",
    "Contents:",
    "",
    "- `database.dump`: PostgreSQL custom-format dump from the local Docker Compose database.",
    "- `attachments.tar.gz`: present only when `data/attachments` existed.",
    "",
    "Not included:",
    "",
    "- `.env`; store it separately in your password manager or another secure location.",
    "- `data/context-mirror`; rebuild it with `npm run mirror:build`.",
    ""
  ].join("\n"),
  "utf8"
);

console.log(`Backup written to ${backupDir}`);

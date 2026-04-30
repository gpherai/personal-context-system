import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";

const backupDir = process.argv[2];

if (!backupDir) {
  throw new Error("Usage: npm run backup:restore -- data/backups/<timestamp>");
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

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

function pipeFileToCommand(inputPath: string, command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const input = createReadStream(inputPath);
    const child = spawn(command, args, { stdio: ["pipe", "inherit", "inherit"] });

    input.pipe(child.stdin);
    input.on("error", reject);
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

const databaseDump = join(backupDir, "database.dump");
const attachmentArchive = join(backupDir, "attachments.tar.gz");

if (!(await pathExists(databaseDump))) {
  throw new Error(`Missing database dump: ${databaseDump}`);
}

console.warn(
  "WARNING: This will drop and recreate all database objects. The current database contents will be lost."
);

await pipeFileToCommand(databaseDump, "docker", [
  "compose",
  "exec",
  "-T",
  "db",
  "pg_restore",
  "-U",
  "pcs",
  "-d",
  "personal_context_system",
  "--clean",
  "--if-exists",
  "--no-owner",
  "--no-privileges"
]);

if (await pathExists(attachmentArchive)) {
  await run("tar", ["-xzf", attachmentArchive, "-C", "data"]);
}

console.log(`Backup restored from ${backupDir}`);
console.log("Run `npm run mirror:build` to regenerate the AI context mirror from the restored data.");

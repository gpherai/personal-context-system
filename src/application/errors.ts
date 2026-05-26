import { Prisma } from "@/generated/prisma/client";

export const DATABASE_UNAVAILABLE_MESSAGE = "The local database is not available. Start PostgreSQL and run migrations.";

export function databaseMutationErrorState(): { status: "error"; message: string } {
  return { status: "error", message: DATABASE_UNAVAILABLE_MESSAGE };
}

export class DatabaseUnavailableError extends Error {
  constructor(message = "The local database is not available.") {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

export function isRecoverableReadError(error: unknown): boolean {
  if (error instanceof DatabaseUnavailableError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code.startsWith("P1")) {
    return true;
  }

  return false;
}

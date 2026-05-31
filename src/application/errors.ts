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

export function isDatabaseUnavailable(error: unknown): boolean {
  return error instanceof DatabaseUnavailableError;
}

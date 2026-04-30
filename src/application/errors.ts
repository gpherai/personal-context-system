export const DATABASE_UNAVAILABLE_MESSAGE = "The local database is not available. Start PostgreSQL and run migrations.";

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

  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("DATABASE_URL") ||
    error.message.includes("ECONNREFUSED") ||
    error.message.includes("Can't reach database") ||
    error.message.includes("PrismaClientInitializationError")
  );
}

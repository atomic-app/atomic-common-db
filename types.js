// @flow strict
import type { Pool, PoolClient, ResultSet } from "pg"

export type DbTransactionCommands = (dbClient: PoolClient) => Promise<mixed>

export type DbWrapper = {
  getPool: () => Pool,
  query: (text: string, values?: Array<mixed>) => Promise<ResultSet>,
  transaction: (commands: DbTransactionCommands) => Promise<mixed>,
  disconnect: () => Promise<void>
}

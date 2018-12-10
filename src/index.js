// @flow strict

import {Pool} from 'pg'
import type {DbTransactionCommands, DbWrapper} from './types'

async function query(text: string, values?: Array<mixed>, pool: Pool) {
  const dbClient = await pool.connect()
  const result = await dbClient.query(text, values)

  dbClient.release()

  return result
}

async function transaction(commands: DbTransactionCommands, pool: Pool) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const commandsResult = await commands(client)

    await client.query('COMMIT')

    return commandsResult
  } catch (transactionError) {
    await client.query('ROLLBACK')
    throw transactionError
  } finally {
    client.release()
  }
}

export function getDb(connectionString: string): DbWrapper {
  let pool

  const getPool = (): Pool => {
    if (!pool) {
      pool = new Pool({connectionString: connectionString})
    }

    return pool
  }

  return {
    getPool,

    async query(text: string, values?: Array<mixed>) {
      return await query(text, values, getPool())
    },

    async transaction(commands: DbTransactionCommands) {
      return await transaction(commands, getPool())
    },

    async disconnect() {
      if (pool) {
        await pool.end()
        pool = null
      }
    }
  }
}

const DB_VARNAME = process.env.NODE_ENV === 'test' ? 'TEST_DB_URL' : 'DB_URL'

let defaultDb
export function getDefaultDb(): DbWrapper {
  if (typeof process.env[DB_VARNAME] === 'undefined' || process.env[DB_VARNAME] === '') {
    throw new Error(`${DB_VARNAME} not provided`)
  }

  if (!defaultDb) {
    defaultDb = getDb(String(process.env[DB_VARNAME]))
  }

  return defaultDb
}

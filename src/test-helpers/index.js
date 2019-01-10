// @flow strict

import {getDb} from '../index'
import type {DbWrapper} from '../types'

export const getDBHelper = (connectionString: string) => {
  let db

  const getDatabase = (): DbWrapper => {
    if (!db) {
      db = getDb(connectionString)
    }

    return db
  }

  return {
    async query(sql: string, values: Array<mixed>) {
      return await getDatabase().query(sql, values)
    },
    async clean(schema: string) {
      const sql = `
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = '${schema}' AND table_type = 'BASE TABLE'
      `

      // For some reason flow thinks that `result` might be Promise<ResultSet> | ResultSet
      // $FlowFixMe
      const result = await getDatabase().query(sql)
      if (!result.rows.length) {
        return
      }
      return await getDatabase().query(
        `TRUNCATE TABLE ${result.rows
          .map(table => `${schema}.${table['table_name']}`)
          .join(', ')} RESTART IDENTITY`
      )
    },
    async disconnect() {
      return await getDatabase().disconnect()
    },
    async insert<T>(table: string, data: T) {
      if (data !== null && typeof data === 'object') {
        const columns = Object.keys(data)
        const returnedColumns = columns.slice()
        const values = Object.values(data)

        // always return the id
        if (returnedColumns.indexOf('id') === -1) {
          returnedColumns.push('id')
        }

        const sql = `
          INSERT INTO ${table}
            (${columns.join(',')})
          VALUES
            (${values.map((val, i) => `$${i + 1}`).join(',')})
          RETURNING ${returnedColumns.join(',')}
        `
        const result = await getDatabase().query(sql, values)
        return result.rows
      } else {
        throw new Error('You must provide an Object to insert')
      }
    }
  }
}

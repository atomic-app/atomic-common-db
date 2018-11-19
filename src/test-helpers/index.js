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
    async clean(schema: string) {
      const sql = `
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = '${schema}' AND table_type = 'BASE TABLE'
      `

      // For some reason flow thinks that `result` might be Promise<ResultSet> | ResultSet
      // $FlowFixMe
      const result = await getDatabase().query(sql)

      return await Promise.all(
        result.rows.map(table =>
          getDatabase().query(`DELETE FROM ${schema}.${table['table_name']}`)
        )
      )
    },
    async disconnect() {
      return await getDatabase().disconnect()
    },
    async insert<T>(table: string, data: T) {
      if (data !== null && typeof data === 'object') {
        const columns = Object.keys(data).join(',')
        const values = Object.values(data)
          .map(value => {
            return typeof value === 'string' ? `'${value}'` : value
          })
          .join(',')

        const sql = `
          INSERT INTO ${table}
            (${columns})
          VALUES
            (${values})
          RETURNING id, ${columns}
        `
        const result = await getDatabase().query(sql)
        return result.rows
      } else {
        throw new Error('You must provide an Object to insert')
      }
    }
  }
}

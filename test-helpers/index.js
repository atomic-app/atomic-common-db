"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDBHelper = void 0;

var _index = require("../index");

//  strict
const getDBHelper = connectionString => {
  let db;

  const getDatabase = () => {
    if (!db) {
      db = (0, _index.getDb)(connectionString);
    }

    return db;
  };

  return {
    async query(sql, values) {
      return await getDatabase().query(sql, values);
    },

    async clean(schema) {
      const sql = `
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = '${schema}' AND table_type = 'BASE TABLE'
      `; // For some reason flow thinks that `result` might be Promise<ResultSet> | ResultSet
      // $FlowFixMe

      const result = await getDatabase().query(sql);

      if (!result.rows.length) {
        return;
      }

      return await getDatabase().query(`TRUNCATE TABLE ${result.rows.map(table => `${schema}.${table['table_name']}`).join(', ')} RESTART IDENTITY`);
    },

    async disconnect() {
      return await getDatabase().disconnect();
    },

    async insert(table, data) {
      if (data !== null && typeof data === 'object') {
        const columns = Object.keys(data);
        const returnedColumns = columns.slice();
        const values = Object.values(data); // always return the id

        if (returnedColumns.indexOf('id') === -1) {
          returnedColumns.push('id');
        }

        const sql = `
          INSERT INTO ${table}
            (${columns.join(',')})
          VALUES
            (${values.map((val, i) => `$${i + 1}`).join(',')})
          RETURNING ${returnedColumns.join(',')}
        `;
        const result = await getDatabase().query(sql, values);
        return result.rows;
      } else {
        throw new Error('You must provide an Object to insert');
      }
    }

  };
};

exports.getDBHelper = getDBHelper;
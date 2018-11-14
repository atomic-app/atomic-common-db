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
    async clean(schema) {
      const sql = `
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = '${schema}' AND table_type = 'BASE TABLE'
      `; // For some reason flow thinks that `result` might be Promise<ResultSet> | ResultSet
      // $FlowFixMe

      const result = await getDatabase().query(sql);
      return await Promise.all(result.rows.map(table => getDatabase().query(`DELETE FROM ${schema}.${table['table_name']}`)));
    },

    async insert(table, data) {
      if (data !== null && typeof data === 'object') {
        const columns = Object.keys(data).join(',');
        const values = Object.values(data).map(value => {
          return typeof value === 'string' ? `'${value}'` : value;
        }).join(',');
        const sql = `
          INSERT INTO ${table}
            (${columns})
          VALUES
            (${values})
          RETURNING id, ${columns}
        `;
        const result = await getDatabase().query(sql);
        return result.rows;
      } else {
        throw new Error('You must provide an Object to insert');
      }
    }

  };
};

exports.getDBHelper = getDBHelper;
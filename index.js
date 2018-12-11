"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDb = getDb;
exports.getDefaultDb = getDefaultDb;

var _pg = require("pg");

//  strict
async function query(text, values, pool) {
  const dbClient = await pool.connect();
  const result = await dbClient.query(text, values);
  dbClient.release();
  return result;
}

async function transaction(commands, pool) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const commandsResult = await commands(client);
    await client.query('COMMIT');
    return commandsResult;
  } catch (transactionError) {
    await client.query('ROLLBACK');
    throw transactionError;
  } finally {
    client.release();
  }
}

function getDb(connectionString) {
  let pool;

  const getPool = () => {
    if (!pool) {
      pool = new _pg.Pool({
        connectionString: connectionString
      });
    }

    return pool;
  };

  return {
    getPool,

    async query(text, values) {
      return await query(text, values, getPool());
    },

    async transaction(commands) {
      return await transaction(commands, getPool());
    },

    async disconnect() {
      if (pool) {
        await pool.end();
        pool = null;
      }
    }

  };
}

const DB_VARNAME = process.env.NODE_ENV === 'test' ? 'TEST_DB_URL' : 'DB_URL';
let defaultDb;

function getDefaultDb() {
  if (typeof process.env[DB_VARNAME] === 'undefined' || process.env[DB_VARNAME] === '') {
    throw new Error(`${DB_VARNAME} not provided`);
  }

  if (!defaultDb) {
    defaultDb = getDb(String(process.env[DB_VARNAME]));
  }

  return defaultDb;
}
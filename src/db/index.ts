import Database from "better-sqlite3";

async function initializaDatabase() {

  const option = {verbose: console.log};
  const db = new Database('app.db',option);
  return db;

}

const db = await initializaDatabase();

export default db;

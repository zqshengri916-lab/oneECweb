import path from "node:path";
import { openDatabase, resetCatalog } from "./db.mjs";

const root = path.resolve(import.meta.dirname, "..");
const databasePath =
  process.env.DATABASE_PATH || path.join(root, "data", "qingyu.db");
const db = openDatabase(databasePath);

resetCatalog(db);
db.exec("BEGIN IMMEDIATE");
try {
  db.exec(`
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM cart_items;
    DELETE FROM favorites;
    DELETE FROM sessions;
    DELETE FROM users;
  `);
  db.exec("COMMIT");
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}

console.log(`Reset database to seed catalog: ${databasePath}`);

const fs = require("bun:fs");
import mariadb, { type PoolConnection } from "mariadb";

type ItemDefition = {
	id: number;
	name: string;
	class: number;
	subclass: number;
	quality: number;
	slot: number;
	requiredLevel: number;
	itemSet: number;
	allowableClass: number;
	ilvl: number;
};

const pool = mariadb.createPool({
	host: "db",
	user: "user",
	password: "password",
	database: "wow",
	connectionLimit: 5,
});

async function main() {
	const items: ItemDefition[] = [];

	let conn: PoolConnection | null = null;
	try {
		conn = await pool.getConnection();
		const rows = await conn.query("SELECT * from item_template");
		for (const itemTemplate of rows) {
			items.push(getItemDefinitionFromTemplate(itemTemplate));
		}
	} catch (err) {
		console.log(err);
	} finally {
		if (conn) conn.end();
	}
	fs.writeFileSync(`item_db.json`, JSON.stringify(items, null, 2));
	console.log(`Wrote ${items.length} items to item_db.json`);
}

// biome-ignore lint/suspicious/noExplicitAny: database row
function getItemDefinitionFromTemplate(itemTemplate: any): ItemDefition {
	return {
		id: itemTemplate.entry,
		name: itemTemplate.name,
		class: itemTemplate.class,
		subclass: itemTemplate.subclass,
		quality: itemTemplate.Quality,
		slot: itemTemplate.InventoryType,
		requiredLevel: itemTemplate.RequiredLevel,
		allowableClass: itemTemplate.AllowableClass,
		itemSet: itemTemplate.itemset,
		ilvl: itemTemplate.ItemLevel,
	};
}

await main();

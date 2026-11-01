const Database = require("better-sqlite3")
const db = new Database("./factory.db")

// همه کاربرایی که is_active شون null یا غیرفعاله رو فعال کن
const result = db.prepare("UPDATE users SET is_active = 1 WHERE is_active IS NULL OR is_active != 1").run()
console.log(`✅ ${result.changes} کاربر فعال شدن`)

// نشون بده
const users = db.prepare("SELECT id, username, full_name, role, is_active FROM users").all()
console.log("\n👥 همه کاربرا:")
users.forEach(u => {
  console.log(`  - ${u.username} (${u.full_name}) | ${u.role} | is_active: ${u.is_active}`)
})

db.close()
const Database = require("better-sqlite3")
const db = new Database("factory.db")

const users = db.prepare("SELECT id, username, password, role FROM users").all()

console.log("=== کاربران ===")
users.forEach(u => {
  const isHashed = u.password.startsWith("$2")
  console.log(`${u.username} | ${u.role} | ${isHashed ? "✅ hash شده" : "❌ plain text"} | ${u.password.substring(0, 30)}...`)
})
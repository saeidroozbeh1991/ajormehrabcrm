require("dotenv").config()
const express = require("express")
const path = require("path")
const Database = require("better-sqlite3")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const JWT_SECRET = process.env.JWT_SECRET || "elena-baft-secret-key-2026"
const cors = require("cors")
const rateLimit = require("express-rate-limit")

const SMS_API_KEY = process.env.SMS_API_KEY
const OWNER_PHONE = process.env.OWNER_PHONE


const app = express()
app.set("trust proxy", 1)
const PORT = process.env.PORT || 3000

app.use(cors({
  origin: process.env.FRONTEND_URL || "*"
}))
app.use(express.json())

// غیرفعال کردن کامل کش برای API ها
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0")
  res.set("Pragma", "no-cache")
  res.set("Expires", "0")
  res.set("Surrogate-Control", "no-store")
  next()
})
// محدودیت درخواست برای جلوگیری از حمله bruteforce
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقیقه
  max: 10, // حداکثر ۱۰ تلاش
  message: { success: false, message: "تلاش‌های زیاد. ۱۵ دقیقه بعد امتحان کن" }
})

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // ۱ دقیقه
  max: 100 // حداکثر ۱۰۰ درخواست در دقیقه
})

app.use("/api", apiLimiter)
// =========================
// Middleware احراز هویت
// =========================
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    req.user = null
    return next()
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    
    // اطلاعات کاربر رو از دیتابیس بگیر (که همیشه آپدیت باشه)
    const database = req.app.locals.db
    if (database) {
      const user = database.prepare("SELECT id, username, full_name, role, is_active FROM users WHERE id = ?").get(decoded.id)
      if (user && user.is_active === 1) {
        req.user = user
      } else {
        req.user = null
      }
    } else {
      req.user = decoded
    }
    
    next()
  } catch (error) {
    req.user = null
    next()
  }
}

app.use(authenticateToken)

// =========================
// محافظت از همه /api/* (به‌جز login و health)
// =========================
const PUBLIC_PATHS = [
  "/login",
  "/health",
  "/api/login",
  "/api/health"
]

app.use("/api", (req, res, next) => {
  // مسیرهای عمومی رو رد کن
  if (PUBLIC_PATHS.includes(req.path) || PUBLIC_PATHS.includes(req.originalUrl)) {
    return next()
  }

  // اگه توکن معتبر نبود
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "لطفاً وارد حساب کاربری شوید"
    })
  }

  next()
})
// =========================
// تابع ارسال پیامک
// =========================
// =========================
// Template IDs - خط خدماتی
// =========================
const SMS_TEMPLATES = {
  ORDER_REGISTER: 948549,   // اطلاع‌رسانی ثبت سفارش (قدیمی)
  ORDER_REGISTER_MULTI: 562661, // ← شناسه قالب جدید ثبت سفارش چندمحصولی
  ORDER_SHIPPED: 363147,    // ارسال سفارش مشتری
  DAILY_REPORT: 806829      // گزارش روزانه کارخانه
}

// =========================
// تابع ارسال پیامک (خط خدماتی - verify)
// =========================
// =========================
// کوتاه‌سازی هوشمند مقدار پارامتر
// =========================
function smartTruncate(value, maxLength = 100) {
  const str = String(value || "-").trim()
  if (str.length <= maxLength) return str

  // از آخر ببر تا به فاصله برسیم (کلمه سالم بمونه)
  let truncated = str.substring(0, maxLength - 3)
  const lastSpace = truncated.lastIndexOf(" ")
  if (lastSpace > 10) {
    truncated = truncated.substring(0, lastSpace)
  }

  return truncated.trim() + "..."
}

async function sendSMS(mobile, templateId, parameters, options = {}) {
  try {
    if (!SMS_API_KEY) {
      console.error("❌ کلید API پیامک تنظیم نشده")
      return { success: false, message: "تنظیمات پیامک ناقص است" }
    }

    const skipTruncate = options.skipTruncate || []

    // کوتاه‌سازی هوشمند همه پارامترها قبل از ارسال (به‌جز پارامترهای مجاز)
    const safeParameters = parameters.map((p) => ({
      name: p.name,
      value: skipTruncate.includes(p.name)
        ? String(p.value || "-")
        : smartTruncate(p.value, 100)
    }))

    // timeout ۱۰ ثانیه‌ای برای جلوگیری از hang شدن
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch("https://api.sms.ir/v1/send/verify", {
      method: "POST",
      headers: {
        "X-API-KEY": SMS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mobile: mobile,
        templateId: templateId,
        parameters: safeParameters
      }),
      signal: controller.signal
    })

    clearTimeout(timeout)

    const data = await response.json()

    if (data.status === 1) {
      console.log("✅ پیامک ارسال شد:", mobile)
      return { success: true, data }
    } else {
      console.error("❌ خطا در ارسال پیامک:", data)
      return { success: false, message: data.message }
    }
  } catch (error) {
    console.error("❌ خطا در ارسال پیامک:", error)
    return { success: false, message: "خطا در ارتباط با SMS.ir" }
  }
}
const fs = require("fs")

// مسیر دیتابیس روی دیسک دائمی
const DATA_DIR = "/app/data"

// اگه پوشه وجود نداره، بساز
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const DB_PATH = path.join(DATA_DIR, "factory.db")
const db = new Database(DB_PATH)
// ذخیره db توی app.locals که از authenticateToken قابل دسترس باشه
app.locals.db = db

// پوشه بک‌آپ روی دیسک دائمی
const BACKUP_DIR = path.join(DATA_DIR, "backups")
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}
// پوشه آپلود عکس‌های چت (روی دیسک دائمی)
const CHAT_UPLOAD_DIR = path.join(DATA_DIR, "chat-uploads")
if (!fs.existsSync(CHAT_UPLOAD_DIR)) {
  fs.mkdirSync(CHAT_UPLOAD_DIR, { recursive: true })
}

// سرو کردن فایل‌های استاتیک چت
app.use("/chat-uploads", express.static(CHAT_UPLOAD_DIR))
// تابع بک‌آپ گرفتن
function createBackup() {
  try {
    const today = new Date()
    const dateStr = today.toISOString().split("T")[0] // 2026-09-16
    const timeStr = today.toTimeString().split(" ")[0].replace(/:/g, "-") // 04-00-00
    const fileName = `factory-${dateStr}-${timeStr}.db`
    const backupPath = path.join(BACKUP_DIR, fileName)

    fs.copyFileSync(DB_PATH, backupPath)

    console.log(`✅ بک‌آپ گرفته شد: ${fileName}`)

    // =========================
    // پاک کردن بک‌آپ‌های قدیمی‌تر از ۱۴ روز
    // =========================
    const MAX_AGE_DAYS = 14
    const now = Date.now()
    const maxAgeMs = MAX_AGE_DAYS * 24 * 60 * 60 * 1000

    const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".db"))

    files.forEach((file) => {
      const filePath = path.join(BACKUP_DIR, file)
      const stats = fs.statSync(filePath)
      const age = now - stats.mtimeMs

      if (age > maxAgeMs) {
        fs.unlinkSync(filePath)
        console.log(`🗑️ بک‌آپ قدیمی پاک شد: ${file}`)
      }
    })

    return fileName
  } catch (error) {
    console.error("❌ خطا در بک‌آپ:", error)
    return null
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    address TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

try { db.exec(`ALTER TABLE customers ADD COLUMN register_date TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE customers ADD COLUMN created_by TEXT`) } catch (err) {}
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'viewer',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)
// جدول خروجی‌ها
db.exec(`
  CREATE TABLE IF NOT EXISTS shipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    carrier TEXT,
    status TEXT DEFAULT 'pending',
    created_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    -- فیلدهای کارخانه (بعد از تأیید)
    exit_number TEXT,
    exit_date TEXT,
    customer_phone TEXT,
    vehicle_plate TEXT,
    total_rolls INTEGER,
    defective_rolls INTEGER,
    total_weight REAL,
    excel_code TEXT,
    destination TEXT,
    
    approved_by TEXT,
    approved_at TEXT,
    reject_reason TEXT
  )
`)

// اضافه کردن فیلد driver_name به جدول shipments (اگه نباشه)
try {
  db.exec(`ALTER TABLE shipments ADD COLUMN driver_name TEXT`)
} catch (err) {}

try {
  db.exec(`ALTER TABLE shipments ADD COLUMN is_deleted INTEGER DEFAULT 0`)
} catch (err) {}

// جدول اقلام خروجی
db.exec(`
  CREATE TABLE IF NOT EXISTS shipment_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    rolls INTEGER DEFAULT 0,
    machine TEXT,
    warehouse_code TEXT,
    
    -- فیلدهای تأیید هر قلم
    item_status TEXT DEFAULT 'pending',
    approved_rolls INTEGER,
    defective_rolls INTEGER,
    total_weight REAL,
    item_reject_reason TEXT,
    defect_notes TEXT,
    excel_code TEXT,
    
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
  )
`)

// اضافه کردن فیلدهای جدید به shipment_items (اگه از قبل وجود داشته)
try {
  db.exec(`ALTER TABLE shipment_items ADD COLUMN defect_notes TEXT`)
} catch (err) {}

try {
  db.exec(`ALTER TABLE shipment_items ADD COLUMN excel_code TEXT`)
} catch (err) {}
try {
  db.exec(`ALTER TABLE shipment_items ADD COLUMN item_status TEXT DEFAULT 'pending'`)
} catch (err) {}

try {
  db.exec(`ALTER TABLE shipment_items ADD COLUMN item_reject_reason TEXT`)
} catch (err) {}
try {
  db.exec(`ALTER TABLE shipment_items ADD COLUMN warehouse_code TEXT`)
} catch (err) {}

try {
  db.exec(`ALTER TABLE shipment_items ADD COLUMN approved_rolls INTEGER`)
} catch (err) {}

try {
  db.exec(`ALTER TABLE shipment_items ADD COLUMN defective_rolls INTEGER`)
} catch (err) {}

try {
  db.exec(`ALTER TABLE shipment_items ADD COLUMN total_weight REAL`)
} catch (err) {}
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    category TEXT,
    unit TEXT DEFAULT 'کیلوگرم',
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)
db.exec(`
  CREATE TABLE IF NOT EXISTS edit_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    old_data TEXT,
    new_data TEXT,
    edited_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

// =========================
// اضافه کردن ستون‌های soft delete به جدول‌ها
// =========================

// اول جدول‌ها رو بساز (اگه نباشن)
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_date TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    clay_type TEXT,
    brick_type TEXT,
    quantity REAL NOT NULL,
    kiln TEXT,
    priority TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

// شماره سفارش (شروع از ۱۰۰)
try { db.exec(`ALTER TABLE orders ADD COLUMN order_number INTEGER`) } catch (err) {}

// جدول اقلام سفارش
db.exec(`
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    category TEXT,
    brick_type TEXT,
    clay_type TEXT,
    quantity REAL NOT NULL,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  )
`)

// تنظیم شماره برای سفارش‌های قدیمی (اگه NULL باشن)
try {
  const oldOrders = db.prepare(`
    SELECT id FROM orders
    WHERE order_number IS NULL
    ORDER BY id ASC
  `).all()

  if (oldOrders.length > 0) {
    const maxRow = db.prepare("SELECT COALESCE(MAX(order_number), 99) as maxNum FROM orders").get()
    let nextNum = Number(maxRow.maxNum) + 1

    const updateStmt = db.prepare("UPDATE orders SET order_number = ? WHERE id = ?")
    oldOrders.forEach((o) => {
      updateStmt.run(nextNum, o.id)
      nextNum++
    })
  }
} catch (err) {
  console.error("خطا در تنظیم شماره سفارش‌های قدیمی:", err)
}

db.exec(`
  CREATE TABLE IF NOT EXISTS exits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exit_group_id TEXT,
    customer_name TEXT NOT NULL,
    exit_date TEXT NOT NULL,
    category TEXT,
    product_name TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT DEFAULT 'عدد',
    order_id INTEGER,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_by TEXT,
    approved_by TEXT,
    approved_at TEXT,
    reject_reason TEXT,
    payment_type TEXT,
    payment_notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

// اضافه کردن ستون به جدول موجود (اگه از قبل ساخته شده)
try { db.exec(`ALTER TABLE exits ADD COLUMN exit_group_id TEXT`) } catch (err) {}

// بعد ستون‌ها رو اضافه کن (اگه نباشن)
try { db.exec(`ALTER TABLE orders ADD COLUMN is_deleted INTEGER DEFAULT 0`) } catch (err) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN deleted_at TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN deleted_by TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN delete_reason TEXT`) } catch (err) {}

try { db.exec(`ALTER TABLE customers ADD COLUMN is_deleted INTEGER DEFAULT 0`) } catch (err) {}
try { db.exec(`ALTER TABLE customers ADD COLUMN deleted_at TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE customers ADD COLUMN deleted_by TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE customers ADD COLUMN delete_reason TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE customers ADD COLUMN register_date TEXT`) } catch (err) {}

try { db.exec(`ALTER TABLE production ADD COLUMN is_deleted INTEGER DEFAULT 0`) } catch (err) {}
try { db.exec(`ALTER TABLE production ADD COLUMN deleted_at TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE production ADD COLUMN deleted_by TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE production ADD COLUMN delete_reason TEXT`) } catch (err) {}

try { db.exec(`ALTER TABLE exits ADD COLUMN is_deleted INTEGER DEFAULT 0`) } catch (err) {}
try { db.exec(`ALTER TABLE exits ADD COLUMN deleted_at TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE exits ADD COLUMN deleted_by TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE exits ADD COLUMN delete_reason TEXT`) } catch (err) {}
// =========================
// اضافه کردن ستون‌های soft delete به جدول‌ها
// =========================

// اول جدول‌ها رو بساز (اگه نباشن)
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_date TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    clay_type TEXT,
    brick_type TEXT,
    quantity REAL NOT NULL,
    kiln TEXT,
    priority TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

try { db.exec(`ALTER TABLE orders ADD COLUMN created_by TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN is_transferred INTEGER DEFAULT 0`) } catch (err) {}
db.exec(`
  CREATE TABLE IF NOT EXISTS exits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    exit_date TEXT NOT NULL,
    category TEXT,
    product_name TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT DEFAULT 'عدد',
    order_id INTEGER,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_by TEXT,
    approved_by TEXT,
    approved_at TEXT,
    reject_reason TEXT,
    payment_type TEXT,
    payment_notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

// بعد ستون‌ها رو اضافه کن (اگه نباشن)
try { db.exec(`ALTER TABLE orders ADD COLUMN is_deleted INTEGER DEFAULT 0`) } catch (err) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN deleted_at TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN deleted_by TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN delete_reason TEXT`) } catch (err) {}

try { db.exec(`ALTER TABLE customers ADD COLUMN is_deleted INTEGER DEFAULT 0`) } catch (err) {}
try { db.exec(`ALTER TABLE customers ADD COLUMN deleted_at TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE customers ADD COLUMN deleted_by TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE customers ADD COLUMN delete_reason TEXT`) } catch (err) {}

try { db.exec(`ALTER TABLE production ADD COLUMN is_deleted INTEGER DEFAULT 0`) } catch (err) {}
try { db.exec(`ALTER TABLE production ADD COLUMN deleted_at TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE production ADD COLUMN deleted_by TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE production ADD COLUMN delete_reason TEXT`) } catch (err) {}

try { db.exec(`ALTER TABLE exits ADD COLUMN is_deleted INTEGER DEFAULT 0`) } catch (err) {}
try { db.exec(`ALTER TABLE exits ADD COLUMN deleted_at TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE exits ADD COLUMN deleted_by TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE exits ADD COLUMN delete_reason TEXT`) } catch (err) {}

try { db.exec(`ALTER TABLE products ADD COLUMN is_deleted INTEGER DEFAULT 0`) } catch (err) {}
try { db.exec(`ALTER TABLE products ADD COLUMN deleted_at TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE products ADD COLUMN deleted_by TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE products ADD COLUMN delete_reason TEXT`) } catch (err) {}

try { db.exec(`ALTER TABLE shipments ADD COLUMN deleted_at TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE shipments ADD COLUMN deleted_by TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE shipments ADD COLUMN delete_reason TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE products ADD COLUMN is_deleted INTEGER DEFAULT 0`) } catch (err) {}
try { db.exec(`ALTER TABLE products ADD COLUMN deleted_at TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE products ADD COLUMN deleted_by TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE products ADD COLUMN delete_reason TEXT`) } catch (err) {}

try { db.exec(`ALTER TABLE shipments ADD COLUMN deleted_at TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE shipments ADD COLUMN deleted_by TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE shipments ADD COLUMN delete_reason TEXT`) } catch (err) {}
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_date TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    clay_type TEXT,
    brick_type TEXT,
    quantity REAL NOT NULL,
    kiln TEXT,
    priority TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)
// =========================
// جدول خروجی‌های جدید (exits)
// =========================
db.exec(`
  CREATE TABLE IF NOT EXISTS exits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    exit_date TEXT NOT NULL,
    category TEXT,
    product_name TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT DEFAULT 'عدد',
    order_id INTEGER,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_by TEXT,
    approved_by TEXT,
    approved_at TEXT,
    reject_reason TEXT,
    payment_type TEXT,
    payment_notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

// اضافه کردن فیلدهای مالی (اگه نباشن)
try {
  db.exec(`ALTER TABLE exits ADD COLUMN payment_type TEXT`)
} catch (err) {}

try {
  db.exec(`ALTER TABLE exits ADD COLUMN payment_notes TEXT`)
} catch (err) {}
db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_role TEXT,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info',
    exit_id INTEGER,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)
// اضافه کردن ستون category به جدول orders (اگه نباشه)
try {
  db.exec(`ALTER TABLE orders ADD COLUMN category TEXT`)
} catch (err) {}

// =========================
// اضافه کردن ستون‌های راننده و خودرو به جدول exits
// =========================
try { db.exec(`ALTER TABLE exits ADD COLUMN driver_name TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE exits ADD COLUMN driver_phone TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE exits ADD COLUMN vehicle_plate TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE exits ADD COLUMN vehicle_type TEXT`) } catch (err) {}

// 👇 این خط رو اضافه کن
try { db.exec(`ALTER TABLE exits ADD COLUMN is_extra INTEGER DEFAULT 0`) } catch (err) {}

// علت کسری (کمتر از سفارش ارسال شده)
try { db.exec(`ALTER TABLE exits ADD COLUMN shortage_reason TEXT`) } catch (err) {}

// وضعیت بسته شدن سفارش (آیا باقی‌مانده در سفارش بعدی ارسال شود؟)
try { db.exec(`ALTER TABLE exits ADD COLUMN close_order INTEGER DEFAULT 0`) } catch (err) {}


app.get("/api/health", (req, res) => {
  res.json({
    message: "سرور آجر نسوز محراب با موفقیت فعال است"
  })
})

// دریافت اعتبار پیامکی از sms.ir
app.get("/api/sms-credit", async (req, res) => {
  try {
    if (!SMS_API_KEY) {
      return res.json({ success: false, message: "کلید API تنظیم نشده" })
    }

    const response = await fetch("https://api.sms.ir/v1/credit", {
      method: "GET",
      headers: {
        "X-API-KEY": SMS_API_KEY,
        "Content-Type": "application/json"
      }
    })

    const data = await response.json()

    if (data.status === 1) {
      res.json({ success: true, credit: data.data })
    } else {
      res.json({ success: false, message: data.message || "خطا در دریافت اعتبار" })
    }
  } catch (error) {
    console.error("خطا در دریافت اعتبار پیامک:", error)
    res.json({ success: false, message: "خطا در ارتباط با SMS.ir" })
  }
})
app.post("/api/orders", async (req, res) => {
  const {
    order_date,
    customer_name,
    kiln,
    priority,
    notes,
    items
  } = req.body

  console.log("ORDER BODY:", JSON.stringify(req.body))

  if (!order_date || !customer_name || !items || items.length === 0) {
    return res.json({ success: false, message: "اطلاعات سفارش ناقص است" })
  }

  try {
    // شماره سفارش بعدی (شروع از ۱۰۰)
    const maxRow = db.prepare("SELECT COALESCE(MAX(order_number), 99) as maxNum FROM orders").get()
    const nextOrderNumber = Number(maxRow.maxNum) + 1

    // مجموع تعداد اقلام (برای سازگاری با کدهای قدیمی)
    const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)

    // استفاده از اولین قلم برای فیلدهای قدیمی orders (برای سازگاری موقت)
    const firstItem = items[0]

    const stmt = db.prepare(`
      INSERT INTO orders (
        order_date,
        customer_name,
        category,
        brick_type,
        quantity,
        kiln,
        priority,
        notes,
        order_number,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
      order_date,
      customer_name,
      firstItem.category || null,
      firstItem.brick_type || null,
      totalQuantity,
      kiln || null,
      priority,
      notes,
      nextOrderNumber,
      req.user?.username || "نامشخص"
    )

    const orderId = result.lastInsertRowid

    // ذخیره اقلام
    const itemStmt = db.prepare(`
      INSERT INTO order_items (
        order_id,
        category,
        brick_type,
        quantity,
        notes
      )
      VALUES (?, ?, ?, ?, ?)
    `)

    items.forEach((item) => {
      itemStmt.run(
        orderId,
        item.category || null,
        item.brick_type || null,
        Number(item.quantity || 0),
        item.notes || null
      )
    })

    // =========================
    // ارسال پیامک به مشتری (چند پیامکی در صورت طولانی بودن نام محصولات)
    // =========================
    try {
      const customer = db
        .prepare("SELECT * FROM customers WHERE name = ?")
        .get(customer_name)

      if (customer && customer.phone && customer.phone.length === 11) {
        const productNames = items.map(item => item.brick_type || "-")
        
        const MAX_PRODUCTS_LENGTH = 100
        const chunks = []
        let currentChunk = []
        let currentLength = 0

        productNames.forEach((name) => {
          const nameLength = name.length + (currentChunk.length > 0 ? 2 : 0)
          if (currentLength + nameLength > MAX_PRODUCTS_LENGTH && currentChunk.length > 0) {
            chunks.push(currentChunk)
            currentChunk = [name]
            currentLength = name.length
          } else {
            currentChunk.push(name)
            currentLength += nameLength
          }
        })
        if (currentChunk.length > 0) chunks.push(currentChunk)

        const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)

        for (let i = 0; i < chunks.length; i++) {
          const productsText = chunks[i].join("، ")
          await sendSMS(customer.phone, SMS_TEMPLATES.ORDER_REGISTER_MULTI, [
            { name: "NAME", value: customer.name },
            { name: "ORDER_NUMBER", value: String(nextOrderNumber) },
            { name: "PRODUCTS", value: productsText },
            { name: "QUANTITY", value: String(totalQuantity.toLocaleString()) },
            { name: "DATE", value: order_date || "-" }
          ], { skipTruncate: ["PRODUCTS", "ORDER_NUMBER"] })
        }
      }
    } catch (error) {
      console.error("خطا در ارسال پیامک سفارش:", error)
    }

    res.json({
      success: true,
      id: orderId,
      order_number: nextOrderNumber
    })
  } catch (error) {
    console.error("خطا در ثبت سفارش:", error)
    res.json({ success: false, message: error.message })
  }
})
app.get("/api/orders", (req, res) => {
  const orders = db
    .prepare(`
      SELECT o.*, u.full_name AS created_by_full_name
      FROM orders o
      LEFT JOIN users u ON u.username = o.created_by
      WHERE o.is_deleted = 0 OR o.is_deleted IS NULL
      ORDER BY o.id DESC
    `)
    .all()

  const itemsStmt = db.prepare(`
    SELECT * FROM order_items
    WHERE order_id = ?
    ORDER BY id ASC
  `)

  const result = orders.map((order) => {
    const rejectedExit = db.prepare(`
      SELECT id, reject_reason FROM exits
      WHERE order_id = ?
        AND status = 'rejected'
        AND (is_deleted = 0 OR is_deleted IS NULL)
      ORDER BY id DESC
      LIMIT 1
    `).get(order.id)

    const items = itemsStmt.all(order.id)

    // محاسبه مقدار خروجی رفته (بدون احتساب بار اضافه و رد شده)
    const shippedRow = db.prepare(`
      SELECT COALESCE(SUM(quantity), 0) as total
      FROM exits
      WHERE order_id = ?
        AND status != 'rejected'
        AND (is_extra = 0 OR is_extra IS NULL)
        AND (is_deleted = 0 OR is_deleted IS NULL)
    `).get(order.id)

    return {
      ...order,
      items,
      total_shipped: shippedRow.total || 0,
      hasRejectedExit: !!rejectedExit,
      rejectedExitReason: rejectedExit?.reject_reason || null
    }
  })
  res.json(result)
})
// حذف سفارش (soft delete)
app.delete("/api/orders/:id", (req, res) => {
  const { id } = req.params
  const { delete_reason } = req.body || {}

  const oldData = db.prepare("SELECT * FROM orders WHERE id = ?").get(id)

  if (!oldData) {
    return res.json({ success: false, message: "سفارش پیدا نشد" })
  }

  // =========================
  // چک کن خروجی تأیید شده داره یا نه
  // =========================
  const approvedExits = db.prepare(`
    SELECT id, product_name, quantity, exit_date
    FROM exits
    WHERE order_id = ?
      AND status = 'approved'
      AND (is_deleted = 0 OR is_deleted IS NULL)
  `).all(id)

  if (approvedExits.length > 0) {
    return res.json({
      success: false,
      blocked: true,
      message: `این سفارش دارای ${approvedExits.length} خروجی تأیید مالی شده است و قابل حذف نیست.`,
      details: approvedExits
    })
  }

  db.prepare(`
    UPDATE orders
    SET is_deleted = 1,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_by = ?,
        delete_reason = ?
    WHERE id = ?
  `).run(
    req.user?.username || "نامشخص",
    delete_reason || null,
    id
  )

  db.prepare(`
    INSERT INTO edit_history (table_name, record_id, action, old_data)
    VALUES (?, ?, ?, ?)
  `).run("orders", id, "delete", JSON.stringify(oldData))

  res.json({ success: true })
})
// تسویه سفارش (علامت‌گذاری به عنوان منتقل‌شده)
app.put("/api/orders/:id/transfer", (req, res) => {
  const { id } = req.params
  
  try {
    db.prepare(`
      UPDATE orders 
      SET is_transferred = 1 
      WHERE id = ?
    `).run(id)
    
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا در تسویه سفارش" })
  }
})

// ویرایش سفارش
app.put("/api/orders/:id", async (req, res) => {
  const { id } = req.params
  const {
    order_date,
    customer_name,
    kiln,
    priority,
    notes,
    items
  } = req.body

  const oldData = db.prepare("SELECT * FROM orders WHERE id = ?").get(id)

  if (!oldData) {
    return res.json({ success: false, message: "سفارش پیدا نشد" })
  }

  try {
    const totalQuantity = Array.isArray(items)
      ? items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
      : Number(oldData.quantity || 0)

    const firstItem = Array.isArray(items) && items.length > 0 ? items[0] : null

    db.prepare(`
      UPDATE orders
      SET order_date = ?, customer_name = ?, category = ?,
          brick_type = ?, quantity = ?, kiln = ?, priority = ?, notes = ?
      WHERE id = ?
    `).run(
      order_date,
      customer_name,
      firstItem?.category || oldData.category,
      firstItem?.brick_type || oldData.brick_type,
      totalQuantity,
      kiln,
      priority,
      notes,
      id
    )

    // آپدیت اقلام: پاک کردن قبلی‌ها و درج جدیدها
    if (Array.isArray(items)) {
      db.prepare("DELETE FROM order_items WHERE order_id = ?").run(id)

      const itemStmt = db.prepare(`
        INSERT INTO order_items (
          order_id,
          category,
          brick_type,
          quantity,
          notes
        )
        VALUES (?, ?, ?, ?, ?)
      `)

      items.forEach((item) => {
        itemStmt.run(
          id,
          item.category || null,
          item.brick_type || null,
          Number(item.quantity || 0),
          item.notes || null
        )
      })
    }
    const newData = db.prepare("SELECT * FROM orders WHERE id = ?").get(id)

    // آپدیت اسم مشتری توی جدول خروجی‌های مرتبط
    if (oldData.customer_name !== customer_name) {
      db.prepare("UPDATE exits SET customer_name = ? WHERE order_id = ?").run(customer_name, id)
    }

    db.prepare(`
      INSERT INTO edit_history (table_name, record_id, action, old_data, new_data)
      VALUES (?, ?, ?, ?, ?)
    `).run("orders", id, "edit", JSON.stringify(oldData), JSON.stringify(newData))

    // =========================
    // ارسال پیامک به مشتری جدید (اگه مشتری عوض شده باشه)
    // =========================
    if (oldData.customer_name !== customer_name) {
      try {
        const newCustomer = db
          .prepare("SELECT * FROM customers WHERE name = ?")
          .get(customer_name)

        if (newCustomer && newCustomer.phone && newCustomer.phone.length === 11) {
          const productNames = Array.isArray(items) && items.length > 0
            ? items.map((item) => item.brick_type || "-")
            : [oldData.brick_type || "-"]

          const totalQuantity = Array.isArray(items) && items.length > 0
            ? items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
            : Number(oldData.quantity || 0)
          // تقسیم محصولات به دسته‌های حداکثر ۱۰۰ کاراکتری
          const MAX_PRODUCTS_LENGTH = 100
          const chunks = []
          let currentChunk = []
          let currentLength = 0

          productNames.forEach((name) => {
            const nameLength = name.length + (currentChunk.length > 0 ? 2 : 0)
            if (currentLength + nameLength > MAX_PRODUCTS_LENGTH && currentChunk.length > 0) {
              chunks.push(currentChunk)
              currentChunk = [name]
              currentLength = name.length
            } else {
              currentChunk.push(name)
              currentLength += nameLength
            }
          })
          if (currentChunk.length > 0) chunks.push(currentChunk)

          for (let i = 0; i < chunks.length; i++) {
            const productsText = chunks[i].join("، ")

            await sendSMS(newCustomer.phone, SMS_TEMPLATES.ORDER_REGISTER_MULTI, [
              { name: "NAME", value: newCustomer.name },
              { name: "ORDER_NUMBER", value: String(oldData.order_number || "-") },
              { name: "PRODUCTS", value: productsText },
              { name: "QUANTITY", value: String(totalQuantity.toLocaleString()) },
              { name: "DATE", value: order_date || "-" }
            ], { skipTruncate: ["PRODUCTS", "ORDER_NUMBER"] })
          }
        }
      } catch (error) {
        console.error("خطا در ارسال پیامک ویرایش سفارش:", error)
      }
    }

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: error.message })
  }
})
db.exec(`
  CREATE TABLE IF NOT EXISTS production (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    production_date TEXT NOT NULL,
    kiln TEXT,
    product_name TEXT NOT NULL,
    quantity REAL NOT NULL,
    notes TEXT,
    order_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

try { db.exec(`ALTER TABLE production ADD COLUMN production_type TEXT DEFAULT 'final'`) } catch (err) {}

try { db.exec(`ALTER TABLE production ADD COLUMN created_by TEXT`) } catch (err) {}
// اضافه کردن ستون unit به جدول production (اگه نباشه)
try {
  db.exec(`ALTER TABLE production ADD COLUMN unit TEXT DEFAULT 'عدد'`)
  console.log("✅ ستون unit اضافه شد")
} catch (err) {
  console.log("ستون unit از قبل وجود داره")
}

// اضافه کردن ستون order_id (اگه نباشه)
try {
  db.exec(`ALTER TABLE production ADD COLUMN order_id INTEGER`)
} catch (err) {
  // ستون از قبل وجود داره
}

// حذف NOT NULL از kiln (اگه لازم باشه)
try {
  const tableInfo = db.prepare("PRAGMA table_info(production)").all()
  const kilnCol = tableInfo.find((c) => c.name === "kiln")
  
  if (kilnCol && kilnCol.notnull === 1) {
    db.exec(`
      CREATE TABLE production_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        production_date TEXT NOT NULL,
        kiln TEXT,
        product_name TEXT NOT NULL,
        quantity REAL NOT NULL,
        notes TEXT,
        order_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
        db.exec(`INSERT INTO production_new (id, production_date, kiln, product_name, quantity, notes, created_at)
             SELECT id, production_date, kiln, product_name, quantity, notes, created_at FROM production`)
    db.exec(`DROP TABLE production`)
    db.exec(`ALTER TABLE production_new RENAME TO production`)
    
    console.log("✅ جدول production بازسازی شد")
  }
} catch (err) {
  console.log("⚠️ migration:", err.message)
}
app.post("/api/production", (req, res) => {
  const {
    production_date,
    kiln,
    product_name,
    quantity,
    unit,
    notes,
    order_id,
    production_type
  } = req.body

  try {
    const stmt = db.prepare(`
      INSERT INTO production (
        production_date,
        kiln,
        product_name,
        quantity,
        unit,
        notes,
        order_id,
        production_type,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
      production_date,
      kiln || null,
      product_name,
      quantity,
      unit || "عدد",
      notes,
      order_id || null,
      production_type || "final",
      req.user?.username || "نامشخص"
    )

    res.json({
      success: true,
      id: result.lastInsertRowid
    })
  } catch (error) {
    console.error("خطا در ثبت تولید:", error)
    res.json({ success: false, message: error.message })
  }
})
app.post("/api/customers", (req, res) => {
  const {
    name,
    phone,
    company,
    register_date
  } = req.body

  // چک تکراری بودن شماره تماس
  if (phone) {
    const existing = db.prepare(`
      SELECT id, name FROM customers
      WHERE phone = ?
        AND (is_deleted = 0 OR is_deleted IS NULL)
    `).get(phone)

    if (existing) {
      return res.json({
        success: false,
        message: `این شماره تماس قبلاً برای مشتری «${existing.name}» ثبت شده است`
      })
    }
  }

  const stmt = db.prepare(`
    INSERT INTO customers (
      name,
      phone,
      company,
      register_date,
      created_by
    )
    VALUES (?, ?, ?, ?, ?)
  `)

  const result = stmt.run(
    name,
    phone,
    company,
    register_date || null,
    req.user?.username || "نامشخص"
  )

  res.json({
    success: true,
    id: result.lastInsertRowid
  })
})

app.get("/api/customers", (req, res) => {
  try {
    const customers = db
      .prepare(`
        SELECT c.*, u.full_name AS created_by_full_name
        FROM customers c
        LEFT JOIN users u ON u.username = c.created_by
        WHERE c.is_deleted = 0 OR c.is_deleted IS NULL
        ORDER BY c.id DESC
      `)
      .all()
    res.json(customers)
  } catch (error) {
    console.error("GET CUSTOMERS ERROR:", error)
    res.json([])
  }
})
// حذف مشتری (soft delete)
app.delete("/api/customers/:id", (req, res) => {
  const { id } = req.params
  const { delete_reason } = req.body || {}

  const oldData = db.prepare("SELECT * FROM customers WHERE id = ?").get(id)

  if (!oldData) {
    return res.json({ success: false, message: "مشتری پیدا نشد" })
  }

  // =========================
  // چک کن خروجی تأیید شده داره یا نه
  // =========================
  const approvedExits = db.prepare(`
    SELECT e.id, e.product_name, e.quantity, e.exit_date
    FROM exits e
    WHERE e.customer_name = ?
      AND e.status = 'approved'
      AND (e.is_deleted = 0 OR e.is_deleted IS NULL)
  `).all(oldData.name)

  if (approvedExits.length > 0) {
    return res.json({
      success: false,
      blocked: true,
      message: `این مشتری دارای ${approvedExits.length} خروجی تأیید مالی شده است و قابل حذف نیست.`,
      details: approvedExits
    })
  }

  db.prepare(`
    UPDATE customers
    SET is_deleted = 1,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_by = ?,
        delete_reason = ?
    WHERE id = ?
  `).run(
    req.user?.username || "نامشخص",
    delete_reason || null,
    id
  )

  db.prepare(`
    INSERT INTO edit_history (table_name, record_id, action, old_data)
    VALUES (?, ?, ?, ?)
  `).run("customers", id, "delete", JSON.stringify(oldData))

  res.json({ success: true })
})
// ویرایش مشتری
app.put("/api/customers/:id", (req, res) => {
  const { id } = req.params
  const { name, phone, company, register_date } = req.body

  const oldData = db.prepare("SELECT * FROM customers WHERE id = ?").get(id)

  if (!oldData) {
    return res.json({ success: false, message: "مشتری پیدا نشد" })
  }

  db.prepare(`
    UPDATE customers
    SET name = ?, phone = ?, company = ?, register_date = ?
    WHERE id = ?
  `).run(name, phone, company, register_date || null, id)
  const newData = db.prepare("SELECT * FROM customers WHERE id = ?").get(id)

  db.prepare(`
    INSERT INTO edit_history (table_name, record_id, action, old_data, new_data)
    VALUES (?, ?, ?, ?, ?)
  `).run("customers", id, "edit", JSON.stringify(oldData), JSON.stringify(newData))

  res.json({ success: true })
})
// تاریخچه ویرایش‌ها
app.get("/api/history", (req, res) => {
  const history = db
    .prepare("SELECT * FROM edit_history ORDER BY id DESC LIMIT 100")
    .all()

  res.json(history)
})
// =========================
// اضافه کردن محصولات پیش‌فرض
// =========================

const defaultProducts = [
  // =========================
  // آجرهای صنعتی
  // =========================
  { name: "آجر تخت 11.5*23 ضخامت 3", category: "آجرهای صنعتی", unit: "عدد" },
  { name: "آجر تخت 11.5*23 ضخامت 4", category: "آجرهای صنعتی", unit: "عدد" },
  { name: "آجر تخت 11.5*23 ضخامت 6", category: "آجرهای صنعتی", unit: "عدد" },
  { name: "آجر تخت 11.5*23 ضخامت 6.4", category: "آجرهای صنعتی", unit: "عدد" },
  { name: "آجر تخت 12.5*25 ضخامت 7.6", category: "آجرهای صنعتی", unit: "عدد" },
  { name: "آجر تخت 12.5*25 ضخامت 6.4", category: "آجرهای صنعتی", unit: "عدد" },
  { name: "آجر بغل کونیک 11.5*23 ضخامت 5.5 به 6.5", category: "آجرهای صنعتی", unit: "عدد" },
  { name: "آجر سر کونیک 11.5*23 ضخامت 5 به 6", category: "آجرهای صنعتی", unit: "عدد" },
  { name: "آجر بغل کونیک 11.5*23 ضخامت 6 به 7", category: "آجرهای صنعتی", unit: "عدد" },
  { name: "آجر ایزو کونیک 20*20 ضخامت 6 به 8", category: "آجرهای صنعتی", unit: "عدد" },
  { name: "آجر ایزو کونیک 20*20 ضخامت 8 به 9", category: "آجرهای صنعتی", unit: "عدد" },
  { name: "آجر کف 25*25 ضخامت 6.4", category: "آجرهای صنعتی", unit: "عدد" },
  { name: "آجر کف 25*25 ضخامت 9", category: "آجرهای صنعتی", unit: "عدد" },
  { name: "آجر پل 40*20 ضخامت 6", category: "آجرهای صنعتی", unit: "عدد" },
  { name: "آجر پل 40*20 ضخامت 8", category: "آجرهای صنعتی", unit: "عدد" },
  { name: "آجر دهنه 50", category: "آجرهای صنعتی", unit: "قالب" },
  { name: "آجر دهنه 70", category: "آجرهای صنعتی", unit: "قالب" },
  { name: "آجر دهنه 90", category: "آجرهای صنعتی", unit: "قالب" },
  { name: "آجر زیر بوته 35 ضخامت 10", category: "آجرهای صنعتی", unit: "عدد" },
  { name: "آجر زیر بوته 50 ضخامت 9", category: "آجرهای صنعتی", unit: "عدد" },

  // =========================
  // آجرهای نسوز شاموت
  // =========================
  { name: "پلاک شاموت 20*5.5 ضخامت 2.5", category: "آجرهای نسوز شاموت", unit: "عدد" },
  { name: "پلاک شاموت 26*5.5 ضخامت 2.5", category: "آجرهای نسوز شاموت", unit: "عدد" },
  { name: "پلاک شاموت 7*32 ضخامت 2.5", category: "آجرهای نسوز شاموت", unit: "عدد" },
  { name: "پلاک شاموت 20*20 ضخامت 2.7", category: "آجرهای نسوز شاموت", unit: "عدد" },
  { name: "پلاک شومینه شاموت 15*7.5 ضخامت 2.5", category: "آجرهای نسوز شاموت", unit: "عدد" },
  { name: "پلاک شاموت 20*40 ضخامت 3", category: "آجرهای نسوز شاموت", unit: "عدد" },
  { name: "پلاک رومی شاموت 20*40 ضخامت 3", category: "آجرهای نسوز شاموت", unit: "عدد" },
  { name: "پلاک شاموت 8*40 ضخامت 2.5", category: "آجرهای نسوز شاموت", unit: "عدد" },
  { name: "پلاک شاموت 10*10 ضخامت 2.5", category: "آجرهای نسوز شاموت", unit: "عدد" },
  { name: "پلاک شاموت 10*20 ضخامت 2.7", category: "آجرهای نسوز شاموت", unit: "عدد" },
  { name: "پلاک شاموت 10*20 ضخامت 5.5", category: "آجرهای نسوز شاموت", unit: "عدد" },
  { name: "هلالی شاموت 20*5.5", category: "آجرهای نسوز شاموت", unit: "عدد" },
  { name: "ال گرد شاموت 10*20 ضخامت 5.5", category: "آجرهای نسوز شاموت", unit: "عدد" },
  { name: "ال گرد شاموت 10*20 ضخامت 7", category: "آجرهای نسوز شاموت", unit: "عدد" },
  { name: "ال گرد شاموت 10*20 ضخامت 8", category: "آجرهای نسوز شاموت", unit: "عدد" },
  { name: "ال تیز شاموت 13*26 ضخامت 5.5", category: "آجرهای نسوز شاموت", unit: "عدد" },
  { name: "ال تیز شاموت 13*26 ضخامت 7", category: "آجرهای نسوز شاموت", unit: "عدد" },

  // =========================
  // آجرهای نسوز سمیرم
  // =========================
  { name: "پلاک سمیرم 20*5.5 ضخامت 2.5", category: "آجرهای نسوز سمیرم", unit: "عدد" },
  { name: "پلاک سمیرم 26*5.5 ضخامت 2.5", category: "آجرهای نسوز سمیرم", unit: "عدد" },
  { name: "پلاک سمیرم 7*32 ضخامت 2.5", category: "آجرهای نسوز سمیرم", unit: "عدد" },
  { name: "پلاک سمیرم 20*20 ضخامت 2.7", category: "آجرهای نسوز سمیرم", unit: "عدد" },
  { name: "پلاک شومینه سمیرم 15*7.5 ضخامت 2.5", category: "آجرهای نسوز سمیرم", unit: "عدد" },
  { name: "پلاک سمیرم 20*40 ضخامت 3", category: "آجرهای نسوز سمیرم", unit: "عدد" },
  { name: "پلاک رومی سمیرم 20*40 ضخامت 3", category: "آجرهای نسوز سمیرم", unit: "عدد" },
  { name: "پلاک سمیرم 20*40 ضخامت 6.5", category: "آجرهای نسوز سمیرم", unit: "عدد" },
  { name: "پلاک سمیرم 8*40 ضخامت 2.5", category: "آجرهای نسوز سمیرم", unit: "عدد" },
  { name: "پلاک سمیرم 10*10 ضخامت 2.5", category: "آجرهای نسوز سمیرم", unit: "عدد" },
  { name: "پلاک سمیرم 10*20 ضخامت 2.7", category: "آجرهای نسوز سمیرم", unit: "عدد" },
  { name: "پلاک سمیرم 10*20 ضخامت 5.5", category: "آجرهای نسوز سمیرم", unit: "عدد" },
  { name: "هلالی سمیرم 20*5.5", category: "آجرهای نسوز سمیرم", unit: "عدد" },
  { name: "ال گرد سمیرم 10*20 ضخامت 5.5", category: "آجرهای نسوز سمیرم", unit: "عدد" },
  { name: "ال گرد سمیرم 10*20 ضخامت 7", category: "آجرهای نسوز سمیرم", unit: "عدد" },
  { name: "ال گرد سمیرم 10*20 ضخامت 8", category: "آجرهای نسوز سمیرم", unit: "عدد" },
  { name: "ال تیز سمیرم 13*26 ضخامت 5.5", category: "آجرهای نسوز سمیرم", unit: "عدد" },
  { name: "ال تیز سمیرم 13*26 ضخامت 7", category: "آجرهای نسوز سمیرم", unit: "عدد" },
  { name: "آجر پلاک سمیرم 23*11.5 ضخامت 3", category: "آجرهای نسوز سمیرم", unit: "عدد" },
  { name: "آجر پلاک سمیرم 23*11.5 ضخامت 6", category: "آجرهای نسوز سمیرم", unit: "عدد" },
  { name: "آجر دهنه سمیرم 50", category: "آجرهای نسوز سمیرم", unit: "قالب" },
  { name: "آجر دهنه سمیرم 70", category: "آجرهای نسوز سمیرم", unit: "قالب" },
  { name: "آجر دهنه سمیرم 90", category: "آجرهای نسوز سمیرم", unit: "قالب" }
]
defaultProducts.forEach((product) => {
  try {
    db.prepare(`
      INSERT OR IGNORE INTO products (name, category, unit)
      VALUES (?, ?, ?)
    `).run(product.name, product.category, product.unit || "عدد")
  } catch (error) {
    // اگه محصول از قبل بود، رد شو
  }
})
// =========================
// گزارش سفارشات مشتریان
// =========================

app.get("/api/customers-report", (req, res) => {
  const { customer_name, from_date, to_date } = req.query

  let query = "SELECT * FROM orders WHERE (is_deleted = 0 OR is_deleted IS NULL)"
  const params = []

  if (customer_name) {
    query += " AND customer_name = ?"
    params.push(customer_name)
  }

  if (from_date) {
    query += " AND order_date >= ?"
    params.push(from_date)
  }

  if (to_date) {
    query += " AND order_date <= ?"
    params.push(to_date)
  }

  query += " ORDER BY order_date DESC"

  const orders = db.prepare(query).all(...params)

  // گروه‌بندی بر اساس مشتری
  const byCustomer = {}

  orders.forEach((order) => {
    if (!byCustomer[order.customer_name]) {
      byCustomer[order.customer_name] = {
        customer_name: order.customer_name,
        total_orders: 0,
        total_quantity: 0,
        products: {},
        orders_list: []
      }
    }

    const c = byCustomer[order.customer_name]
    c.total_orders += 1
    c.total_quantity += Number(order.quantity || 0)

    // =========================
    // گرفتن اطلاعات خروجی این سفارش
    // =========================
    const exits = db.prepare(`
      SELECT id, quantity, status, reject_reason, exit_date, is_extra
      FROM exits
      WHERE order_id = ?
    `).all(order.id)

    const rejectedExits = exits.filter((e) => e.status === "rejected")
    const approvedExits = exits.filter((e) => e.status === "approved")
    const pendingExits = exits.filter((e) => !e.status || e.status === "pending")

    // محاسبه مقدار خروجی رفته (سفارشی) و بار اضافه
    const shippedQty = exits
      .filter((e) => e.status !== "rejected" && e.is_extra !== 1)
      .reduce((sum, e) => sum + Number(e.quantity || 0), 0)

    const extraQty = exits
      .filter((e) => e.status !== "rejected" && e.is_extra === 1)
      .reduce((sum, e) => sum + Number(e.quantity || 0), 0)

    const hasRejected = rejectedExits.length > 0
    const rejectedReason = hasRejected ? rejectedExits[0].reject_reason : null

    const productName = order.brick_type || "نامشخص"
    if (!c.products[productName]) {
      c.products[productName] = {
        product_name: productName,
        count: 0,
        total_quantity: 0,
        orders: []
      }
    }
    c.products[productName].count += 1
    c.products[productName].total_quantity += Number(order.quantity || 0)
    c.products[productName].orders.push({
      id: order.id,
      date: order.order_date,
      quantity: order.quantity,
      shipped_quantity: shippedQty,
      extra_quantity: extraQty,
      kiln: order.kiln,
      priority: order.priority,
      hasRejected,
      rejectedReason,
      exitsCount: exits.length
    })
    c.orders_list.push({
      ...order,
      hasRejected,
      rejectedReason
    })
  })

  const result = Object.values(byCustomer).map((c) => ({
    ...c,
    products: Object.values(c.products)
  }))

  res.json(result)
})
app.get("/api/production", (req, res) => {
  const productions = db
    .prepare(`
      SELECT p.*, u.full_name AS created_by_full_name
      FROM production p
      LEFT JOIN users u ON u.username = p.created_by
      WHERE p.is_deleted = 0 OR p.is_deleted IS NULL
      ORDER BY p.id DESC
    `)
    .all()

  res.json(productions)
})
// حذف تولید (soft delete)
app.delete("/api/production/:id", (req, res) => {
  const { id } = req.params
  const { delete_reason } = req.body || {}

  // بررسی دسترسی: فقط ادمین یا ثبت‌کننده اصلی می‌تواند حذف کند
  if (req.user?.role !== "admin") {
    const production = db.prepare("SELECT created_by FROM production WHERE id = ?").get(id)
    if (!production || production.created_by !== req.user?.username) {
      return res.status(403).json({ success: false, message: "شما مجاز به حذف این تولید نیستید" })
    }
  }

  const oldData = db.prepare("SELECT * FROM production WHERE id = ?").get(id)

  if (!oldData) {
    return res.json({ success: false, message: "تولید پیدا نشد" })
  }

  db.prepare(`
    UPDATE production
    SET is_deleted = 1,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_by = ?,
        delete_reason = ?
    WHERE id = ?
  `).run(
    req.user?.username || "نامشخص",
    delete_reason || null,
    id
  )

  db.prepare(`
    INSERT INTO edit_history (table_name, record_id, action, old_data)
    VALUES (?, ?, ?, ?)
  `).run("production", id, "delete", JSON.stringify(oldData))

  res.json({ success: true })
})
// ویرایش تولید
app.put("/api/production/:id", (req, res) => {
  const { id } = req.params
  const {
    production_date,
    kiln,
    product_name,
    quantity,
    unit,
    notes,
    order_id,
    production_type
  } = req.body

  const oldData = db.prepare("SELECT * FROM production WHERE id = ?").get(id)

  if (!oldData) {
    return res.json({ success: false, message: "تولید پیدا نشد" })
  }

  db.prepare(`
    UPDATE production
    SET production_date = ?, kiln = ?, product_name = ?,
        quantity = ?, unit = ?, notes = ?, order_id = ?, production_type = ?
    WHERE id = ?
  `).run(
    production_date, kiln, product_name,
    quantity, unit || "عدد", notes, order_id || null,
    production_type || oldData.production_type || "final", id
  )

  const newData = db.prepare("SELECT * FROM production WHERE id = ?").get(id)

  db.prepare(`
    INSERT INTO edit_history (table_name, record_id, action, old_data, new_data)
    VALUES (?, ?, ?, ?, ?)
  `).run("production", id, "edit", JSON.stringify(oldData), JSON.stringify(newData))

  res.json({ success: true })
})
// گزارش باقی‌مانده‌ی هر سفارش
app.get("/api/orders-status", (req, res) => {
  const orders = db.prepare("SELECT * FROM orders").all()

  const result = orders.map((order) => {
    const produced = db
      .prepare("SELECT COALESCE(SUM(quantity), 0) as total FROM production WHERE order_id = ?")
      .get(order.id)

    const totalProduced = produced.total || 0
    const remaining = Number(order.quantity) - totalProduced

    return {
      ...order,
      produced: totalProduced,
      remaining: remaining,
      status:
        remaining <= 0
          ? "تکمیل شده"
          : totalProduced > 0
          ? "در حال تولید"
          : "در انتظار"
    }
  })

  res.json(result)
})

app.get("/api/products", (req, res) => {
  const products = db
    .prepare("SELECT * FROM products WHERE is_deleted = 0 OR is_deleted IS NULL ORDER BY category, name")
    .all()
  res.json(products)
})

// ثبت محصول جدید
app.post("/api/products", (req, res) => {
  const { name, category, unit, notes } = req.body

  if (!name) {
    return res.json({ success: false, message: "نام محصول الزامی است" })
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO products (name, category, unit, notes)
      VALUES (?, ?, ?, ?)
    `)
    const result = stmt.run(name, category, unit || "کیلوگرم", notes)
    res.json({ success: true, id: result.lastInsertRowid })
  } catch (error) {
    res.json({ success: false, message: "این محصول قبلاً ثبت شده" })
  }
})

// ویرایش محصول
app.put("/api/products/:id", (req, res) => {
  const { id } = req.params
  const { name, category, unit, notes } = req.body

  try {
    db.prepare(`
      UPDATE products
      SET name = ?, category = ?, unit = ?, notes = ?
      WHERE id = ?
    `).run(name, category, unit, notes, id)

    res.json({ success: true })
  } catch (error) {
    res.json({ success: false, message: "خطا در ویرایش" })
  }
})

// حذف محصول (soft delete)
app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params
  const { delete_reason } = req.body || {}

  try {
    const oldData = db.prepare("SELECT * FROM products WHERE id = ?").get(id)

    if (!oldData) {
      return res.json({ success: false, message: "محصول پیدا نشد" })
    }

    db.prepare(`
      UPDATE products
      SET is_deleted = 1,
          deleted_at = CURRENT_TIMESTAMP,
          deleted_by = ?,
          delete_reason = ?
      WHERE id = ?
    `).run(
      req.user?.username || "نامشخص",
      delete_reason || null,
      id
    )

    db.prepare(`
      INSERT INTO edit_history (table_name, record_id, action, old_data)
      VALUES (?, ?, ?, ?)
    `).run("products", id, "delete", JSON.stringify(oldData))

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا در حذف" })
  }
})
// موجودی محصولات
app.get("/api/products-stock", (req, res) => {
  const products = db.prepare("SELECT * FROM products").all()

  const result = products.map((product) => {
    const ordered = db
      .prepare("SELECT COALESCE(SUM(quantity), 0) as total FROM orders WHERE brick_type = ?")
      .get(product.name)

    const produced = db
      .prepare("SELECT COALESCE(SUM(quantity), 0) as total FROM production WHERE product_name = ?")
      .get(product.name)

    const totalOrdered = ordered.total || 0
    const totalProduced = produced.total || 0
    const remaining = totalOrdered - totalProduced

    return {
      ...product,
      ordered: totalOrdered,
      produced: totalProduced,
      remaining: remaining,
      status:
        remaining <= 0
          ? "تکمیل شده"
          : totalProduced > 0
          ? "در حال تولید"
          : "در انتظار"
    }
  })

  res.json(result)
})
// =========================
// آمار داشبورد
// =========================

app.get("/api/dashboard-stats", (req, res) => {
  // کل سفارشات
  const totalOrders = db.prepare("SELECT COUNT(*) as count FROM orders").get().count

  // کل تولیدات
  const totalProductions = db.prepare("SELECT COUNT(*) as count FROM production").get().count

  // جمع تعداد سفارشات
  const totalOrderedQuantity = db
    .prepare("SELECT COALESCE(SUM(quantity), 0) as total FROM orders")
    .get().total

  // جمع تعداد تولیدات
  const totalProducedQuantity = db
    .prepare("SELECT COALESCE(SUM(quantity), 0) as total FROM production")
    .get().total

  // موجودی هر محصول
  const products = db.prepare("SELECT * FROM products").all()
  const productsStock = products.map((product) => {
    const ordered = db
      .prepare("SELECT COALESCE(SUM(quantity), 0) as total FROM orders WHERE brick_type = ?")
      .get(product.name).total || 0

    const produced = db
      .prepare("SELECT COALESCE(SUM(quantity), 0) as total FROM production WHERE product_name = ?")
      .get(product.name).total || 0

    const remaining = ordered - produced

    return {
      id: product.id,
      name: product.name,
      category: product.category,
      ordered,
      produced,
      remaining,
      status:
        remaining <= 0 && ordered > 0
          ? "تکمیل شده"
          : produced > 0
          ? "در حال تولید"
          : ordered > 0
          ? "در انتظار"
          : "بدون سفارش"
    }
  })

  // سفارشات فعال (هنوز تکمیل نشدن)
  const orders = db.prepare("SELECT * FROM orders").all()
  const activeOrders = []

  orders.forEach((order) => {
    const produced = db
      .prepare("SELECT COALESCE(SUM(quantity), 0) as total FROM production WHERE order_id = ?")
      .get(order.id).total || 0

    const remaining = Number(order.quantity) - produced

    if (remaining > 0) {
      activeOrders.push({
        ...order,
        produced,
        remaining
      })
    }
  })

  res.json({
    totalOrders,
    totalProductions,
    totalOrderedQuantity,
    totalProducedQuantity,
    remainingQuantity: totalOrderedQuantity - totalProducedQuantity,
    productsStock,
    activeOrders: activeOrders.slice(0, 5)
  })
})
// =========================
// کاربر پیش‌فرض ادمین
// =========================

const defaultUsers = [
  {
    username: "admin",
    password: "admin123",
    full_name: "مدیر سیستم",
    role: "admin"
  }
]
defaultUsers.forEach((user) => {
  try {
    // چک کن کاربر وجود داره یا نه
    const existing = db.prepare("SELECT * FROM users WHERE username = ?").get(user.username)

    if (!existing) {
      // کاربر جدید → با hash ذخیره کن
      const hashedPassword = bcrypt.hashSync(user.password, 10)
      db.prepare(`
        INSERT INTO users (username, password, full_name, role)
        VALUES (?, ?, ?, ?)
      `).run(user.username, hashedPassword, user.full_name, user.role)
    }
  } catch (error) {
    // اگه خطا داد، رد شو
  }
})

// =========================
// حذف کاربران پیش‌فرض قدیمی (office و finance)
// فقط یک بار اجرا می‌شه
// =========================
try {
  db.prepare("DELETE FROM users WHERE username IN ('office', 'finance')").run()
} catch (error) {
  console.error("خطا در حذف کاربران پیش‌فرض:", error)
}

// =========================
// مهاجرت رمزهای قدیمی (plain text → hash)
// =========================
const allUsers = db.prepare("SELECT * FROM users").all()

allUsers.forEach((user) => {
  // اگه رمز با $2 شروع نمیشه → هنوز hash نشده
  if (user.password && !user.password.startsWith("$2")) {
    try {
      const hashedPassword = bcrypt.hashSync(user.password, 10)
      db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, user.id)
      console.log(`✅ رمز کاربر "${user.username}" رمزنگاری شد`)
    } catch (error) {
      console.error(`❌ خطا در رمزنگاری رمز "${user.username}":`, error)
    }
  }
})
// =========================
// API های کاربران
// =========================

// لاگین
app.post("/api/login", loginLimiter, (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.json({ success: false, message: "نام کاربری و رمز عبور الزامی است" })
  }

  const user = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username)

  // اگه کاربر وجود نداشت یا غیرفعال بود (is_active = 0)
  if (!user || user.is_active === 0) {
    return res.json({ success: false, message: "نام کاربری یا رمز عبور اشتباه است" })
  }

  if (!user) {
    return res.json({ success: false, message: "نام کاربری یا رمز عبور اشتباه است" })
  }

  const isValid = bcrypt.compareSync(password, user.password)

  if (!isValid) {
    return res.json({ success: false, message: "نام کاربری یا رمز عبور اشتباه است" })
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  )

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role
    }
  })
})

// لیست کاربران (فقط admin)
app.get("/api/users", (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "دسترسی غیرمجاز" })
  }

  const users = db
    .prepare("SELECT id, username, full_name, role, is_active, created_at FROM users ORDER BY id DESC")
    .all()
  res.json(users)
})

// ثبت کاربر جدید (فقط admin)
app.post("/api/users", (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "دسترسی غیرمجاز" })
  }

  const { username, password, full_name, role } = req.body
  if (!username || !password) {
    return res.json({ success: false, message: "نام کاربری و رمز عبور الزامی است" })
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10)
    const stmt = db.prepare(`
      INSERT INTO users (username, password, full_name, role, is_active)
      VALUES (?, ?, ?, ?, 1)
    `)
    const result = stmt.run(username, hashedPassword, full_name, role || "viewer")
    res.json({ success: true, id: result.lastInsertRowid })
  } catch (error) {
    res.json({ success: false, message: "این نام کاربری قبلاً ثبت شده" })
  }
})
// ویرایش کاربر (admin یا خود کاربر)
app.put("/api/users/:id", (req, res) => {
  const { id } = req.params

  // فقط admin یا خود کاربر می‌تونه ویرایش کنه
  if (req.user?.role !== "admin" && req.user?.id !== Number(id)) {
    return res.status(403).json({ success: false, message: "دسترسی غیرمجاز" })
  }
  const { username, password, full_name, role, is_active } = req.body
  const oldUser = db.prepare("SELECT * FROM users WHERE id = ?").get(id)
  if (!oldUser) {
    return res.json({ success: false, message: "کاربر پیدا نشد" })
  }

  try {
    const finalRole = role || oldUser.role || "office"
    const finalIsActive = (is_active === 0 || is_active === "0") ? 0 : 1

    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10)
      db.prepare(`
        UPDATE users
        SET username = ?, password = ?, full_name = ?, role = ?, is_active = ?
        WHERE id = ?
      `).run(username, hashedPassword, full_name, finalRole, finalIsActive, id)
    } else {
      db.prepare(`
        UPDATE users
        SET username = ?, full_name = ?, role = ?, is_active = ?
        WHERE id = ?
      `).run(username, full_name, finalRole, finalIsActive, id)
    }
    // =========================
    // اگر کاربر رمز خودش رو عوض کرد، توکن جدید صادر کن
    // =========================
    if (password && req.user?.id === Number(id)) {
      const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(id)
      const newToken = jwt.sign(
        {
          id: updatedUser.id,
          username: updatedUser.username,
          role: updatedUser.role
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      )
      
      return res.json({ 
        success: true, 
        newToken,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          full_name: updatedUser.full_name,
          role: updatedUser.role
        }
      })
    }

    res.json({ success: true })
  } catch (error) {
    res.json({ success: false, message: "خطا در ویرایش کاربر" })
  }
})
// حذف کاربر (فقط admin)
app.delete("/api/users/:id", (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "دسترسی غیرمجاز" })
  }

  const { id } = req.params
  // جلوگیری از حذف admin
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id)
  if (user && user.username === "admin") {
    return res.json({ success: false, message: "کاربر admin قابل حذف نیست" })
  }

  db.prepare("DELETE FROM users WHERE id = ?").run(id)
  res.json({ success: true })
})
// =========================
// API های خروجی
// =========================

// لیست خروجی‌ها
app.get("/api/shipments", (req, res) => {
  const shipments = db
    .prepare("SELECT * FROM shipments WHERE is_deleted = 0 OR is_deleted IS NULL ORDER BY id DESC")
    .all()

  const result = shipments.map((s) => {
    const items = db
      .prepare("SELECT * FROM shipment_items WHERE shipment_id = ?")
      .all(s.id)
    return { ...s, items }
  })

  res.json(result)
})

// ثبت خروجی جدید (تهران)
app.post("/api/shipments", async (req, res) => {
  const { customer_name, carrier, items, created_by } = req.body

  if (!customer_name || !items || items.length === 0) {
    return res.json({ success: false, message: "اطلاعات ناقص است" })
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO shipments (customer_name, carrier, created_by)
      VALUES (?, ?, ?)
    `)
    const result = stmt.run(customer_name, carrier, created_by || "نامشخص")
    const shipmentId = result.lastInsertRowid

    const itemStmt = db.prepare(`
      INSERT INTO shipment_items (shipment_id, product_name, rolls, machine, warehouse_code)
      VALUES (?, ?, ?, ?, ?)
    `)

    items.forEach((item) => {
      itemStmt.run(
        shipmentId,
        item.product_name,
        item.rolls || 0,
        item.machine,
        item.warehouse_code
      )
    })

    // =========================
    // ارسال پیامک به کارفرما
    // =========================
    try {
      if (OWNER_PHONE && OWNER_PHONE.length === 11) {
        const totalRolls = items.reduce(
          (sum, item) => sum + Number(item.rolls || 0),
          0
        )

        const itemsList = items
          .map((item) => `- ${item.product_name}: ${item.rolls || 0} طاقه`)
          .join("\n")

        const messageText = `🔔 خروجی جدید در انتظار تأیید\n\nمشتری: ${customer_name}\nحمل‌کننده: ${carrier || "نامشخص"}\n\nاقلام:\n${itemsList}\n\nجمع کل: ${totalRolls} طاقه\n\nثبت‌کننده: ${created_by || "نامشخص"}\n\nآجر نسوز و نما محراب`

        // ⚠️ این endpoint قدیمیه و دیگه استفاده نمی‌شه، نیازی به آپدیت نداره
        // اگه می‌خوای حذفش کنی، کل این بخش رو پاک کن
      }
    } catch (error) {
      console.error("خطا در ارسال پیامک به کارفرما:", error)
    }

    res.json({ success: true, id: shipmentId })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا در ثبت خروجی" })
  }
})

// تأیید خروجی (کارخانه)
app.put("/api/shipments/:id/approve", async (req, res) => {
  const { id } = req.params
  const {
    exit_number,
    exit_date,
    customer_phone,
    vehicle_plate,
    driver_name,
    total_rolls,
    defective_rolls,
    total_weight,
    excel_code,
    destination,
    approved_by
  } = req.body
  try {
     db.prepare(`
      UPDATE shipments
      SET status = 'approved',
          exit_number = ?,
          exit_date = ?,
          customer_phone = ?,
          vehicle_plate = ?,
          driver_name = ?,
          total_rolls = ?,
          defective_rolls = ?,
          total_weight = ?,
          excel_code = ?,
          destination = ?,
          approved_by = ?,
          approved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      exit_number,
      exit_date,
      customer_phone,
      vehicle_plate,
      driver_name,
      total_rolls,
      defective_rolls,
      total_weight,
      excel_code,
      destination,
      approved_by,
      id
    )

    // =========================
    // ارسال پیامک به مشتری بعد از تأیید خروجی
    // =========================
    try {
      const shipment = db.prepare("SELECT * FROM shipments WHERE id = ?").get(id)

      if (shipment) {
        const customer = db
          .prepare("SELECT * FROM customers WHERE name = ?")
          .get(shipment.customer_name)

        if (customer && customer.phone && customer.phone.length === 11) {
          const items = db
            .prepare("SELECT * FROM shipment_items WHERE shipment_id = ?")
            .all(id)

          const itemsList = items
            .map((item) => `- ${item.product_name}: ${item.approved_rolls || 0} پالت`)
            .join("\n")

          const messageText = `سلام ${customer.name} عزیز،\nخروج کالای شما تأیید شد.\nشماره برگه: ${exit_number}\nتاریخ خروج: ${exit_date}\n\nاقلام:\n${itemsList}\n\nجمع کل: ${total_rolls || 0} پالت\n\nآجر نسوز و نما محراب`

          await sendSMS([customer.phone], messageText)
        }
      }
    } catch (error) {
      console.error("خطا در ارسال پیامک تأیید خروجی:", error)
    }

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا در تأیید خروجی" })
  }
})

// رد خروجی
app.put("/api/shipments/:id/reject", (req, res) => {
  const { id } = req.params
  const { reject_reason, approved_by } = req.body

  try {
    db.prepare(`
      UPDATE shipments
      SET status = 'rejected',
          reject_reason = ?,
          approved_by = ?,
          approved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(reject_reason, approved_by, id)

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا در رد خروجی" })
  }
})
// ویرایش کامل خروجی
app.put("/api/shipments/:id", (req, res) => {
  const { id } = req.params
  const {
    exit_number,
    exit_date,
    customer_phone,
    vehicle_plate,
    driver_name,
    destination,
    carrier,
    total_rolls,
    defective_rolls,
    total_weight,
    items
  } = req.body

  try {
    db.prepare(`
      UPDATE shipments
      SET exit_number = ?,
          exit_date = ?,
          customer_phone = ?,
          vehicle_plate = ?,
          driver_name = ?,
          destination = ?,
          carrier = ?,
          total_rolls = ?,
          defective_rolls = ?,
          total_weight = ?
      WHERE id = ?
    `).run(
      exit_number,
      exit_date,
      customer_phone,
      vehicle_plate,
      driver_name,
      destination,
      carrier,
      total_rolls,
      defective_rolls,
      total_weight,
      id
    )

    // آپدیت اقلام
    if (items && items.length > 0) {
      items.forEach((item) => {
        db.prepare(`
          UPDATE shipment_items
          SET product_name = ?,
              rolls = ?,
              machine = ?,
              warehouse_code = ?,
              approved_rolls = ?,
              defective_rolls = ?,
              total_weight = ?,
              defect_notes = ?,
              excel_code = ?
          WHERE id = ?
        `).run(
          item.product_name,
          item.rolls,
          item.machine,
          item.warehouse_code,
          item.approved_rolls,
          item.defective_rolls,
          item.total_weight,
          item.defect_notes,
          item.excel_code,
          item.id
        )
      })
    }

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا در ویرایش" })
  }
})

// حذف خروجی (soft delete)
app.delete("/api/shipments/:id", (req, res) => {
  const { id } = req.params

  try {
    db.prepare("UPDATE shipments SET is_deleted = 1 WHERE id = ?").run(id)
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا در حذف" })
  }
})
// تأیید هر قلم خروجی
app.put("/api/shipment-items/:id/approve", (req, res) => {
  const { id } = req.params
  const {
    approved_rolls,
    defective_rolls,
    total_weight,
    defect_notes,
    excel_code
  } = req.body

  try {
    db.prepare(`
      UPDATE shipment_items
      SET item_status = 'approved',
          approved_rolls = ?,
          defective_rolls = ?,
          total_weight = ?,
          defect_notes = ?,
          excel_code = ?
      WHERE id = ?
    `).run(
      approved_rolls,
      defective_rolls,
      total_weight,
      defect_notes,
      excel_code,
      id
    )

    // چک کن اگه همه اقلام تأیید شدن، کل shipment رو تأیید کن
    const item = db.prepare("SELECT * FROM shipment_items WHERE id = ?").get(id)
    const allItems = db
      .prepare("SELECT * FROM shipment_items WHERE shipment_id = ?")
      .all(item.shipment_id)

    const allApproved = allItems.every((i) => i.item_status === "approved")
    const anyApproved = allItems.some((i) => i.item_status === "approved")

    if (allApproved) {
      db.prepare(`
        UPDATE shipments
        SET status = 'approved',
            approved_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(item.shipment_id)
    } else if (anyApproved) {
      db.prepare(`
        UPDATE shipments
        SET status = 'partial'
        WHERE id = ?
      `).run(item.shipment_id)
    }

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا در تأیید قلم" })
  }
})

// رد هر قلم خروجی
app.put("/api/shipment-items/:id/reject", (req, res) => {
  const { id } = req.params
  const { item_reject_reason } = req.body

  try {
    db.prepare(`
      UPDATE shipment_items
      SET item_status = 'rejected',
          item_reject_reason = ?
      WHERE id = ?
    `).run(item_reject_reason, id)

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا در رد قلم" })
  }
})
// =========================
// API های خروجی جدید (exits)
// =========================

// لیست همه خروجی‌ها
app.get("/api/exits", (req, res) => {
  try {
    const exits = db
      .prepare(`
        SELECT e.*, u.full_name AS created_by_full_name
        FROM exits e
        LEFT JOIN users u ON u.username = e.created_by
        WHERE e.is_deleted = 0 OR e.is_deleted IS NULL
        ORDER BY e.id DESC
      `)
      .all()
    res.json(exits)
  } catch (error) {
    console.error(error)
    res.json([])
  }
})

// ثبت خروجی جدید
// ثبت خروجی جدید
app.post("/api/exits", (req, res) => {
  const {
    customer_name,
    exit_date,
    category,
    product_name,
    quantity,
    unit,
    order_id,
    notes,
    driver_name,
    driver_phone,
    vehicle_plate,
    vehicle_type,
    is_extra,
    shortage_reason,
    close_order
  } = req.body

  if (!customer_name || !exit_date || !product_name || !quantity) {
    return res.json({ success: false, message: "اطلاعات ناقص است" })
  }

  if (!driver_name || !driver_phone || !vehicle_plate || !vehicle_type) {
    return res.json({ success: false, message: "اطلاعات راننده و خودرو الزامی است" })
  }

  try {
    // =========================
    // بررسی کسری مقدار (کمتر از باقی‌مانده سفارش)
    // =========================
    let finalShortageReason = shortage_reason || null
    let shouldCloseOrder = close_order ? 1 : 0

    if (!is_extra && order_id) {
      const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(order_id)

      if (order) {
        // 👇 این تیکه رو تغییر بده: باقی‌مانده رو برای همون محصول حساب کن، نه کل سفارش
        const orderItem = db.prepare(`
          SELECT quantity FROM order_items 
          WHERE order_id = ? AND brick_type = ?
        `).get(order_id, product_name)

        const itemQuantity = orderItem ? Number(orderItem.quantity || 0) : 0

        const shippedRow = db.prepare(`
          SELECT COALESCE(SUM(quantity), 0) as total
          FROM exits
          WHERE order_id = ?
            AND product_name = ?
            AND status != 'rejected'
            AND (is_extra = 0 OR is_extra IS NULL)
            AND (is_deleted = 0 OR is_deleted IS NULL)
        `).get(order_id, product_name)
        
        const alreadyShipped = Number(shippedRow.total || 0)
        const remaining = itemQuantity - alreadyShipped

        // اگر کمتر از باقی‌مانده بود، علت کسری اجباری است
        if (Number(quantity) < remaining && !finalShortageReason) {
          return res.json({
            success: false,
            message: "علت کم ارسال کردن (کسری) الزامی است"
          })
        }
      }
      // آپدیت اسم مشتری سفارش
      if (order && order.customer_name !== customer_name) {
        db.prepare("UPDATE orders SET customer_name = ? WHERE id = ?").run(customer_name, order_id)
      }
    }

    // تولید شناسه یکتا برای این فاکتور (مشتری + تاریخ + پلاک + راننده)
    // این شناسه به همه محصولات این فاکتور اختصاص داده می‌شود
    const exitGroupId = `${customer_name}_${exit_date}_${vehicle_plate || ""}_${driver_name || ""}`

    const stmt = db.prepare(`
      INSERT INTO exits (
        exit_group_id, customer_name, exit_date, category, product_name,
        quantity, unit, order_id, notes, created_by,
        driver_name, driver_phone, vehicle_plate, vehicle_type,
        is_extra, shortage_reason, close_order
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
      exitGroupId,
      customer_name,
      exit_date,
      category,
      product_name,
      quantity,
      unit || "عدد",
      order_id || null,
      notes,
      req.user?.username || "نامشخص",
      driver_name,
      driver_phone,
      vehicle_plate,
      vehicle_type,
      is_extra ? 1 : 0,
      finalShortageReason,
      shouldCloseOrder
    )

    // =========================
    // اگر کاربر گفت باقی‌مانده در سفارش بعدی ارسال شود → سفارش را ببند
    // =========================
    if (shouldCloseOrder && order_id) {
      db.prepare("UPDATE orders SET is_transferred = 1 WHERE id = ?").run(order_id)
      
      // ثبت یک یادداشت برای سفارش بعدی (اختیاری)
      // می‌تونیم یه فیلد notes اضافه کنیم یا توی edit_history ثبت کنیم
      db.prepare(`
        INSERT INTO edit_history (table_name, record_id, action, new_data)
        VALUES (?, ?, ?, ?)
      `).run("orders", order_id, "close_with_shortage", JSON.stringify({
        reason: finalShortageReason,
        closed_at: new Date().toISOString()
      }))
    }

    // =========================
    // 🔒 بستن خودکار سفارش توسط سرور (بعد از هر خروجی)
    // اگه همه اقلام سفارش کامل ارسال شدن، سفارش خودکار بسته می‌شه
    // =========================
    if (!is_extra && order_id) {
      try {
        // همه اقلام این سفارش رو بگیر
        const orderItems = db.prepare(`
          SELECT * FROM order_items WHERE order_id = ?
        `).all(order_id)

        // اگه سفارش قلمی نداره (قدیمی)، از فیلدهای خود سفارش استفاده کن
        const safeItems = orderItems.length > 0
          ? orderItems
          : [{ brick_type: product_name, quantity: null }]

        // برای هر قلم چک کن که کامل ارسال شده یا نه
        let allShipped = true

        for (const item of safeItems) {
          // اگه قلم قدیمی بود (quantity null)، از total سفارش استفاده کن
          let totalQty = item.quantity

          if (totalQty === null) {
            const orderRow = db.prepare("SELECT quantity FROM orders WHERE id = ?").get(order_id)
            totalQty = orderRow?.quantity || 0
          }

          const shippedRow = db.prepare(`
            SELECT COALESCE(SUM(quantity), 0) as total
            FROM exits
            WHERE order_id = ?
              AND product_name = ?
              AND status != 'rejected'
              AND (is_extra = 0 OR is_extra IS NULL)
              AND (is_deleted = 0 OR is_deleted IS NULL)
          `).get(order_id, item.brick_type)

          const shipped = Number(shippedRow.total || 0)
          const total = Number(totalQty || 0)

          if (shipped < total) {
            allShipped = false
            break
          }
        }

        // اگه همه اقلام کامل ارسال شدن → سفارش رو ببند
        if (allShipped) {
          db.prepare("UPDATE orders SET is_transferred = 1 WHERE id = ?").run(order_id)
          console.log(`✅ سفارش ${order_id} به‌صورت خودکار بسته شد (همه اقلام ارسال شده)`)
        }
      } catch (err) {
        console.error("خطا در بستن خودکار سفارش:", err)
      }
    }

    // نوتیفیکیشن برای همه کاربران فعال (به‌جز خود ثبت‌کننده)
    const allUsers = db.prepare("SELECT id, username FROM users WHERE is_active = 1").all()
    allUsers.forEach((u) => {
      // خود ثبت‌کننده رو نادیده بگیر
      if (u.username === req.user?.username) return

      let notifMsg = `خروجی ${customer_name} - ${product_name} (${quantity} ${unit || "عدد"}) ثبت شد`
      if (is_extra) notifMsg += " (بار اضافه)"
      if (finalShortageReason) notifMsg += ` | کسری: ${finalShortageReason}`

      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, exit_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        u.id,
        "🔔 خروجی جدید در انتظار تأیید",
        notifMsg,
        "info",
        result.lastInsertRowid
      )
    })

    res.json({ success: true, id: result.lastInsertRowid })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا در ثبت خروجی" })
  }
})
// ویرایش خروجی
app.put("/api/exits/:id", (req, res) => {
  const { id } = req.params
  const {
    customer_name,
    exit_date,
    category,
    product_name,
    quantity,
    unit,
    notes
  } = req.body

  try {
    // اگه این خروجی به یه سفارش وصله، اسم مشتری سفارش رو هم آپدیت کن
    const exitData = db.prepare("SELECT * FROM exits WHERE id = ?").get(id)
    if (exitData && exitData.order_id && exitData.customer_name !== customer_name) {
      db.prepare("UPDATE orders SET customer_name = ? WHERE id = ?").run(customer_name, exitData.order_id)
    }

    db.prepare(`
      UPDATE exits
      SET customer_name = ?, exit_date = ?, category = ?,
          product_name = ?, quantity = ?, unit = ?, notes = ?
      WHERE id = ?
    `).run(
      customer_name, exit_date, category, product_name,
      quantity, unit, notes, id
    )

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا در ویرایش" })
  }
})

// حذف خروجی (soft delete)
app.delete("/api/exits/:id", (req, res) => {
  const { id } = req.params
  const { delete_reason } = req.body || {}

  try {
    const oldData = db.prepare("SELECT * FROM exits WHERE id = ?").get(id)

    if (!oldData) {
      return res.json({ success: false, message: "خروجی پیدا نشد" })
    }

    db.prepare(`
      UPDATE exits
      SET is_deleted = 1,
          deleted_at = CURRENT_TIMESTAMP,
          deleted_by = ?,
          delete_reason = ?
      WHERE id = ?
    `).run(
      req.user?.username || "نامشخص",
      delete_reason || null,
      id
    )

    db.prepare(`
      INSERT INTO edit_history (table_name, record_id, action, old_data)
      VALUES (?, ?, ?, ?)
    `).run("exits", id, "delete", JSON.stringify(oldData))

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا در حذف" })
  }
})
// =========================
// تأیید مالی خروجی
// =========================
app.put("/api/exits/:id/approve", async (req, res) => {
  if (req.user?.role !== "admin" && req.user?.role !== "finance") {
    return res.status(403).json({ success: false, message: "دسترسی غیرمجاز" })
  }

  const { id } = req.params
  const { payment_methods, customer_name } = req.body

  if (!payment_methods) {
    return res.json({ success: false, message: "نوع پرداخت الزامی است" })
  }
  try {
    const exitData = db.prepare("SELECT * FROM exits WHERE id = ?").get(id)

    // اگه customer_name از فرانت اومد و با مقدار قبلی فرق داشت، آپدیت کن
    if (customer_name && exitData && exitData.customer_name !== customer_name) {
      db.prepare("UPDATE exits SET customer_name = ? WHERE id = ?").run(customer_name, id)

      // اگه به سفارش وصله، سفارش رو هم آپدیت کن
      if (exitData.order_id) {
        db.prepare("UPDATE orders SET customer_name = ? WHERE id = ?").run(customer_name, exitData.order_id)
      }
    }

    db.prepare(`
      UPDATE exits
      SET status = 'approved',
          payment_type = ?,
          approved_by = ?,
          approved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      payment_methods,
      req.user?.username || "نامشخص",
      id
    )
    // نوتیفیکیشن برای ثبت‌کننده
    if (exitData && exitData.created_by) {
      const creator = db.prepare("SELECT id FROM users WHERE username = ?").get(exitData.created_by)
      if (creator) {
        db.prepare(`
          INSERT INTO notifications (user_id, title, message, type, exit_id)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          creator.id,
          "✅ خروجی تأیید مالی شد",
          `خروجی ${exitData.customer_name} - ${exitData.product_name} تأیید مالی شد`,
          "success",
          id
        )
      }
    }

    // =========================
    // ارسال پیامک به مشتری (خط خدماتی)
    // =========================
    try {
      // چک کن آیا قبلاً برای این فاکتور (با شناسه یکتا) پیامک تأیید ارسال شده یا نه
      const alreadyNotified = db.prepare(`
        SELECT id FROM exits
        WHERE exit_group_id = ?
          AND status = 'approved'
          AND id != ?
      `).get(exitData.exit_group_id, id)

      const customer = db
        .prepare("SELECT * FROM customers WHERE name = ?")
        .get(exitData.customer_name)

      // فقط اگر قبلاً پیامک نرفته باشه، بفرست
      if (!alreadyNotified && customer && customer.phone && customer.phone.length === 11) {
        // پیدا کردن همه محصولات این فاکتور (بر اساس شناسه یکتا)
        const relatedExits = db.prepare(`
          SELECT product_name, quantity, unit
          FROM exits
          WHERE exit_group_id = ?
            AND (is_deleted = 0 OR is_deleted IS NULL)
        `).all(exitData.exit_group_id)

        // جمع کل تعداد
        const totalQuantity = relatedExits.reduce((sum, e) => sum + Number(e.quantity || 0), 0)

        // ساخت متن راننده
        const driverInfo = `${exitData.driver_name || "-"} (${exitData.vehicle_plate || "-"})`

        // حذف تکراری‌ها و خلاصه‌سازی نام محصولات
        const uniqueProducts = []
        const seenProducts = new Set()
        relatedExits.forEach(e => {
          if (!seenProducts.has(e.product_name)) {
            seenProducts.add(e.product_name)
            uniqueProducts.push(e)
          }
        })

        const productNames = uniqueProducts.map(e => {
          let name = e.product_name || ""
          name = name.replace(/ضخامت/g, "").replace(/پلاک/g, "").trim()
          return name
        })
        const MAX_PRODUCT_LENGTH = 100
        const chunks = []
        let currentChunk = []
        let currentLength = 0

        productNames.forEach((name) => {
          const nameLength = name.length + (currentChunk.length > 0 ? 2 : 0) // +2 برای "، "
          if (currentLength + nameLength > MAX_PRODUCT_LENGTH && currentChunk.length > 0) {
            chunks.push(currentChunk)
            currentChunk = [name]
            currentLength = name.length
          } else {
            currentChunk.push(name)
            currentLength += nameLength
          }
        })
        if (currentChunk.length > 0) chunks.push(currentChunk)

        for (let i = 0; i < chunks.length; i++) {
          const productsText = chunks[i].join("، ")
          await sendSMS(customer.phone, SMS_TEMPLATES.ORDER_SHIPPED, [
            { name: "NAME", value: customer.name },
            { name: "DATE", value: exitData.exit_date || "-" },
            { name: "PRODUCT", value: productsText || "-" },
            { name: "QUANTITY", value: String(totalQuantity.toLocaleString()) },
            { name: "DRIVER_NAME", value: driverInfo },
            { name: "DRIVER_PHONE", value: exitData.driver_phone || "-" }
          ], { skipTruncate: ["PRODUCT", "QUANTITY", "DATE"] })
        }
      }
    } catch (error) {
      console.error("خطا در ارسال پیامک تأیید خروجی:", error)
    }
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا در تأیید مالی" })
  }
})

// رد خروجی
app.put("/api/exits/:id/reject", (req, res) => {
  if (req.user?.role !== "admin" && req.user?.role !== "finance") {
    return res.status(403).json({ success: false, message: "دسترسی غیرمجاز" })
  }

  const { id } = req.params
  const { reject_reason } = req.body

  try {
    const exitData = db.prepare("SELECT * FROM exits WHERE id = ?").get(id)

    db.prepare(`
      UPDATE exits
      SET status = 'rejected',
          reject_reason = ?,
          approved_by = ?,
          approved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      reject_reason || "",
      req.user?.username || "نامشخص",
      id
    )
    // نوتیفیکیشن برای ثبت‌کننده
    if (exitData && exitData.created_by) {
      const creator = db.prepare("SELECT id FROM users WHERE username = ?").get(exitData.created_by)
      if (creator) {
        db.prepare(`
          INSERT INTO notifications (user_id, title, message, type, exit_id)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          creator.id,
          "❌ خروجی رد شد",
          `خروجی ${exitData.customer_name} - ${exitData.product_name} رد شد. دلیل: ${reject_reason || "نامشخص"}`,
          "error",
          id
        )
      }
    }

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا در رد خروجی" })
  }
})

// =========================
// سفارش‌های ارسال‌نشده
// =========================

app.get("/api/orders-not-shipped", (req, res) => {
  try {
    // فقط سفارش‌هایی که هنوز منتقل/بسته نشدن
    const orders = db.prepare(`
      SELECT o.*
      FROM orders o
      WHERE (o.is_deleted = 0 OR o.is_deleted IS NULL)
        AND (o.is_transferred = 0 OR o.is_transferred IS NULL)
      ORDER BY o.id DESC
    `).all()

    const itemsStmt = db.prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC")

    const notShipped = orders.map((o) => {
      const items = itemsStmt.all(o.id)

      // اگه سفارش اصلاً قلمی ندارد (سفارش قدیمی)، یه قلم از خود سفارش بساز
      const safeItems = items.length > 0
        ? items
        : [{ brick_type: o.brick_type, quantity: o.quantity, category: o.category }]

      // برای هر قلم، مقدار ارسال‌شده رو جدا حساب کن
      const itemsWithShipped = safeItems.map(item => {
        const shippedRow = db.prepare(`
          SELECT COALESCE(SUM(quantity), 0) as total
          FROM exits
          WHERE order_id = ?
            AND product_name = ?
            AND status != 'rejected'
            AND (is_extra = 0 OR is_extra IS NULL)
            AND (is_deleted = 0 OR is_deleted IS NULL)
        `).get(o.id, item.brick_type)

        const shipped = Number(shippedRow.total || 0)
        const total = Number(item.quantity || 0)
        const remaining = Math.max(0, total - shipped)

        return {
          ...item,
          shipped_quantity: shipped,
          remaining
        }
      })

      // مجموع باقی‌مانده همه اقلام
      const totalRemaining = itemsWithShipped.reduce((sum, item) => sum + item.remaining, 0)

      return {
        ...o,
        items: itemsWithShipped,
        total_remaining: totalRemaining
      }
    }).filter(o => {
      // سفارش‌هایی که بسته شدن (is_transferred) رو نشون نده
      if (o.is_transferred === 1) return false

      // فقط سفارش‌هایی که هنوز باقی‌مانده دارن (کامل خروجی نرفتن) رو نمایش بده
      return o.total_remaining > 0
    })

    // =========================
    // اطمینان از اینکه اگر سفارشی همه اقلامش ارسال شده ولی is_transferred=0 مونده،
    // به‌صورت خودکار بسته بشه (رفع باگ سفارش‌های گیرکرده)
    // =========================
    try {
      const staleOrders = notShipped.filter(o => Number(o.total_remaining || 0) <= 0)
      staleOrders.forEach(o => {
        db.prepare("UPDATE orders SET is_transferred = 1 WHERE id = ?").run(o.id)
      })
    } catch (err) {
      console.error("خطا در بستن سفارش‌های تکمیل‌شده:", err)
    }

    res.json(notShipped)
  } catch (error) {
    console.error(error)
    res.json([])
  }
})
// =========================
// API های نوتیفیکیشن
// =========================

// لیست نوتیفیکیشن‌های کاربر
app.get("/api/notifications", (req, res) => {
  const userId = req.user?.id

  if (!userId) {
    return res.json([])
  }

  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 50
    `).all(userId)

    res.json(notifications)
  } catch (error) {
    console.error(error)
    res.json([])
  }
})
// همه نوتیفیکیشن‌های کاربر (بدون limit)
app.get("/api/notifications/all", (req, res) => {
  const userId = req.user?.id

  if (!userId) {
    return res.json([])
  }

  try {
    const { search, type, status } = req.query

    let query = "SELECT * FROM notifications WHERE user_id = ?"
    const params = [userId]

    if (search) {
      query += " AND (title LIKE ? OR message LIKE ?)"
      params.push(`%${search}%`, `%${search}%`)
    }

    if (type) {
      query += " AND type = ?"
      params.push(type)
    }

    if (status === "read") {
      query += " AND is_read = 1"
    } else if (status === "unread") {
      query += " AND is_read = 0"
    }

    query += " ORDER BY id DESC"

    const notifications = db.prepare(query).all(...params)

    res.json(notifications)
  } catch (error) {
    console.error(error)
    res.json([])
  }
})

// تعداد خوانده‌نشده‌ها
app.get("/api/notifications/unread-count", (req, res) => {
  const userId = req.user?.id

  if (!userId) {
    return res.json({ count: 0 })
  }

  try {
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ? AND is_read = 0
    `).get(userId)

    res.json({ count: result.count })
  } catch (error) {
    console.error(error)
    res.json({ count: 0 })
  }
})

// خواندن همه نوتیفیکیشن‌ها
app.put("/api/notifications/read-all", (req, res) => {
  const userId = req.user?.id

  if (!userId) {
    return res.json({ success: false })
  }

  try {
    db.prepare(`
      UPDATE notifications SET is_read = 1 WHERE user_id = ?
    `).run(userId)

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false })
  }
})

// خواندن یه نوتیفیکیشن
app.put("/api/notifications/:id/read", (req, res) => {
  const { id } = req.params

  try {
    db.prepare(`
      UPDATE notifications SET is_read = 1 WHERE id = ?
    `).run(id)

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false })
  }
})

// =========================
// API های بک‌آپ
// =========================
// =========================
// جدول نوتیفیکیشن‌ها
// =========================
// =========================
// جداول تیکت
// =========================
db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    user_name TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS ticket_replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    user_id INTEGER,
    user_name TEXT,
    is_admin INTEGER DEFAULT 0,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
  )
`)

// =========================
// API های تیکت
// =========================

// ثبت تیکت جدید
app.post("/api/tickets", (req, res) => {
  const { subject, message } = req.body
  const userId = req.user?.id
  const userName = req.user?.username || "کاربر"

  if (!subject || !message) {
    return res.json({ success: false, message: "موضوع و متن الزامی است" })
  }

  try {
    const result = db.prepare(`
      INSERT INTO tickets (user_id, user_name, subject, message)
      VALUES (?, ?, ?, ?)
    `).run(userId, userName, subject, message)

    res.json({ success: true, id: result.lastInsertRowid })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا در ثبت تیکت" })
  }
})

// لیست تیکت‌های کاربر خودش
app.get("/api/my-tickets", (req, res) => {
  const userId = req.user?.id

  try {
    const tickets = db.prepare(`
      SELECT t.*, 
        (SELECT COUNT(*) FROM ticket_replies WHERE ticket_id = t.id) as replies_count
      FROM tickets t
      WHERE t.user_id = ?
      ORDER BY t.updated_at DESC
    `).all(userId)

    res.json(tickets)
  } catch (error) {
    console.error(error)
    res.json([])
  }
})

// لیست همه تیکت‌ها (فقط ادمین)
app.get("/api/tickets", (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "دسترسی غیرمجاز" })
  }

  try {
    const tickets = db.prepare(`
      SELECT t.*,
        (SELECT COUNT(*) FROM ticket_replies WHERE ticket_id = t.id) as replies_count
      FROM tickets t
      ORDER BY 
        CASE WHEN t.status = 'open' THEN 0 ELSE 1 END,
        t.updated_at DESC
    `).all()

    res.json(tickets)
  } catch (error) {
    console.error(error)
    res.json([])
  }
})

// جزئیات یه تیکت + پاسخ‌ها
app.get("/api/tickets/:id", (req, res) => {
  const { id } = req.params
  const userId = req.user?.id
  const role = req.user?.role

  try {
    const ticket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id)

    if (!ticket) {
      return res.json({ success: false, message: "تیکت پیدا نشد" })
    }

    // فقط ادمین یا صاحب تیکت
    if (role !== "admin" && ticket.user_id !== userId) {
      return res.status(403).json({ success: false, message: "دسترسی غیرمجاز" })
    }

    const replies = db.prepare(`
      SELECT * FROM ticket_replies
      WHERE ticket_id = ?
      ORDER BY created_at ASC
    `).all(id)

    res.json({ ...ticket, replies })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا" })
  }
})

// پاسخ دادن به تیکت
app.post("/api/tickets/:id/reply", (req, res) => {
  const { id } = req.params
  const { message } = req.body
  const userId = req.user?.id
  const userName = req.user?.username || "کاربر"
  const isAdmin = req.user?.role === "admin" ? 1 : 0

  if (!message) {
    return res.json({ success: false, message: "متن پاسخ الزامی است" })
  }

  try {
    const ticket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id)

    if (!ticket) {
      return res.json({ success: false, message: "تیکت پیدا نشد" })
    }

    if (isAdmin === 0 && ticket.user_id !== userId) {
      return res.status(403).json({ success: false, message: "دسترسی غیرمجاز" })
    }

    db.prepare(`
      INSERT INTO ticket_replies (ticket_id, user_id, user_name, is_admin, message)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, userId, userName, isAdmin, message)

    db.prepare(`
      UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id)

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا در ثبت پاسخ" })
  }
})

// بستن تیکت (فقط ادمین)
app.put("/api/tickets/:id/close", (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "دسترسی غیرمجاز" })
  }

  const { id } = req.params

  try {
    db.prepare(`
      UPDATE tickets SET status = 'closed', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id)

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا" })
  }
})

// باز کردن دوباره تیکت (فقط ادمین)
app.put("/api/tickets/:id/reopen", (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "دسترسی غیرمجاز" })
  }

  const { id } = req.params

  try {
    db.prepare(`
      UPDATE tickets SET status = 'open', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id)

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا" })
  }
})
// گزارش موجودی همه محصولات
app.get("/api/products-stock-full", (req, res) => {
  try {
    const products = db.prepare("SELECT * FROM products").all()

    const result = products.map((product) => {
      const ordered = db
        .prepare("SELECT COALESCE(SUM(quantity), 0) as total FROM orders WHERE brick_type = ?")
        .get(product.name).total || 0

      const produced = db
        .prepare("SELECT COALESCE(SUM(quantity), 0) as total FROM production WHERE product_name = ?")
        .get(product.name).total || 0
      // واحد همه محصولات عدد باشه
      const remaining = ordered - produced

       return {
        id: product.id,
        name: product.name,
        category: product.category,
        unit: "عدد",
        ordered,
        produced,
        remaining,
        status:
          ordered === 0 && produced === 0
            ? "بدون سفارش و تولید"
            : remaining <= 0 && ordered > 0
            ? "تکمیل شده"
            : produced > 0
            ? "در حال تولید"
            : "در انتظار"
      }
    })

    res.json(result)
  } catch (error) {
    console.error(error)
    res.json([])
  }
})
// لیست بک‌آپ‌ها
app.get("/api/backup/list", (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith(".db"))
      .map((f) => {
        const stats = fs.statSync(path.join(BACKUP_DIR, f))
        return {
          name: f,
          size: stats.size,
          date: stats.mtime
        }
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))

    res.json(files)
  } catch (error) {
    res.json([])
  }
})

// دانلود بک‌آپ
app.get("/api/backup/download/:fileName", (req, res) => {
  const { fileName } = req.params
  const filePath = path.join(BACKUP_DIR, fileName)

  if (fs.existsSync(filePath)) {
    res.download(filePath)
  } else {
    res.json({ success: false, message: "فایل پیدا نشد" })
  }
})

// حذف بک‌آپ
app.delete("/api/backup/:fileName", (req, res) => {
  const { fileName } = req.params
  const filePath = path.join(BACKUP_DIR, fileName)

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      res.json({ success: true })
    } else {
      res.json({ success: false, message: "فایل پیدا نشد" })
    }
  } catch (error) {
    res.json({ success: false, message: "خطا در حذف" })
  }
})
// =========================
// بک‌آپ خودکار هر روز ساعت ۴ صبح
// =========================

function scheduleBackup() {
  const now = new Date()
  const next = new Date()

  next.setHours(4, 0, 0, 0)
  if (next <= now) {
    next.setDate(next.getDate() + 1)
  }

  const delay = next - now

  setTimeout(() => {
    createBackup()
    scheduleBackup() // برنامه‌ریزی برای روز بعد
  }, delay)

  console.log(`⏰ بک‌آپ بعدی: ${next.toLocaleString("fa-IR")}`)
}

scheduleBackup()
// جدول دسته‌بندی‌ها
// =========================
// جداول چت روم
// =========================
db.exec(`
  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    user_full_name TEXT,
    message TEXT NOT NULL,
    reply_to_id INTEGER,
    is_edited INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

// ستون‌های جدید برای پشتیبانی از عکس
try { db.exec(`ALTER TABLE chat_messages ADD COLUMN image_url TEXT`) } catch (err) {}
try { db.exec(`ALTER TABLE chat_messages ADD COLUMN image_type TEXT`) } catch (err) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS chat_reads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    last_read_message_id INTEGER DEFAULT 0,
    last_read_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
  )
`)
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

db.prepare("INSERT OR IGNORE INTO categories (name) VALUES (?)").run("آجرهای صنعتی")
db.prepare("INSERT OR IGNORE INTO categories (name) VALUES (?)").run("آجرهای نسوز شاموت")
db.prepare("INSERT OR IGNORE INTO categories (name) VALUES (?)").run("آجرهای نسوز سمیرم")
// گرفتن همه دسته‌بندی‌ها
app.get("/api/categories", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM categories ORDER BY id ASC").all()
    res.json(rows || [])
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// افزودن دسته‌بندی جدید
app.post("/api/categories", (req, res) => {
  const { name } = req.body
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: "نام دسته‌بندی الزامی است" })
  }

  try {
    const result = db.prepare("INSERT INTO categories (name) VALUES (?)").run(name.trim())
    res.json({ success: true, id: result.lastInsertRowid })
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(400).json({ success: false, message: "این دسته‌بندی قبلاً وجود داره" })
    }
    res.status(500).json({ success: false, message: err.message })
  }
})

// ویرایش دسته‌بندی
app.put("/api/categories/:id", (req, res) => {
  const { id } = req.params
  const { name } = req.body

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: "نام دسته‌بندی الزامی است" })
  }

  try {
    db.prepare("UPDATE categories SET name = ? WHERE id = ?").run(name.trim(), id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// حذف دسته‌بندی
app.delete("/api/categories/:id", (req, res) => {
  const { id } = req.params
  try {
    db.prepare("DELETE FROM categories WHERE id = ?").run(id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})
// =========================
// API های آرشیو
// =========================

// لیست همه آیتم‌های حذف‌شده
app.get("/api/archive", (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "دسترسی غیرمجاز" })
  }

  try {
    const { type, search, from_date, to_date } = req.query

    const tables = [
      { key: "orders", label: "سفارش", table: "orders", nameField: "customer_name" },
      { key: "customers", label: "مشتری", table: "customers", nameField: "name" },
      { key: "production", label: "تولید", table: "production", nameField: "product_name" },
      { key: "exits", label: "خروجی", table: "exits", nameField: "customer_name" },
      { key: "products", label: "محصول", table: "products", nameField: "name" }
    ]

    const result = []

    tables.forEach((t) => {
      // اگه فیلتر نوع داریم و این جدول جزو اون نیست، ردش کن
      if (type && type !== t.key) return

      let query = `SELECT * FROM ${t.table} WHERE is_deleted = 1`
      const params = []

      // فیلتر تاریخ حذف
      if (from_date) {
        query += " AND deleted_at >= ?"
        params.push(from_date)
      }
      if (to_date) {
        query += " AND deleted_at <= ?"
        params.push(to_date + " 23:59:59")
      }

      query += " ORDER BY deleted_at DESC"

      const rows = db.prepare(query).all(...params)

      rows.forEach((row) => {
        // فیلتر جستجو
        if (search) {
          const term = search.toLowerCase()
          const name = (row[t.nameField] || "").toString().toLowerCase()
          const reason = (row.delete_reason || "").toString().toLowerCase()
          const by = (row.deleted_by || "").toString().toLowerCase()
          if (!name.includes(term) && !reason.includes(term) && !by.includes(term)) {
            return
          }
        }

        result.push({
          id: row.id,
          type: t.key,
          type_label: t.label,
          name: row[t.nameField] || "-",
          deleted_at: row.deleted_at,
          deleted_by: row.deleted_by,
          delete_reason: row.delete_reason,
          data: row
        })
      })
    })

    // مرتب‌سازی کل نتایج بر اساس تاریخ حذف
    result.sort((a, b) => {
      const da = a.deleted_at || ""
      const dbb = b.deleted_at || ""
      return dbb.localeCompare(da)
    })

    res.json(result)
  } catch (error) {
    console.error(error)
    res.json([])
  }
})

// بازیابی آیتم حذف‌شده
app.put("/api/archive/:type/:id/restore", (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "دسترسی غیرمجاز" })
  }

  const { type, id } = req.params

  const tableMap = {
    orders: "orders",
    customers: "customers",
    production: "production",
    exits: "exits",
    products: "products"
  }

  const table = tableMap[type]
  if (!table) {
    return res.json({ success: false, message: "نوع نامعتبر" })
  }

  try {
    db.prepare(`
      UPDATE ${table}
      SET is_deleted = 0,
          deleted_at = NULL,
          deleted_by = NULL,
          delete_reason = NULL
      WHERE id = ?
    `).run(id)

    // ثبت توی تاریخچه
    db.prepare(`
      INSERT INTO edit_history (table_name, record_id, action, new_data)
      VALUES (?, ?, ?, ?)
    `).run(table, id, "restore", JSON.stringify({ restored_by: req.user?.username }))

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا در بازیابی" })
  }
})

// حذف کامل (permanent)
app.delete("/api/archive/:type/:id/permanent", (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "دسترسی غیرمجاز" })
  }

  const { type, id } = req.params

  const tableMap = {
    orders: "orders",
    customers: "customers",
    production: "production",
    exits: "exits",
    products: "products"
  }

  const table = tableMap[type]
  if (!table) {
    return res.json({ success: false, message: "نوع نامعتبر" })
  }

  try {
    const oldData = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id)

    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id)

    db.prepare(`
      INSERT INTO edit_history (table_name, record_id, action, old_data)
      VALUES (?, ?, ?, ?)
    `).run(table, id, "permanent_delete", JSON.stringify(oldData))

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا در حذف کامل" })
  }
})
// =========================
// API های چت روم
// =========================
// =========================
// آپلود عکس در چت
// =========================
const multer = require("multer")

const chatStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, CHAT_UPLOAD_DIR)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg"
    const uniqueName = `chat-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
    cb(null, uniqueName)
  }
})

const chatUpload = multer({
  storage: chatStorage,
  limits: { fileSize: 500 * 1024 }, // حداکثر 500KB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("فقط فایل تصویری مجاز است (JPG, PNG, WEBP, GIF)"))
    }
  }
})

app.post("/api/chat/upload", chatUpload.single("image"), (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "دسترسی غیرمجاز" })
  }

  if (!req.file) {
    return res.json({ success: false, message: "فایلی ارسال نشد" })
  }

  const imageUrl = `/chat-uploads/${req.file.filename}`

  res.json({
    success: true,
    image_url: imageUrl,
    image_type: req.file.mimetype
  })
})

// =========================
// لیست پیام‌ها (با اطلاعات ریپلای)
// =========================
app.get("/api/chat/messages", (req, res) => {
  if (!req.user) {
    return res.json([])
  }

  try {
    const messages = db.prepare(`
      SELECT 
        m.*,
        r.user_name AS reply_user_name,
        r.user_full_name AS reply_user_full_name,
        r.message AS reply_message,
        r.is_deleted AS reply_is_deleted
      FROM chat_messages m
      LEFT JOIN chat_messages r ON m.reply_to_id = r.id
      WHERE m.is_deleted = 0
      ORDER BY m.id ASC
      LIMIT 200
    `).all()

    res.json(messages)
  } catch (error) {
    console.error(error)
    res.json([])
  }
})

// ارسال پیام جدید (متن یا عکس)
app.post("/api/chat/messages", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "دسترسی غیرمجاز" })
  }

  const { message, reply_to_id, image_url, image_type } = req.body

  if ((!message || !message.trim()) && !image_url) {
    return res.json({ success: false, message: "متن یا عکس پیام الزامی است" })
  }

  try {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id)

    const result = db.prepare(`
      INSERT INTO chat_messages (
        user_id, user_name, user_full_name, message, reply_to_id, image_url, image_type
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      req.user.username,
      user?.full_name || req.user.username,
      message ? message.trim() : "",
      reply_to_id || null,
      image_url || null,
      image_type || null
    )

    res.json({ success: true, id: result.lastInsertRowid })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا در ارسال پیام" })
  }
})

// ویرایش پیام (فقط تا ۱ دقیقه)
app.put("/api/chat/messages/:id", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "دسترسی غیرمجاز" })
  }

  const { id } = req.params
  const { message } = req.body

  if (!message || !message.trim()) {
    return res.json({ success: false, message: "متن پیام الزامی است" })
  }

  try {
    const msg = db.prepare("SELECT * FROM chat_messages WHERE id = ?").get(id)

    if (!msg) {
      return res.json({ success: false, message: "پیام پیدا نشد" })
    }

    if (msg.user_id !== req.user.id) {
      return res.json({ success: false, message: "فقط صاحب پیام می‌تواند ویرایش کند" })
    }

    // چک کن که از ۱ دقیقه نگذشته باشه
    const createdAt = new Date(msg.created_at + "Z").getTime()
    const now = Date.now()
    const diffMinutes = (now - createdAt) / 1000 / 60

    if (diffMinutes > 1) {
      return res.json({ success: false, message: "زمان ویرایش (۱ دقیقه) گذشته است" })
    }

    db.prepare(`
      UPDATE chat_messages
      SET message = ?, is_edited = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(message.trim(), id)

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا در ویرایش" })
  }
})

// حذف پیام (فقط صاحبش)
app.delete("/api/chat/messages/:id", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "دسترسی غیرمجاز" })
  }

  const { id } = req.params

  try {
    const msg = db.prepare("SELECT * FROM chat_messages WHERE id = ?").get(id)

    if (!msg) {
      return res.json({ success: false, message: "پیام پیدا نشد" })
    }

    if (msg.user_id !== req.user.id) {
      return res.json({ success: false, message: "فقط صاحب پیام می‌تواند حذف کند" })
    }

    db.prepare(`
      UPDATE chat_messages SET is_deleted = 1 WHERE id = ?
    `).run(id)

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا در حذف" })
  }
})

// علامت‌گذاری پیام‌ها به‌عنوان خوانده‌شده
app.post("/api/chat/read", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "دسترسی غیرمجاز" })
  }

  try {
    const latest = db.prepare("SELECT MAX(id) as lastId FROM chat_messages WHERE is_deleted = 0").get()
    const lastId = latest?.lastId || 0

    const existing = db.prepare("SELECT * FROM chat_reads WHERE user_id = ?").get(req.user.id)

    if (existing) {
      db.prepare(`
        UPDATE chat_reads
        SET last_read_message_id = ?, last_read_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(lastId, req.user.id)
    } else {
      db.prepare(`
        INSERT INTO chat_reads (user_id, last_read_message_id)
        VALUES (?, ?)
      `).run(req.user.id, lastId)
    }

    res.json({ success: true, last_read_message_id: lastId })
  } catch (error) {
    console.error(error)
    res.json({ success: false })
  }
})

// تعداد پیام‌های نخونده
app.get("/api/chat/unread-count", (req, res) => {
  if (!req.user) {
    return res.json({ count: 0 })
  }

  try {
    const read = db.prepare("SELECT * FROM chat_reads WHERE user_id = ?").get(req.user.id)
    const lastRead = read?.last_read_message_id || 0

    const result = db.prepare(`
      SELECT COUNT(*) as count FROM chat_messages
      WHERE id > ? AND is_deleted = 0 AND user_id != ?
    `).get(lastRead, req.user.id)

    res.json({ count: result.count || 0 })
  } catch (error) {
    console.error(error)
    res.json({ count: 0 })
  }
})
// =========================
// سرو کردن فایل‌های React (dist)
// =========================
const distPath = path.join(__dirname, "dist")

// فایل‌های استاتیک
app.use(express.static(distPath))

// همه مسیرهای دیگه → index.html (برای React Router)
app.get("/*splat", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"))
})
// =========================
// گزارش روزانه کارخانه (پیامک به کارفرما)
// =========================
async function sendDailyReport() {
  try {
    if (!OWNER_PHONE || OWNER_PHONE.length !== 11) {
      console.log("⚠️ شماره کارفرما تنظیم نشده، گزارش روزانه ارسال نشد")
      return
    }

    // تاریخ امروز شمسی
    const today = new Date()
    const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(today)
    const y = parts.find(p => p.type === "year")?.value
    const m = parts.find(p => p.type === "month")?.value
    const d = parts.find(p => p.type === "day")?.value
    const todayStr = `${y}/${m}/${d}`

    // تولید امروز
    const productionToday = db.prepare(`
      SELECT COALESCE(SUM(quantity), 0) as total
      FROM production
      WHERE production_date = ?
        AND (is_deleted = 0 OR is_deleted IS NULL)
    `).get(todayStr).total || 0

    // خروجی امروز (بدون رد شده)
    const exitsToday = db.prepare(`
      SELECT COALESCE(SUM(quantity), 0) as total
      FROM exits
      WHERE exit_date = ?
        AND status != 'rejected'
        AND (is_deleted = 0 OR is_deleted IS NULL)
    `).get(todayStr).total || 0

    // ارسال پیامک
    await sendSMS(OWNER_PHONE, SMS_TEMPLATES.DAILY_REPORT, [
      { name: "DATE", value: todayStr },
      { name: "PRODUCT", value: String(Number(productionToday).toLocaleString()) },
      { name: "QUANTITY", value: String(Number(exitsToday).toLocaleString()) }
    ])

    console.log(`📊 گزارش روزانه ارسال شد برای ${OWNER_PHONE}`)
  } catch (error) {
    console.error("❌ خطا در ارسال گزارش روزانه:", error)
  }
}

// =========================
// زمان‌بندی گزارش روزانه - هر شب ساعت ۲۳:۵۹
// =========================
// =========================
// چک کردن اعتبار پیامک (هشدار زیر ۱۰۰)
// =========================
async function checkSmsCredit() {
  try {
    if (!SMS_API_KEY) return
    if (!OWNER_PHONE || OWNER_PHONE.length !== 11) return

    const response = await fetch("https://api.sms.ir/v1/credit", {
      method: "GET",
      headers: {
        "X-API-KEY": SMS_API_KEY,
        "Content-Type": "application/json"
      }
    })

    const data = await response.json()

    if (data.status === 1) {
      const credit = Number(data.data)
      console.log(`📱 اعتبار پیامک: ${credit.toLocaleString()}`)

      if (credit < 100) {
        console.log(`⚠️ اعتبار پیامک کم است: ${credit}`)
        // از قالب گزارش روزانه برای هشدار استفاده می‌کنیم
        await sendSMS(OWNER_PHONE, SMS_TEMPLATES.DAILY_REPORT, [
          { name: "DATE", value: "⚠️ هشدار" },
          { name: "PRODUCT", value: `اعتبار پیامک: ${credit}` },
          { name: "QUANTITY", value: "لطفاً شارژ کنید" }
        ])
      }
    }
  } catch (error) {
    console.error("❌ خطا در چک کردن اعتبار پیامک:", error)
  }
}

function scheduleDailyReport() {
  const now = new Date()
  const next = new Date()
  next.setHours(21, 0, 0, 0)
  if (next <= now) {
    next.setDate(next.getDate() + 1)
  }

  const delay = next - now

  setTimeout(() => {
    sendDailyReport()
    checkSmsCredit()
    scheduleDailyReport()
  }, delay)

  console.log(`⏰ گزارش روزانه بعدی: ${next.toLocaleString("fa-IR")}`)
}
scheduleDailyReport()
// =========================
// جداول و APIهای پیش‌فاکتور
// =========================
db.exec(`
  CREATE TABLE IF NOT EXISTS pre_invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number INTEGER UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    issue_date TEXT NOT NULL,
    discount_percent REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    final_amount REAL DEFAULT 0,
    created_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS pre_invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pre_invoice_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    category TEXT,
    quantity REAL NOT NULL,
    unit TEXT DEFAULT 'عدد',
    unit_price REAL DEFAULT 0,
    total_price REAL DEFAULT 0,
    FOREIGN KEY (pre_invoice_id) REFERENCES pre_invoices(id) ON DELETE CASCADE
  )
`)

// دریافت لیست پیش‌فاکتورها
app.get("/api/pre-invoices", (req, res) => {
  try {
    const invoices = db.prepare("SELECT * FROM pre_invoices ORDER BY id DESC").all()
    const itemsStmt = db.prepare("SELECT * FROM pre_invoice_items WHERE pre_invoice_id = ?")
    const result = invoices.map(inv => ({
      ...inv,
      items: itemsStmt.all(inv.id)
    }))
    res.json(result)
  } catch (error) {
    console.error(error)
    res.json([])
  }
})

// ثبت پیش‌فاکتور جدید
app.post("/api/pre-invoices", (req, res) => {
  const { customer_name, customer_phone, issue_date, discount_percent, items } = req.body
  const username = req.user?.username || "نامشخص"

  if (!customer_name || !issue_date || !items || items.length === 0) {
    return res.json({ success: false, message: "اطلاعات ناقص است" })
  }

  try {
    const maxRow = db.prepare("SELECT COALESCE(MAX(invoice_number), 999) as maxNum FROM pre_invoices").get()
    const nextInvoiceNumber = Number(maxRow.maxNum) + 1

    let totalAmount = 0
    items.forEach(item => {
      totalAmount += (Number(item.quantity || 0) * Number(item.unit_price || 0))
    })
    const discountAmount = totalAmount * (Number(discount_percent || 0) / 100)
    const finalAmount = totalAmount - discountAmount

    const stmt = db.prepare(`
      INSERT INTO pre_invoices (
        invoice_number, customer_name, customer_phone, issue_date, 
        discount_percent, total_amount, final_amount, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      nextInvoiceNumber, customer_name, customer_phone, issue_date,
      discount_percent || 0, totalAmount, finalAmount, username
    )
    const invoiceId = result.lastInsertRowid

    const itemStmt = db.prepare(`
      INSERT INTO pre_invoice_items (
        pre_invoice_id, product_name, category, quantity, unit, unit_price, total_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    items.forEach(item => {
      const itemTotal = Number(item.quantity || 0) * Number(item.unit_price || 0)
      itemStmt.run(
        invoiceId, item.product_name, item.category, item.quantity, 
        item.unit, item.unit_price, itemTotal
      )
    })

    res.json({ success: true, id: invoiceId, invoice_number: nextInvoiceNumber })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا در ثبت پیش‌فاکتور" })
  }
})

// تبدیل پیش‌فاکتور به سفارش
app.post("/api/pre-invoices/:id/convert", (req, res) => {
  const { id } = req.params
  const username = req.user?.username || "نامشخص"

  try {
    const invoice = db.prepare("SELECT * FROM pre_invoices WHERE id = ?").get(id)
    if (!invoice) return res.json({ success: false, message: "پیش‌فاکتور پیدا نشد" })

    const items = db.prepare("SELECT * FROM pre_invoice_items WHERE pre_invoice_id = ?").all(id)
    if (items.length === 0) return res.json({ success: false, message: "پیش‌فاکتور خالی است" })

    const maxRow = db.prepare("SELECT COALESCE(MAX(order_number), 99) as maxNum FROM orders").get()
    const nextOrderNumber = Number(maxRow.maxNum) + 1
    const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    const firstItem = items[0]

    const orderStmt = db.prepare(`
      INSERT INTO orders (
        order_date, customer_name, category, brick_type, quantity, 
        order_number, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const orderResult = orderStmt.run(
      invoice.issue_date, invoice.customer_name, firstItem.category, 
      firstItem.product_name, totalQuantity, nextOrderNumber, username
    )
    const orderId = orderResult.lastInsertRowid

    const orderItemStmt = db.prepare(`
      INSERT INTO order_items (order_id, category, brick_type, quantity, notes)
      VALUES (?, ?, ?, ?, ?)
    `)
    items.forEach(item => {
      orderItemStmt.run(orderId, item.category, item.product_name, item.quantity, "")
    })

    res.json({ success: true, order_id: orderId })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "خطا در تبدیل به سفارش" })
  }
})
app.listen(PORT, () => {
  console.log(`سرور آجر نسوز محراب روی پورت ${PORT} فعال شد`)
})
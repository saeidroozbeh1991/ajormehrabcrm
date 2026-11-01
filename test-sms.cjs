const https = require("https")

https.get("https://api.sms.ir/v1/credit", (res) => {
  console.log("وضعیت:", res.statusCode)
  res.on("data", (d) => console.log("پاسخ:", d.toString()))
}).on("error", (e) => {
  console.error("خطا:", e.message)
})
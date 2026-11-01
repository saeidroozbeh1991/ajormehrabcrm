// تبدیل تاریخ میلادی به شمسی
// اگه تاریخ از قبل شمسی باشه، همون رو برمی‌گردونه
export function toPersianDate(dateStr) {
  if (!dateStr) return ""

  // اگه تاریخ با فرمت شمسی هست (مثل 1404/07/22)، همون رو برگردون
  if (typeof dateStr === "string" && dateStr.includes("/")) {
    const parts = dateStr.split("/")
    if (parts.length === 3 && parts[0].length === 4 && Number(parts[0]) > 1300) {
      // این تاریخ شمسیه، همون رو برگردون
      return dateStr
    }
  }

  // وگرنه میلادیه، تبدیل کن
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr

  return date.toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
}

// تبدیل تاریخ شمسی به میلادی (برای ذخیره)
export function toGregorianDate(persianDate) {
  if (!persianDate) return ""
  
  // این تابع ساده‌ست و برای تبدیل دقیق نیاز به کتابخانه داره
  // ولی برای نمایش کافیه
  return persianDate
}

// گرفتن امروز به شمسی
export function getTodayPersian() {
  return toPersianDate(new Date().toISOString().split("T")[0])
}
// نمایش پیغام خوشگل برای چاپ/اکسل
function showPrintToast(message, type = "warning") {
  const existing = document.getElementById("print-toast-container")
  if (existing) existing.remove()

  const container = document.createElement("div")
  container.id = "print-toast-container"
  container.style.cssText = `
    position: fixed;
    top: 30px;
    left: 50%;
    transform: translateX(-50%) translateY(-100px);
    z-index: 99999999;
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    pointer-events: none;
  `

  const isWarning = type === "warning"
  const bg = isWarning
    ? "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)"
    : "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)"
  const borderColor = isWarning ? "#f59e0b" : "#3b82f6"
  const textColor = isWarning ? "#92400e" : "#1e40af"
  const icon = isWarning ? "⚠️" : "ℹ️"

  const isDark = document.body.classList.contains("dark-mode")
  const darkBg = isWarning
    ? "linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.35) 100%)"
    : "linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.35) 100%)"

  container.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 22px;
      background: ${isDark ? darkBg : bg};
      border: 2px solid ${borderColor};
      border-radius: 16px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(12px);
      font-family: Tahoma, sans-serif;
      font-size: 14px;
      font-weight: 800;
      color: ${isDark ? (isWarning ? "#fcd34d" : "#bfdbfe") : textColor};
      white-space: nowrap;
      min-width: 260px;
      justify-content: center;
      direction: rtl;
    ">
      <span style="font-size: 20px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));">${icon}</span>
      <span>${message}</span>
    </div>
  `

  document.body.appendChild(container)

  requestAnimationFrame(() => {
    container.style.opacity = "1"
    container.style.transform = "translateX(-50%) translateY(0)"
  })

  setTimeout(() => {
    container.style.opacity = "0"
    container.style.transform = "translateX(-50%) translateY(-100px)"
    setTimeout(() => {
      if (container.parentNode) container.parentNode.removeChild(container)
    }, 400)
  }, 3000)
}
// چاپ جدول
export function printTable(tableId, title) {
  const table = document.getElementById(tableId)
  if (!table) {
    showPrintToast("⚠️ جدولی برای چاپ وجود ندارد", "warning")
    return
  }

  // توی موبایل، اگه window.open کار نکرد، از روش دیگه استفاده کن
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

  if (isMobile) {
    // روی موبایل، از پرینت مرورگر خودمون استفاده کن
    printTableMobile(table, title)
    return
  }

  // کپی جدول و حذف ستون عملیات
  const clonedTable = table.cloneNode(true)
  const headers = clonedTable.querySelectorAll("thead tr th")
  let opsIndex = -1

  headers.forEach((th, i) => {
    if (th.textContent.trim() === "عملیات") opsIndex = i
  })

  if (opsIndex !== -1) {
    headers[opsIndex].remove()
    clonedTable.querySelectorAll("tbody tr").forEach((tr) => {
      const tds = tr.querySelectorAll("td")
      if (tds[opsIndex]) tds[opsIndex].remove()
    })
  }

  const printWindow = window.open("", "_blank", "width=1200,height=800")

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: "Vazirmatn", Tahoma, sans-serif;
          padding: 30px;
          direction: rtl;
          color: #1e293b;
        }
        h1 {
          text-align: center;
          margin-bottom: 25px;
          font-size: 22px;
          color: #4f46e5;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 12px;
        }
        th {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          padding: 12px 8px;
          text-align: center;
          font-weight: 700;
        }
        td {
          padding: 10px 8px;
          text-align: center;
          border-bottom: 1px solid #e2e8f0;
        }
        tr:nth-child(even) {
          background: #f8fafc;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
        }
        @media print {
          body { padding: 15px; }
          th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #4f46e5;">
        <h1 style="margin: 0 0 6px 0; font-size: 22px; color: #4f46e5;">آجر نسوز و نما محراب</h1>
        <p style="margin: 0; font-size: 13px; color: #64748b;">${title}</p>
      </div>
           ${clonedTable.outerHTML}
       <div class="footer">
        تاریخ چاپ: ${new Date().toLocaleDateString("fa-IR")} | آجر نسوز و نما محراب
      </div>
    </body>
    </html>
  `)

  printWindow.document.close()
  setTimeout(() => {
    printWindow.focus()
    printWindow.print()
    // بعد از چاپ، پنجره رو ببند (فقط روی موبایل)
    printWindow.onafterprint = () => {
      printWindow.close()
    }
    // فالبک: اگه afterprint پشتیبانی نشد، بعد از ۱ ثانیه ببند
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.close()
      }
    }, 1000)
  }, 500)
}

// چاپ روی موبایل با iframe
function printTableMobile(table, title) {
  const clonedTable = table.cloneNode(true)
  const headers = clonedTable.querySelectorAll("thead tr th")
  let opsIndex = -1

  headers.forEach((th, i) => {
    if (th.textContent.trim() === "عملیات") opsIndex = i
  })

  if (opsIndex !== -1) {
    headers[opsIndex].remove()
    clonedTable.querySelectorAll("tbody tr").forEach((tr) => {
      const tds = tr.querySelectorAll("td")
      if (tds[opsIndex]) tds[opsIndex].remove()
    })
  }

  const iframe = document.createElement("iframe")
  iframe.style.position = "fixed"
  iframe.style.right = "0"
  iframe.style.bottom = "0"
  iframe.style.width = "0"
  iframe.style.height = "0"
  iframe.style.border = "0"
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow.document
  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: Tahoma, sans-serif;
          padding: 15px;
          direction: rtl;
          color: #1e293b;
        }
        h1 {
          text-align: center;
          margin-bottom: 15px;
          font-size: 16px;
          color: #4f46e5;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }
        th {
          background: #4f46e5;
          color: white;
          padding: 6px 4px;
          text-align: center;
          font-weight: 700;
        }
        td {
          padding: 5px 4px;
          text-align: center;
          border-bottom: 1px solid #e2e8f0;
        }
        @media print {
          th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div style="text-align: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 2px solid #4f46e5;">
        <h1 style="margin: 0 0 4px 0; font-size: 16px; color: #4f46e5;">آجر نسوز و نما محراب</h1>
        <p style="margin: 0; font-size: 10px; color: #64748b;">${title}</p>
      </div>
      ${clonedTable.outerHTML}
      <div style="margin-top: 15px; text-align: center; font-size: 9px; color: #94a3b8;">
        تاریخ چاپ: ${new Date().toLocaleDateString("fa-IR")} | آجر نسوز و نما محراب
      </div>
    </body>
    </html>
  `)
  doc.close()

  setTimeout(() => {
    iframe.contentWindow.focus()
    iframe.contentWindow.print()

    setTimeout(() => {
      if (iframe.parentNode) {
        document.body.removeChild(iframe)
      }
    }, 1000)
  }, 300)
}

// خروجی Excel
export function exportToExcel(tableId, fileName) {
  const table = document.getElementById(tableId)
  if (!table) {
    showPrintToast("⚠️ جدولی برای خروجی وجود ندارد", "warning")
    return
  }

  // کپی جدول و حذف ستون عملیات
  const clonedTable = table.cloneNode(true)
  const headers = clonedTable.querySelectorAll("thead tr th")
  let opsIndex = -1

  headers.forEach((th, i) => {
    if (th.textContent.trim() === "عملیات") opsIndex = i
  })

  if (opsIndex !== -1) {
    headers[opsIndex].remove()
    clonedTable.querySelectorAll("tbody tr").forEach((tr) => {
      const tds = tr.querySelectorAll("td")
      if (tds[opsIndex]) tds[opsIndex].remove()
    })
  }

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <style>
        table { border-collapse: collapse; direction: rtl; }
        th { background: #4f46e5; color: white; padding: 8px; border: 1px solid #ddd; }
        td { padding: 8px; border: 1px solid #ddd; text-align: center; }
      </style>
    </head>
      <body>${clonedTable.outerHTML}</body>
    </html>
  `

  const blob = new Blob(["\ufeff", html], {
    type: "application/vnd.ms-excel;charset=utf-8"
  })

  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = `${fileName}.xls`
  link.click()
  URL.revokeObjectURL(link.href)
}
import { useState, useRef, useEffect } from "react"

// تبدیل میلادی به شمسی
function toJalali(gy, gm, gd) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  let jy = gy <= 1600 ? 0 : 979
  gy -= gy <= 1600 ? 621 : 1600
  const gy2 = gm > 2 ? gy + 1 : gy
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1]
  jy += 33 * Math.floor(days / 12053)
  days %= 12053
  jy += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) {
    jy += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30)
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30)
  return [jy, jm, jd]
}

// تبدیل شمسی به میلادی
function toGregorian(jy, jm, jd) {
  let gy = jy <= 979 ? 621 : 1600
  jy -= jy <= 979 ? 0 : 979
  let days =
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186)
  gy += 400 * Math.floor(days / 146097)
  days %= 146097
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524)
    days %= 36524
    if (days >= 365) days++
  }
  gy += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) {
    gy += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }
  let gd = days + 1
  const sal_a = [
    0, 31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31, 30, 31, 30, 31, 31, 30, 31, 30, 31
  ]
  let gm
  for (gm = 1; gm <= 12 && gd > sal_a[gm]; gm++) {
    gd -= sal_a[gm]
  }
  return [gy, gm, gd]
}

// تعطیلات رسمی ۱۴۰۴ و ۱۴۰۵
const OFFICIAL_HOLIDAYS = [
  // ========== ۱۴۰۴ ==========
  "1404/01/01", "1404/01/02", "1404/01/03", "1404/01/04",
  "1404/01/12", "1404/01/13",
  "1404/02/04",
  "1404/03/14", "1404/03/15",
  "1404/04/10", "1404/04/18",
  "1404/05/02", "1404/05/03",
  "1404/05/11",
  "1404/05/20", "1404/05/22",
  "1404/06/08", "1404/06/17", "1404/06/19",
  "1404/08/15", "1404/08/23",
  "1404/09/30",
  "1404/10/02",
  "1404/11/22",
  "1404/12/01",
  "1404/12/29",

  // ========== ۱۴۰۵ ==========
  "1405/01/01", "1405/01/02", "1405/01/03", "1405/01/04",
  "1405/01/12", "1405/01/13",
  "1405/03/06",
  "1405/03/14", "1405/03/15",
  "1405/04/03", "1405/04/04",
  "1405/05/13",
  "1405/05/21", "1405/05/22", "1405/05/30",
  "1405/06/08",
  "1405/08/22",
  "1405/10/02", "1405/10/16",
  "1405/11/04", "1405/11/22",
  "1405/12/09", "1405/12/19", "1405/12/20", "1405/12/29"
]

function PersianDateInput({ value, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewYear, setViewYear] = useState(1405)
  const [viewMonth, setViewMonth] = useState(0)
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [showYearPicker, setShowYearPicker] = useState(false)
  const containerRef = useRef(null)

  const persianMonths = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
  ]

  const persianWeekDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"]

  // تنظیم ماه و سال اولیه
  useEffect(() => {
    if (value && value.includes("/")) {
      const parts = value.split("/").map(Number)
      if (parts[0] && parts[1] && parts[2]) {
        setViewYear(parts[0])
        setViewMonth(parts[1] - 1)
        return
      }
    }
    const today = new Date()
    const [jy, jm] = toJalali(today.getFullYear(), today.getMonth() + 1, today.getDate())
    setViewYear(jy)
    setViewMonth(jm - 1)
  }, [value])

  // بستن وقتی بیرون کلیک شد
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function isLeapYear(year) {
    const [gy] = toGregorian(year, 1, 1)
    const [ny] = toGregorian(year + 1, 1, 1)
    return ny - gy === 366
  }

  function getDaysInMonth(year, month) {
    if (month < 6) return 31
    if (month < 11) return 30
    return isLeapYear(year) ? 30 : 29
  }

  function getFirstWeekDay(year, month) {
    const [gy, gm, gd] = toGregorian(year, month + 1, 1)
    const date = new Date(gy, gm - 1, gd)
    return (date.getDay() + 1) % 7
  }

  function handleSelect(day) {
    const month = String(viewMonth + 1).padStart(2, "0")
    const d = String(day).padStart(2, "0")
    onChange(`${viewYear}/${month}/${d}`)
    setIsOpen(false)
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  function goToToday() {
    const today = new Date()
    const [jy, jm, jd] = toJalali(today.getFullYear(), today.getMonth() + 1, today.getDate())
    setViewYear(jy)
    setViewMonth(jm - 1)
    const month = String(jm).padStart(2, "0")
    const d = String(jd).padStart(2, "0")
    onChange(`${jy}/${month}/${d}`)
    setIsOpen(false)
  }

  function handleSelectMonth(m) {
    setViewMonth(m)
    setShowMonthPicker(false)
  }

  function handleSelectYear(y) {
    setViewYear(y)
    setShowYearPicker(false)
  }

  const years = []
  const currentYear = toJalali(new Date().getFullYear(), 1, 1)[0]
  for (let y = currentYear - 50; y <= currentYear + 20; y++) {
    years.push(y)
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstWeekDay = getFirstWeekDay(viewYear, viewMonth)

  const days = []
  for (let i = 0; i < firstWeekDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  return (
    <div className="persian-date-wrapper" ref={containerRef}>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "انتخاب تاریخ"}
        className="date-input"
        onFocus={() => setIsOpen(true)}
        readOnly
      />

      {isOpen && (
        <div className="persian-calendar">
          <div className="persian-calendar-header">
            <button type="button" onClick={nextMonth} title="ماه بعد">‹</button>
            <div className="persian-header-selectors">
              <button
                type="button"
                className="persian-month-btn"
                onClick={() => {
                  setShowMonthPicker(!showMonthPicker)
                  setShowYearPicker(false)
                }}
              >
                {persianMonths[viewMonth]} ▾
              </button>
              <button
                type="button"
                className="persian-year-btn"
                onClick={() => {
                  setShowYearPicker(!showYearPicker)
                  setShowMonthPicker(false)
                }}
              >
                {viewYear} ▾
              </button>
            </div>
            <button type="button" onClick={prevMonth} title="ماه قبل">›</button>
          </div>

          {showMonthPicker && (
            <div className="persian-picker-grid">
              {persianMonths.map((m, i) => (
                <button
                  key={i}
                  type="button"
                  className={`persian-picker-item ${viewMonth === i ? "active" : ""}`}
                  onClick={() => handleSelectMonth(i)}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          {showYearPicker && (
            <div className="persian-picker-grid year-grid">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  className={`persian-picker-item ${viewYear === y ? "active" : ""}`}
                  onClick={() => handleSelectYear(y)}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {!showMonthPicker && !showYearPicker && (
            <>
              <div className="persian-calendar-weekdays">
                {persianWeekDays.map((d, i) => (
                  <div key={i}>{d}</div>
                ))}
              </div>

              <div className="persian-calendar-days">
                {days.map((day, i) => {
                  // چک کن این روز، امروزه یا نه
                  const today = new Date()
                  const [todayYear, todayMonth, todayDay] = toJalali(
                    today.getFullYear(),
                    today.getMonth() + 1,
                    today.getDate()
                  )
                  const isToday =
                    day &&
                    viewYear === todayYear &&
                    viewMonth === todayMonth - 1 &&
                    day === todayDay

                  // چک کن جمعه هست یا نه
                  const dayOfWeek = day ? (firstWeekDay + day - 1) % 7 : -1
                  const isFriday = dayOfWeek === 6

                  // چک کن تعطیل رسمی هست یا نه
                  const dateKey = day
                    ? `${viewYear}/${String(viewMonth + 1).padStart(2, "0")}/${String(day).padStart(2, "0")}`
                    : ""
                  const isOfficialHoliday = day && OFFICIAL_HOLIDAYS.includes(dateKey)

                  const isHoliday = isFriday || isOfficialHoliday

                  return (
                    <div
                      key={i}
                      className={`persian-day ${day ? "" : "empty"} ${isToday ? "today" : ""} ${isHoliday ? "holiday" : ""}`}
                      onClick={() => day && handleSelect(day)}
                    >
                      {day || ""}
                    </div>
                  )
                })}
              </div>

              <div className="persian-calendar-footer">
                <button type="button" onClick={goToToday}>
                  امروز
                </button>
                <button type="button" onClick={() => setIsOpen(false)}>
                  بستن
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default PersianDateInput
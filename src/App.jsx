import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useNavigate, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  FilePlus,
  ClipboardList,
  Factory,
  BarChart3,
  User,
  Users,
  Save,
  ArrowRight,
  Package,
  Pencil,
  Trash2,
  TrendingUp,
  Truck,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Send,
  X,
  Edit2,
  Reply,
  FileText
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"
import { toPersianDate, printTable, exportToExcel } from "./dateHelper"
import PersianDateInput from "./PersianDateInput"
function authFetch(url, options = {}) {
  const token = sessionStorage.getItem("elena_token")
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "Authorization": token ? `Bearer ${token}` : ""
    }
  }).then((response) => {
    // اگه توکن منقضی شده بود یا معتبر نبود
    if (response.status === 401) {
      sessionStorage.removeItem("elena_user")
      sessionStorage.removeItem("elena_token")
      window.location.href = "/" // هدایت به صفحه لاگین
      return Promise.reject(new Error("Unauthorized"))
    }
    return response
  })
}
function AnimatedNumber({ value }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const end = Number(value) || 0
    const duration = 1500
    const startTime = Date.now()

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.floor(end * eased)

      setDisplayValue(current)

      if (progress >= 1) {
        setDisplayValue(end)
        clearInterval(timer)
      }
    }, 16)

    return () => clearInterval(timer)
  }, [value])

  return <>{displayValue.toLocaleString()}</>
}
function getRoleName(role) {
  const roles = {
    admin: "مدیر سیستم",
    office: "مسئول فروش",
    factory: "مسئول فروش",
    finance: "امور مالی",
    production: "مسئول تولید"
  }
  return roles[role] || "کاربر"
}
function App() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // تعیین صفحه از URL
  const getPageFromPath = (path) => {
    const pathMap = {
      "/": "dashboard",
      "/dashboard": "dashboard",
      "/orders": "orders",
      "/orders-list": "orders-list",
      "/customers": "customers",
      "/customer-report": "customer-report",
      "/products": "products-new",
      "/products-list": "products-list",
      "/products-stock": "products-stock",
      "/production": "production",
      "/production-primary": "production-primary",
      "/production-primary-report": "production-primary-report",
      "/production-final": "production-final",
      "/production-report": "production-report",
      "/shipment-create": "shipment-create",
      "/shipment-approve": "shipment-approve",
      "/shipment-report": "shipment-report",
      "/users": "users",
      "/notifications": "notifications",
      "/archive": "archive",
      "/reports": "reports",
      "/tickets": "tickets",
      "/pre-invoices": "pre-invoices",
      "/pre-invoices-list": "pre-invoices-list",
    }
    return pathMap[path] || "dashboard"
  }
  
  const page = getPageFromPath(location.pathname)
  
  // setPage معادل navigate
    const [showMobileMenu, setShowMobileMenu] = useState(false)

  const setPage = (newPage) => {

    const pathMap = {
      "dashboard": "/dashboard",
      "orders": "/orders",
      "orders-list": "/orders-list",
      "customers": "/customers",
      "customer-report": "/customer-report",
       "products-new": "/products",
      "products-list": "/products-list",
      "products-stock": "/products-stock",
      "production": "/production",
      "production-primary": "/production-primary",
      "production-primary-report": "/production-primary-report",
      "production-final": "/production-final",
      "production-report": "/production-report",
      "shipment-create": "/shipment-create",
      "shipment-approve": "/shipment-approve",
      "shipment-report": "/shipment-report",
      "users": "/users",
      "notifications": "/notifications",
      "archive": "/archive",
      "reports": "/reports",
      "tickets": "/tickets",
      "pre-invoices": "/pre-invoices",
      "pre-invoices-list": "/pre-invoices-list",
    }

    // همیشه همه زیرمنوها رو ببند
    setShowOrderMenu(false)
    setShowCustomerMenu(false)
    setShowProductionMenu(false)
    setShowShipmentMenu(false)
    setShowProductsMenu(false)
    setShowPreInvoiceMenu(false)

    setShowMobileMenu(false)

    navigate(pathMap[newPage] || "/dashboard")
  }
  const [currentUser, setCurrentUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [productions, setProductions] = useState([])
 const [darkMode, setDarkMode] = useState(false)
const [themeMode, setThemeMode] = useState(() => {
  return localStorage.getItem("elena_theme") || "light"
})
  const [ordersStatus, setOrdersStatus] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
  const [editItem, setEditItem] = useState(null)
    const [exits, setExits] = useState([])
  const [ordersNotShipped, setOrdersNotShipped] = useState([])
  const [dashboardStats, setDashboardStats] = useState(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
    const [showShipmentMenu, setShowShipmentMenu] = useState(false)
        const [showProductionMenu, setShowProductionMenu] = useState(false)
            const [showCustomerMenu, setShowCustomerMenu] = useState(false)
    const [showOrderMenu, setShowOrderMenu] = useState(false)
    const [showProductsMenu, setShowProductsMenu] = useState(false)
    const [showPreInvoiceMenu, setShowPreInvoiceMenu] = useState(false)
    const [showDeveloperInfo, setShowDeveloperInfo] = useState(false)
         const [showProfileModal, setShowProfileModal] = useState(false)
 const [toasts, setToasts] = useState([])
// چک کن کاربر به منوی اصلی دسترسی داره یا نه
const hasMainAccess = currentUser?.role === "admin" || currentUser?.role === "office" || currentUser?.role === "finance" || currentUser?.role === "factory"
const showToast = (message, type = "success") => {
  const id = Date.now()
  setToasts((prev) => [...prev, { id, message, type }])
}

const removeToast = (id) => {
  setToasts((prev) => prev.filter((t) => t.id !== id))
}

  // =====================
  // توابع load (اول تعریف می‌شن)
  // =====================
    const loadProductions = () => {
    authFetch("/api/production")
      .then((response) => response.json())
      .then((data) => {
        setProductions(Array.isArray(data) ? data : data.productions || [])
      })
      .catch((error) => {
        console.error("خطا در دریافت تولیدات:", error)
        setProductions([])
      })
  }
  const loadOrders = () => {
    authFetch("/api/orders")
      .then((response) => response.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : data.orders || [])
        loadDashboardStats()
        loadOrdersNotShipped()
      })
      .catch((error) => {
        console.error("خطا در دریافت سفارشات:", error)
      })
  }

  const loadCustomers = () => {
    authFetch("/api/customers")
      .then((response) => response.json())
      .then((data) => {
        setCustomers(data)
      })
      .catch((error) => {
        console.error("خطا در دریافت مشتریان:", error)
      })
  }

  const loadProducts = () => {
    authFetch("/api/products")
      .then((response) => response.json())
      .then((data) => {
        setProducts(data)
      })
      .catch((error) => {
        console.error("خطا در دریافت محصولات:", error)
      })
  }
  const loadCategories = () => {
    authFetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((error) => console.error("خطا در دریافت دسته‌بندی‌ها:", error))
  }
    const loadExits = () => {
    authFetch("/api/exits")
      .then((res) => res.json())
      .then((data) => setExits(Array.isArray(data) ? data : []))
      .catch((error) => console.error("خطا در دریافت خروجی‌ها:", error))
  }

  const loadOrdersNotShipped = () => {
    authFetch("/api/orders-not-shipped")
      .then((res) => res.json())
      .then((data) => setOrdersNotShipped(Array.isArray(data) ? data : []))
      .catch((error) => console.error("خطا در دریافت سفارش‌های ارسال‌نشده:", error))
  }
const loadDashboardStats = () => {
  authFetch("/api/products-stock-full")
    .then((res) => res.json())
    .then((data) => {
      const productsArray = Array.isArray(data) ? data : []
      setDashboardStats({ productsStock: productsArray })
    })
    .catch((error) => console.error("خطا در آمار داشبورد:", error))
}
  const canAccessPage = (pageName) => {
    const role = currentUser?.role

    if (role === "admin") return true
    if (pageName === "products-stock") return true
    if (pageName === "notifications") return true
    if (pageName === "products-new") return true
    if (pageName === "products-list") return true
    if (pageName === "reports") return true
    if (pageName === "tickets") return true
    if (pageName === "pre-invoices") return true
    if (pageName === "pre-invoices-list") return true

    const officePages = [
      "dashboard",
      "orders",
      "orders-list",
      "customers",
      "customer-report",
      "production",
      "production-primary",
      "production-primary-report",
      "production-final",
      "production-report",
      "shipment-create",
      "shipment-report"
    ]

    const financePages = [
      "dashboard",
      "orders",
      "orders-list",
      "customers",
      "customer-report",
      "production",
      "production-primary",
      "production-primary-report",
      "production-final",
      "production-report",
      "shipment-create",
      "shipment-approve",
      "shipment-report"
    ]

    // 👇 دسترسی‌های نقش جدید (تولید)
    const productionPages = [
      "dashboard",
      "production",
      "production-primary",
      "production-primary-report",
      "production-final",
      "production-report"
    ]

    if ((role === "office" || role === "factory") && officePages.includes(pageName)) return true
    if (role === "finance" && financePages.includes(pageName)) return true
    if (role === "production" && productionPages.includes(pageName)) return true

    return false
  }

  // =====================
  // توابع هندلر
  // =====================
 const handleLogin = (user, token) => {
  sessionStorage.setItem("elena_user", JSON.stringify(user))
  sessionStorage.setItem("elena_token", token)
  setCurrentUser(user)

  if (user.role === "office" || user.role === "factory") {
    setPage("orders")
  } else {
    setPage("dashboard")
  }
}

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    setCurrentUser(null)
    sessionStorage.removeItem("elena_user")
    sessionStorage.removeItem("elena_token")
    setOrders([])
    setProductions([])
    setCustomers([])
    setProducts([])
    setCategories([])
    setExits([])
    setOrdersNotShipped([])
    setOrdersStatus([])
    setDashboardStats(null)
    setEditItem(null)
    setPage("dashboard")
    setShowLogoutConfirm(false)
  }

  // =====================
  // useEffect ها (بعد از توابع)
  // =====================
  useEffect(() => {
    const savedUser = sessionStorage.getItem("elena_user")
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser))
      } catch (e) {
        sessionStorage.removeItem("elena_user")
      }
    }
  }, [])

   useEffect(() => {
    if (!currentUser) return   // ← اگه لاگین نکرده، کاری نکن

         loadProductions()
    loadCustomers()
    loadProducts()
    loadCategories()
    loadDashboardStats()
    loadExits()
    loadOrdersNotShipped()

    authFetch("/api/orders")
      .then((response) => response.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : data.orders || [])
      })
      .catch((error) => {
        console.error("خطا در دریافت سفارشات:", error)
      })

    authFetch("/api/orders-status")
      .then((response) => response.json())
      .then((data) => {
        setOrdersStatus(data)
      })
      .catch((error) => {
        console.error("خطا در دریافت وضعیت سفارشات:", error)
      })
  }, [currentUser])   // ← وقتی currentUser عوض شد، اجرا کن
    useEffect(() => {
    setShowMobileMenu(false)
    setShowOrderMenu(false)
    setShowCustomerMenu(false)
    setShowProductionMenu(false)
    setShowShipmentMenu(false)
    setShowProductsMenu(false)
    setShowPreInvoiceMenu(false)
  }, [page])

  // وقتی منوی موبایل باز میشه، همه زیرمنوها بسته بشن
  useEffect(() => {
    if (showMobileMenu) {
      setShowOrderMenu(false)
      setShowCustomerMenu(false)
      setShowProductionMenu(false)
      setShowShipmentMenu(false)
      setShowProductsMenu(false)
      setShowPreInvoiceMenu(false)
    }
  }, [showMobileMenu])
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [showMobileMenu])

  useEffect(() => {
    let isDark = false

    if (themeMode === "dark") {
      isDark = true
    } else if (themeMode === "light") {
      isDark = false
    } else if (themeMode === "system") {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    }

    setDarkMode(isDark)
    localStorage.setItem("elena_theme", themeMode)

    if (isDark) {
      document.body.classList.add("dark-mode")
    } else {
      document.body.classList.remove("dark-mode")
    }
  }, [themeMode])

  // گوش دادن به تغییر تم سیستم
  useEffect(() => {
    if (themeMode !== "system") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = (e) => {
      setDarkMode(e.matches)
      if (e.matches) {
        document.body.classList.add("dark-mode")
      } else {
        document.body.classList.remove("dark-mode")
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [themeMode])

  // (حذف شده — این effect خالی بود)

    useEffect(() => {
    if (currentUser && !canAccessPage(page)) {
      if (currentUser.role === "office" || currentUser.role === "factory") {
        setPage("orders")
      } else {
        setPage("dashboard")
      }
    }
  }, [page, currentUser])

  // =====================
  // رندر
  // =====================
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div dir="rtl" className="app">
      {/* اورلی موبایل */}
      {showMobileMenu && (
        <div
          className="mobile-overlay"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      {/* منوی سمت راست */}
      <aside className={`sidebar ${showMobileMenu ? "mobile-open" : ""}`} style={{ zIndex: showMobileMenu ? 999999 : undefined }}>
        <div className="sidebar-inner">
    <div className="brand">
  <img src="/logo.jpg" alt="آجر نسوز و نما" />
</div>

    {/* هدر کاربر توی موبایل */}
    <MobileUserHeader
      currentUser={currentUser}
      setPage={setPage}
      handleLogout={handleLogout}
      setShowMobileMenu={setShowMobileMenu}
    />

             <div className="menu">

{currentUser?.role === "admin" || currentUser?.role === "finance" || currentUser?.role === "office" || currentUser?.role === "production" ? (
              <button
  className={`menu-item ${page === "dashboard" ? "active" : ""}`}
  onClick={() => {
    setPage("dashboard")
    setShowOrderMenu(false)
    setShowCustomerMenu(false)
    setShowProductionMenu(false)
    setShowShipmentMenu(false)
    setShowProductsMenu(false)
    setShowPreInvoiceMenu(false)
    setShowMobileMenu(false)
  }}
>
    <LayoutDashboard size={20} className="menu-icon" />
    <span>داشبورد</span>
  </button>
) : null}

          {hasMainAccess && (
            <>
                     <button
              className={`menu-item ${
  showProductsMenu ||
  (["products-new", "products-list", "products-stock"].includes(page) &&
   !showOrderMenu && !showCustomerMenu && !showProductionMenu && !showShipmentMenu)
    ? "active" : ""
}`}
                 onClick={() => {
                  setShowProductsMenu(!showProductsMenu)
                  setShowOrderMenu(false)
                  setShowCustomerMenu(false)
                  setShowProductionMenu(false)
                  setShowShipmentMenu(false)
                }}
              >
                <Package size={20} className="menu-icon" />
                <span>محصولات</span>
                       <span className={`submenu-arrow ${showProductsMenu ? "open" : ""}`}>
                  {showProductsMenu ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </button>

              <div className={`submenu ${showProductsMenu ? "open" : ""}`}>
                <button
                  className={`submenu-item ${page === "products-new" ? "active" : ""}`}
                  onClick={() => {
                    setPage("products-new")
                    setShowProductsMenu(false)
                  }}
                >
                  <span>ثبت محصول جدید</span>
                </button>

                <button
                  className={`submenu-item ${page === "products-list" ? "active" : ""}`}
                  onClick={() => {
                    setPage("products-list")
                    setShowProductsMenu(false)
                  }}
                >
                  <span>گزارش محصولات</span>
                </button>
              </div>
            </>
          )}
            {/* مشتریان (زیرمنو) */}
          {hasMainAccess && (
            <>
              <button
                className={`menu-item ${
                  (["customers", "customer-report"].includes(page) && !showOrderMenu && !showProductionMenu && !showShipmentMenu) || showCustomerMenu ? "active" : ""
                }`}
                 onClick={() => {
                  setShowCustomerMenu(!showCustomerMenu)
                  setShowOrderMenu(false)
                  setShowProductionMenu(false)
                  setShowShipmentMenu(false)
                  setShowProductsMenu(false)
                }}
              >
                <Users size={20} className="menu-icon" />
                <span>مشتریان</span>
                <span className="submenu-arrow">
                  {showCustomerMenu ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>

              <div className={`submenu ${showCustomerMenu ? "open" : ""}`}>
                <button
                  className={`submenu-item ${page === "customers" ? "active" : ""}`}
                  onClick={() => setPage("customers")}
                >
                  <span>ثبت مشتری جدید</span>
                </button>

                <button
                  className={`submenu-item ${page === "customer-report" ? "active" : ""}`}
                  onClick={() => setPage("customer-report")}
                >
                  <span>گزارش مشتریان</span>
                </button>
              </div>
            </>
          )}
                {/* سفارشات (زیرمنو) */}
          {hasMainAccess && (
            <>
              <button
                className={`menu-item ${
                  (["orders", "orders-list"].includes(page) && !showProductionMenu && !showCustomerMenu && !showShipmentMenu) || showOrderMenu ? "active" : ""
                }`}
                  onClick={() => {
                  setShowOrderMenu(!showOrderMenu)
                  setShowCustomerMenu(false)
                  setShowProductionMenu(false)
                  setShowShipmentMenu(false)
                  setShowProductsMenu(false)
                }}
              >
                <ClipboardList size={20} className="menu-icon" />
                <span>سفارشات</span>
                <span className="submenu-arrow">
                  {showOrderMenu ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>

              <div className={`submenu ${showOrderMenu ? "open" : ""}`}>
                <button
                  className={`submenu-item ${page === "orders" ? "active" : ""}`}
                  onClick={() => setPage("orders")}
                >
                  <span>ثبت سفارش جدید</span>
                </button>

                <button
                  className={`submenu-item ${page === "orders-list" ? "active" : ""}`}
                  onClick={() => setPage("orders-list")}
                >
                  <span>لیست سفارشات</span>
                </button>
              </div>
            </>
          )}

          {/* پیش‌فاکتورها (زیرمنو) */}
          {hasMainAccess && (
            <>
              <button
                className={`menu-item ${
                  (["pre-invoices", "pre-invoices-list"].includes(page) && !showOrderMenu && !showCustomerMenu && !showProductionMenu && !showShipmentMenu) || showPreInvoiceMenu ? "active" : ""
                }`}
                onClick={() => {
                  setShowPreInvoiceMenu(!showPreInvoiceMenu)
                  setShowOrderMenu(false)
                  setShowCustomerMenu(false)
                  setShowProductionMenu(false)
                  setShowShipmentMenu(false)
                  setShowProductsMenu(false)
                }}
              >
                <FileText size={20} className="menu-icon" />
                <span>پیش‌فاکتورها</span>
                <span className="submenu-arrow">
                  {showPreInvoiceMenu ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>

              <div className={`submenu ${showPreInvoiceMenu ? "open" : ""}`}>
                <button
                  className={`submenu-item ${page === "pre-invoices" ? "active" : ""}`}
                  onClick={() => setPage("pre-invoices")}
                >
                  <span>ثبت پیش‌فاکتور جدید</span>
                </button>

                <button
                  className={`submenu-item ${page === "pre-invoices-list" ? "active" : ""}`}
                  onClick={() => setPage("pre-invoices-list")}
                >
                  <span>گزارش پیش‌فاکتورها</span>
                </button>
              </div>
            </>
          )}

  
          {/* تولید (زیرمنو) */}
          {(hasMainAccess || currentUser?.role === "production") && (
            <>
              <button
                className={`menu-item ${
                  (["production", "production-report"].includes(page) && !showOrderMenu && !showCustomerMenu && !showShipmentMenu) || showProductionMenu ? "active" : ""
                }`}
                  onClick={() => {
                  setShowProductionMenu(!showProductionMenu)
                  setShowOrderMenu(false)
                  setShowCustomerMenu(false)
                  setShowShipmentMenu(false)
                  setShowProductsMenu(false)
                }}
              >
                <Factory size={20} className="menu-icon" />
                <span>تولید</span>
                <span className="submenu-arrow">
                  {showProductionMenu ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>

              <div className={`submenu ${showProductionMenu ? "open" : ""}`}>
                <button
                  className={`submenu-item ${page === "production-primary" ? "active" : ""}`}
                  onClick={() => setPage("production-primary")}
                >
                  <span>تولید اولیه</span>
                </button>

                <button
                  className={`submenu-item ${page === "production-primary-report" ? "active" : ""}`}
                  onClick={() => setPage("production-primary-report")}
                >
                  <span>گزارش تولید اولیه</span>
                </button>

                <button
                  className={`submenu-item ${page === "production-final" ? "active" : ""}`}
                  onClick={() => setPage("production-final")}
                >
                  <span>تولید نهایی</span>
                </button>

                <button
                  className={`submenu-item ${page === "production-report" ? "active" : ""}`}
                  onClick={() => setPage("production-report")}
                >
                  <span>گزارش تولید نهایی</span>
                </button>
              </div>
            </>
          )}
  
               {/* خروج کالا (زیرمنو) */}
          {hasMainAccess && (
            <>
            <button
              className={`menu-item ${
                (["shipment-create", "shipment-approve", "shipment-report"].includes(page) && !showOrderMenu && !showCustomerMenu && !showProductionMenu) || showShipmentMenu ? "active" : ""
              }`}
                onClick={() => {
                setShowShipmentMenu(!showShipmentMenu)
                setShowOrderMenu(false)
                setShowCustomerMenu(false)
                setShowProductionMenu(false)
                setShowProductsMenu(false)
              }}
            >
              <Truck size={20} className="menu-icon" />
              <span>خروج کالا</span>
              <span className="submenu-arrow">
                {showShipmentMenu ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>

            <div className={`submenu ${showShipmentMenu ? "open" : ""}`}>
              {(currentUser?.role === "office" || currentUser?.role === "finance" || currentUser?.role === "admin") && (
                <button
                  className={`submenu-item ${page === "shipment-create" ? "active" : ""}`}
                  onClick={() => setPage("shipment-create")}
                >
                  <span>ثبت خروجی</span>
                </button>
              )}

              {(currentUser?.role === "finance" || currentUser?.role === "admin") && (
                <button
                  className={`submenu-item ${page === "shipment-approve" ? "active" : ""}`}
                  onClick={() => setPage("shipment-approve")}
                >
                  <span>تأیید خروجی</span>
                </button>
              )}

              <button
                className={`submenu-item ${page === "shipment-report" ? "active" : ""}`}
                onClick={() => setPage("shipment-report")}
              >
                <span>گزارش خروجی</span>
              </button>
            </div>
            </>
          )}



        <div className="sidebar-theme-switch">
          <ThemeSwitcher
            themeMode={themeMode}
            setThemeMode={setThemeMode}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            variant="sidebar"
          />
        </div>
        {/* کارت اعتبار پیامکی - زیر پنل تم */}
        {(currentUser?.role === "admin" || currentUser?.role === "office") && (
          <SidebarSmsCredit currentUser={currentUser} />
        )}

        {/* شماره نسخه */}
        <div className="sidebar-version">
          نسخه ۱.۰.۰
        </div>

        </div>
      </div>
    </aside>
      {/* قسمت اصلی */}
      <main className="main">

      {/* نوار بالای همه صفحات */}
      <div className="global-topbar">
        <div className="global-topbar-right">
          <button
            className="mobile-menu-btn"
            onClick={() => {
              setShowMobileMenu(!showMobileMenu)
              setShowOrderMenu(false)
              setShowCustomerMenu(false)
              setShowProductionMenu(false)
              setShowShipmentMenu(false)
              setShowProductsMenu(false)
              setShowPreInvoiceMenu(false)
            }}
            aria-label="منو"
          >
            ☰
          </button>
         <strong className="global-topbar-title">آجر نسوز محراب</strong>
        </div>

   <div className="global-topbar-left">
  <ChatButton currentUser={currentUser} showToast={showToast} />

  <NotificationBell currentUser={currentUser} setPage={setPage} setShowMobileMenu={setShowMobileMenu} />

  <UserMenu
    currentUser={currentUser}
    setPage={setPage}
    handleLogout={handleLogout}
    darkMode={darkMode}
    setDarkMode={setDarkMode}
    setShowMobileMenu={setShowMobileMenu}
    setShowProfileModal={setShowProfileModal}
    setShowDeveloperInfo={setShowDeveloperInfo}
  />
</div>
      </div>

  {page === "dashboard" && canAccessPage("dashboard") && (
    currentUser?.role === "admin" ? (
      <Dashboard
        setPage={setPage}
        orders={orders}
        productions={productions}
        ordersStatus={ordersStatus}
        dashboardStats={dashboardStats}
        showToast={showToast}
        currentUser={currentUser}
        handleLogout={handleLogout}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    ) : currentUser?.role === "production" ? (
      <ProductionDashboard
        setPage={setPage}
        productions={productions}
        currentUser={currentUser}
        handleLogout={handleLogout}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    ) : (
      <SharedDashboard
        setPage={setPage}
        orders={orders}
        productions={productions}
        ordersStatus={ordersStatus}
        dashboardStats={dashboardStats}
        currentUser={currentUser}
        handleLogout={handleLogout}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    )
  )}

      {page === "orders" && canAccessPage("orders") && (
  <OrderForm
    setPage={setPage}
    loadOrders={loadOrders}
    products={products}
    customers={customers}
    categories={categories}
    showToast={showToast}
    currentUser={currentUser}
    handleLogout={handleLogout}
    darkMode={darkMode}
    setDarkMode={setDarkMode}
    orders={orders}
    exits={exits} 
    loadOrdersNotShipped={loadOrdersNotShipped}
  />
)}

{page === "orders-list" && canAccessPage("orders-list") && (
  <OrdersList
    orders={orders}
    loadOrders={loadOrders}
    setEditItem={setEditItem}
    currentUser={currentUser}
    setPage={setPage}
    handleLogout={handleLogout}
    darkMode={darkMode}
    setDarkMode={setDarkMode}
    categories={categories}
  />
)}

{page === "pre-invoices" && canAccessPage("pre-invoices") && (
  <PreInvoicesPage
    viewMode="create"
    currentUser={currentUser}
    showToast={showToast}
    setPage={setPage}
    handleLogout={handleLogout}
    darkMode={darkMode}
    setDarkMode={setDarkMode}
    customers={customers}
    products={products}
    categories={categories}
    loadOrders={loadOrders}
  />
)}

{page === "pre-invoices-list" && canAccessPage("pre-invoices-list") && (
  <PreInvoicesPage
    viewMode="list"
    currentUser={currentUser}
    showToast={showToast}
    setPage={setPage}
    handleLogout={handleLogout}
    darkMode={darkMode}
    setDarkMode={setDarkMode}
    customers={customers}
    products={products}
    categories={categories}
    loadOrders={loadOrders}
  />
)}

       {page === "customers" && canAccessPage("customers") && (
  <CustomersPage
    customers={customers}
    loadCustomers={loadCustomers}
    setEditItem={setEditItem}
    showToast={showToast}
    currentUser={currentUser}
    setPage={setPage}
    handleLogout={handleLogout}
    darkMode={darkMode}
    setDarkMode={setDarkMode}
  />
)}
       {page === "production" && canAccessPage("production") && (
  <ProductionForm
    loadProductions={loadProductions}
    orders={orders}
    products={products}
    categories={categories}
    loadDashboardStats={loadDashboardStats}
    showToast={showToast}
    currentUser={currentUser}
    setPage={setPage}
    handleLogout={handleLogout}
    darkMode={darkMode}
    setDarkMode={setDarkMode}
  />
)}
       {page === "production-primary" && canAccessPage("production-primary") && (
  <ProductionForm
    productionType="primary"
    loadProductions={loadProductions}
    orders={orders}
    products={products}
    categories={categories}
    loadDashboardStats={loadDashboardStats}
    showToast={showToast}
    currentUser={currentUser}
    setPage={setPage}
    handleLogout={handleLogout}
    darkMode={darkMode}
    setDarkMode={setDarkMode}
  />
)}

{page === "production-primary-report" && canAccessPage("production-primary-report") && (
  <ProductionPrimaryReport
    productions={productions}
    loadProductions={loadProductions}
    setEditItem={setEditItem}
    products={products}
    categories={categories}
    currentUser={currentUser}
    setPage={setPage}
    handleLogout={handleLogout}
    darkMode={darkMode}
    setDarkMode={setDarkMode}
  />
)}

{page === "production-final" && canAccessPage("production-final") && (
  <ProductionForm
    productionType="final"
    loadProductions={loadProductions}
    orders={orders}
    products={products}
    categories={categories}
    loadDashboardStats={loadDashboardStats}
    showToast={showToast}
    currentUser={currentUser}
    setPage={setPage}
    handleLogout={handleLogout}
    darkMode={darkMode}
    setDarkMode={setDarkMode}
  />
)}

{page === "products-new" && canAccessPage("products-new") && (
  <ProductsPage
    products={products}
    loadProducts={loadProducts}
    setEditItem={setEditItem}
    showToast={showToast}
    setPage={setPage}
    currentUser={currentUser}
    handleLogout={handleLogout}
    darkMode={darkMode}
    setDarkMode={setDarkMode}
    categories={categories}
    loadCategories={loadCategories}
  />
)}

{page === "products-list" && canAccessPage("products-list") && (
  <ProductsListPage
    products={products}
    loadProducts={loadProducts}
    setEditItem={setEditItem}
    showToast={showToast}
    setPage={setPage}
    currentUser={currentUser}
    handleLogout={handleLogout}
    darkMode={darkMode}
    setDarkMode={setDarkMode}
    categories={categories}
  />
)}
      {page === "production-report" && canAccessPage("production-report") && (
  <ProductionReport
    productions={productions}
    loadProductions={loadProductions}
    setEditItem={setEditItem}
    products={products}
    categories={categories}
    currentUser={currentUser}
    setPage={setPage}
    handleLogout={handleLogout}
    darkMode={darkMode}
    setDarkMode={setDarkMode}
  />
)}

        {page === "customer-report" && canAccessPage("customer-report") && (
  <CustomerReport
    customers={customers}
    products={products}
    currentUser={currentUser}
    setPage={setPage}
    handleLogout={handleLogout}
    darkMode={darkMode}
    setDarkMode={setDarkMode}
  />
)}

    {page === "shipment-create" && canAccessPage("shipment-create") && (
  <ShipmentCreate
    customers={customers}
    products={products}
    categories={categories}
    exits={exits}
    loadExits={loadExits}
    ordersNotShipped={ordersNotShipped}
    loadOrdersNotShipped={loadOrdersNotShipped}
    loadOrders={loadOrders}
    currentUser={currentUser}
    showToast={showToast}
    setPage={setPage}
    handleLogout={handleLogout}
    darkMode={darkMode}
    setDarkMode={setDarkMode}
  />
)}

        {page === "shipment-approve" && canAccessPage("shipment-approve") && (
  <ShipmentApprove
    currentUser={currentUser}
    showToast={showToast}
    setPage={setPage}
    handleLogout={handleLogout}
    darkMode={darkMode}
    setDarkMode={setDarkMode}
    loadExits={loadExits}
  />
)}

      {page === "shipment-report" && canAccessPage("shipment-report") && (
  <ShipmentReport
    currentUser={currentUser}
    setPage={setPage}
    handleLogout={handleLogout}
    darkMode={darkMode}
    setDarkMode={setDarkMode}
  />
)}

      
       {page === "reports" && canAccessPage("reports") && (
  <ReportsPage
    setPage={setPage}
    currentUser={currentUser}
    handleLogout={handleLogout}
    darkMode={darkMode}
    setDarkMode={setDarkMode}
  />
)}
 {page === "products-stock" && canAccessPage("products-stock") && (
  <ProductsStockPage
    currentUser={currentUser}
    setPage={setPage}
    handleLogout={handleLogout}
    darkMode={darkMode}
    setDarkMode={setDarkMode}
  />
)}

       {page === "tickets" && currentUser?.role === "admin" && (
  <TicketsAdminPage
    currentUser={currentUser}
    showToast={showToast}
    setPage={setPage}
    handleLogout={handleLogout}
    darkMode={darkMode}
    setDarkMode={setDarkMode}
  />
)}

{page === "tickets" && currentUser?.role !== "admin" && (
  <TicketPage
    currentUser={currentUser}
    showToast={showToast}
    setPage={setPage}
    handleLogout={handleLogout}
    darkMode={darkMode}
    setDarkMode={setDarkMode}
  />
)}
      {page === "users" && canAccessPage("users") && (
  <UsersPage
    currentUser={currentUser}
    showToast={showToast}
    setPage={setPage}
    handleLogout={handleLogout}
    darkMode={darkMode}
    setDarkMode={setDarkMode}
  />
)}
      {page === "notifications" && canAccessPage("notifications") && (
  <NotificationsPage
    currentUser={currentUser}
    setPage={setPage}
    handleLogout={handleLogout}
    darkMode={darkMode}
    setDarkMode={setDarkMode}
  />
)}

      {page === "archive" && currentUser?.role === "admin" && (
  <ArchivePage
    currentUser={currentUser}
    showToast={showToast}
    setPage={setPage}
    handleLogout={handleLogout}
    darkMode={darkMode}
    setDarkMode={setDarkMode}
  />
)}

      </main>

      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-box logout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal-icon">🚪</div>
            <h2>خروج از حساب</h2>
            <p>آیا مطمئنی می‌خوای از حساب کاربری خارج بشی؟</p>

            <div className="logout-modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowLogoutConfirm(false)}
              >
                انصراف
              </button>
              <button
                className="confirm-logout-btn"
                onClick={confirmLogout}
              >
                🚪 بله، خارج شو
              </button>
            </div>
          </div>
        </div>
      )}
             {showProfileModal && (
        <ProfileModal
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          onClose={() => setShowProfileModal(false)}
          showToast={showToast}
        />
      )}

      {showDeveloperInfo && (
        <div className="modal-overlay" onClick={() => setShowDeveloperInfo(false)}>
          <div className="modal-box developer-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowDeveloperInfo(false)}
              style={{ position: "absolute", top: "15px", left: "15px" }}
            >
              ✕
            </button>

            <img
              src="/developer-logo.jpg"
              alt="طراحی و توسعه"
              className="developer-modal-logo"
            />

            <h2>💻 طراحی و توسعه</h2>
            <p className="developer-modal-role">برنامه‌نویس و توسعه‌دهنده</p>

                  <div className="developer-modal-info">
              <div className="developer-info-item">
                <span className="developer-info-icon">👤</span>
                <div>
                  <small>نام و نام خانوادگی</small>
                  <strong>سعید روزبهانی</strong>
                </div>
              </div>

              <div className="developer-info-item">
                <span className="developer-info-icon">📞</span>
                <div>
                  <small>شماره تماس</small>
                  <a href="tel:09331258089" className="developer-email-link" style={{ direction: "ltr", textAlign: "right" }}>
                    09331258089
                  </a>
                </div>
              </div>
            </div>
            <button
              className="save-btn"
              onClick={() => setShowDeveloperInfo(false)}
              style={{ width: "100%", marginTop: "20px" }}
            >
              بستن
            </button>
          </div>
        </div>
      )}
      {editItem && editItem.type === "production" && (
        <EditProductionModal
          production={editItem}
          orders={orders}
          products={products}
          categories={categories}
          onClose={() => setEditItem(null)}
          onSave={() => { loadProductions(); loadDashboardStats() }}
          showToast={showToast}
        />
      )}

      {editItem && editItem.type === "customer" && (
        <EditCustomerModal
          customer={editItem}
          onClose={() => setEditItem(null)}
          onSave={loadCustomers}
          showToast={showToast}
        />
      )}

        {editItem && editItem.type === "product" && (
        <EditProductModal
          product={editItem}
          onClose={() => setEditItem(null)}
          onSave={loadProducts}
          showToast={showToast}
          categories={categories}
        />
      )}

      {editItem && !editItem.type && (
        <EditOrderModal
          order={editItem}
          products={products}
          customers={customers}
          categories={categories}
          onClose={() => setEditItem(null)}
          onSave={loadOrders}
          showToast={showToast}
        />
      )}


      <ToastContainer toasts={toasts} removeToast={removeToast} />

    </div>
  )
}
/* =========================
   DASHBOARD
========================= */
/* =========================
   SHARED DASHBOARD (finance + office)
========================= */

function SharedDashboard({ setPage, orders, productions, dashboardStats, currentUser, handleLogout, darkMode, setDarkMode }) {
  const [exits, setExits] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    authFetch("/api/exits")
      .then((res) => res.json())
      .then((data) => {
        setExits(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const safeOrders = Array.isArray(orders) ? orders : []
  const safeProductions = Array.isArray(productions) ? productions : []
  const safeExits = Array.isArray(exits) ? exits : []

  // =========================
  // خروجی‌های امروز
  // =========================
  const todayStr = (() => {
    const today = new Date()
    const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(today)
    const y = parts.find(p => p.type === "year")?.value
    const m = parts.find(p => p.type === "month")?.value
    const d = parts.find(p => p.type === "day")?.value
    return `${y}/${m}/${d}`
  })()

  const todayExits = safeExits.filter((e) => e.exit_date === todayStr && e.status !== "rejected")
  const todayExitsCount = todayExits.length
  const todayExitsQuantity = todayExits.reduce((sum, e) => sum + Number(e.quantity || 0), 0)

  // =========================
  // خروجی‌های در انتظار تأیید مالی
  // =========================
  const pendingExits = safeExits.filter((e) => !e.status || e.status === "pending")
  const pendingCount = pendingExits.length

  // =========================
  // نمودار هفتگی تولید
  // =========================
  const weeklyProduction = (() => {
    const days = []
    const today = new Date()

    const toPersianDate = (date) => {
      try {
        const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }).formatToParts(date)
        const year = parts.find(p => p.type === "year")?.value
        const month = parts.find(p => p.type === "month")?.value
        const day = parts.find(p => p.type === "day")?.value
        return `${year}/${month}/${day}`
      } catch (e) {
        return ""
      }
    }

    const getDayName = (date) => {
      try {
        return new Intl.DateTimeFormat("fa-IR", { weekday: "long" }).format(date)
      } catch (e) {
        return ""
      }
    }

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const persianDate = toPersianDate(date)

      const dayProduction = safeProductions
        .filter((p) =>
          p.production_date === persianDate &&
          (p.production_type === "final" || !p.production_type)
        )
        .reduce((sum, p) => sum + Number(p.quantity || 0), 0)

      days.push({
        day: getDayName(date),
        weight: dayProduction,
        date: persianDate
      })
    }
    return days
  })()
  // =========================
  // نمودار هفتگی خروجی
  // =========================
  const weeklyExits = (() => {
    const days = []
    const today = new Date()

    const toPersianDate = (date) => {
      try {
        const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }).formatToParts(date)
        const year = parts.find(p => p.type === "year")?.value
        const month = parts.find(p => p.type === "month")?.value
        const day = parts.find(p => p.type === "day")?.value
        return `${year}/${month}/${day}`
      } catch (e) {
        return ""
      }
    }

    const getDayName = (date) => {
      try {
        return new Intl.DateTimeFormat("fa-IR", { weekday: "long" }).format(date)
      } catch (e) {
        return ""
      }
    }

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const persianDate = toPersianDate(date)

      const dayExits = safeExits
        .filter((e) => e.exit_date === persianDate && e.status !== "rejected")
        .reduce((sum, e) => sum + Number(e.quantity || 0), 0)

      days.push({
        day: getDayName(date),
        weight: dayExits,
        date: persianDate
      })
    }
    return days
  })()

  // =========================
  // سفارشات در انتظار (هنوز خروجی کامل نشدن)
  // =========================
  const pendingOrders = (() => {
    const result = []

    safeOrders.forEach((order) => {
      const shippedQty = safeExits
        .filter((e) => e.order_id === order.id && e.status !== "rejected")
        .reduce((sum, e) => sum + Number(e.quantity || 0), 0)

      const remaining = Number(order.quantity || 0) - shippedQty

      if (remaining > 0) {
        result.push({
          ...order,
          shipped: shippedQty,
          remaining
        })
      }
    })

    return result.slice(0, 5)
  })()

  const totalPendingOrders = (() => {
    let count = 0
    safeOrders.forEach((order) => {
      const shippedQty = safeExits
        .filter((e) => e.order_id === order.id && e.status !== "rejected")
        .reduce((sum, e) => sum + Number(e.quantity || 0), 0)
      if (Number(order.quantity || 0) - shippedQty > 0) count++
    })
    return count
  })()

  // =========================
  // کل مشتریان
  // =========================
  const [customersCount, setCustomersCount] = useState(0)

  useEffect(() => {
    authFetch("/api/customers")
      .then((res) => res.json())
      .then((data) => setCustomersCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setCustomersCount(0))
  }, [])

  return (
    <>
      <Topbar
        title={`داشبورد ${currentUser?.role === "finance" ? "امور مالی" : "فروش"}`}
        subtitle="سیستم سفارش و تولید آجر نسوز محراب"
        currentUser={currentUser}
        setPage={setPage}
        handleLogout={handleLogout}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <section className="stats">
        <div className="stat-card">
          <div className="stat-icon"><ClipboardList size={24} /></div>
          <div>
            <span>خروجی‌های امروز</span>
            <strong><AnimatedNumber value={todayExitsCount} /></strong>
            <small>{todayExitsQuantity.toLocaleString()} عدد</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Factory size={24} /></div>
          <div>
            <span>تولید نهایی انجام شده</span>
            <strong>
              <AnimatedNumber value={safeProductions.filter((p) => p.production_type === "final" || !p.production_type).reduce((sum, p) => sum + Number(p.quantity || 0), 0)} />
              <small>عدد</small>
            </strong>
            <small>تولید نهایی تجمعی</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><BarChart3 size={24} /></div>
          <div>
            <span>سفارشات در انتظار</span>
            <strong><AnimatedNumber value={totalPendingOrders} /></strong>
            <small>سفارش</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><Users size={24} /></div>
          <div>
            <span>کل مشتریان</span>
            <strong><AnimatedNumber value={customersCount} /></strong>
            <small>مشتری ثبت‌شده</small>
          </div>
        </div>
      </section>

      {/* کارت تأیید مالی — فقط برای امور مالی */}
      {currentUser?.role === "finance" && pendingCount > 0 && (
        <div
          className="pending-exits-card"
          onClick={() => setPage("shipment-approve")}
        >
          <div className="pending-exits-bg-shape"></div>

          <div className="pending-exits-content">
            <div className="pending-exits-icon-wrapper">
              <div className="pending-exits-icon-pulse"></div>
              <div className="pending-exits-icon">⏳</div>
            </div>

            <div className="pending-exits-text">
              <div className="pending-exits-badge">
                <span className="pending-exits-dot"></span>
                در انتظار اقدام
              </div>
              <h2 className="pending-exits-title">
                <strong>{pendingCount}</strong> خروجی در انتظار تأیید مالی
              </h2>
              <p className="pending-exits-subtitle">
                برای تأیید و ثبت نوع تسویه حساب، کلیک کنید
              </p>
            </div>

            <div className="pending-exits-cta">
              <span>تأیید خروجی‌ها</span>
              <span className="pending-exits-arrow">←</span>
            </div>
          </div>
        </div>
      )}

      {/* نمودار هفتگی — تولید و خروجی کنار هم */}
      <section className="dashboard-grid">
        {/* نمودار هفتگی تولید */}
        <div className="panel">
          <div className="panel-header">
            <h2>📈 روند هفتگی تولید</h2>
            <span>۷ روز اخیر</span>
          </div>

          {safeProductions.length === 0 ? (
            <div className="empty-state">
              <div>📊</div>
              <h3>هنوز تولیدی ثبت نشده</h3>
            </div>
          ) : (
            <div style={{ marginTop: "15px", width: "100%", height: "320px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyProduction} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorProductionShared" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.7} />
                      <stop offset="50%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="strokeProductionShared" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="50%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(226, 232, 240, 0.5)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8", fontFamily: "inherit", fontWeight: 600 }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} dy={8} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8", fontFamily: "inherit", fontWeight: 600 }} axisLine={false} tickLine={false} dx={-5} />
                  <Tooltip
                    cursor={{ stroke: "#8b5cf6", strokeWidth: 1.5, strokeDasharray: "4 4" }}
                    contentStyle={{
                      background: darkMode ? "rgba(30, 41, 59, 0.98)" : "rgba(255, 255, 255, 0.98)",
                      border: darkMode ? "1px solid rgba(71, 85, 105, 0.6)" : "none",
                      borderRadius: "14px",
                      padding: "12px 16px",
                      fontFamily: "inherit",
                      fontSize: "13px",
                      boxShadow: darkMode
                        ? "0 12px 30px rgba(0, 0, 0, 0.5)"
                        : "0 12px 30px rgba(99, 102, 241, 0.25)"
                    }}
                    labelStyle={{
                      color: darkMode ? "#a5b4fc" : "#6366f1",
                      fontWeight: 800,
                      fontSize: "13px",
                      marginBottom: "6px",
                      display: "block"
                    }}
                    itemStyle={{
                      color: darkMode ? "#f1f5f9" : "#1e293b",
                      fontWeight: 700,
                      fontSize: "14px"
                    }}
                    formatter={(value) => [`${value.toLocaleString()} عدد`, "🔥 تولید"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="url(#strokeProductionShared)"
                    strokeWidth={3}
                    fill="url(#colorProductionShared)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* نمودار هفتگی خروجی */}
        <div className="panel">
          <div className="panel-header">
            <h2>📤 روند هفتگی خروجی</h2>
            <span>۷ روز اخیر</span>
          </div>

          {safeExits.length === 0 ? (
            <div className="empty-state">
              <div>📤</div>
              <h3>هنوز خروجی ثبت نشده</h3>
            </div>
          ) : (
            <div style={{ marginTop: "15px", width: "100%", height: "320px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyExits} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorExitsShared" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.7} />
                      <stop offset="50%" stopColor="#059669" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="strokeExitsShared" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="50%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(226, 232, 240, 0.5)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8", fontFamily: "inherit", fontWeight: 600 }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} dy={8} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8", fontFamily: "inherit", fontWeight: 600 }} axisLine={false} tickLine={false} dx={-5} />
                  <Tooltip
                    cursor={{ stroke: "#10b981", strokeWidth: 1.5, strokeDasharray: "4 4" }}
                    contentStyle={{
                      background: darkMode ? "rgba(30, 41, 59, 0.98)" : "rgba(255, 255, 255, 0.98)",
                      border: darkMode ? "1px solid rgba(71, 85, 105, 0.6)" : "none",
                      borderRadius: "14px",
                      padding: "12px 16px",
                      fontFamily: "inherit",
                      fontSize: "13px",
                      boxShadow: darkMode
                        ? "0 12px 30px rgba(0, 0, 0, 0.5)"
                        : "0 12px 30px rgba(16, 185, 129, 0.25)"
                    }}
                    labelStyle={{
                      color: darkMode ? "#a7f3d0" : "#059669",
                      fontWeight: 800,
                      fontSize: "13px",
                      marginBottom: "6px",
                      display: "block"
                    }}
                    itemStyle={{
                      color: darkMode ? "#f1f5f9" : "#1e293b",
                      fontWeight: 700,
                      fontSize: "14px"
                    }}
                    formatter={(value) => [`${value.toLocaleString()} عدد`, "📤 خروجی"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="url(#strokeExitsShared)"
                    strokeWidth={3}
                    fill="url(#colorExitsShared)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* سفارشات در انتظار */}
      <div className="panel">
        <div className="panel-header">
          <h2>⏳ سفارشات در انتظار خروجی</h2>
          <span>{totalPendingOrders} سفارش</span>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="empty-state">
            <div>✅</div>
            <h3>همه سفارشات خروجی کامل شدن</h3>
          </div>
        ) : (
          <div className="top-products-list">
            {pendingOrders.map((order) => (
              <div key={order.id} className="top-product-item-new" style={{ cursor: "default" }}>
                <div className="top-product-body">
                  <div className="top-product-head">
                    <div className="top-product-title">
                      <strong>{order.customer_name}</strong>
                      <div className="top-product-tags">
                        <span className="top-product-tag">📅 {toPersianDate(order.order_date)}</span>
                        <span className="top-product-tag">{order.brick_type || "-"}</span>
                      </div>
                    </div>
                    <div className="top-product-value">
                      <strong style={{ color: "#f59e0b" }}>
                        {Number(order.remaining || 0).toLocaleString()}
                      </strong>
                      <small>باقی‌مانده</small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* دسترسی سریع */}
      <section className="quick-section">
        <h2>⚡ دسترسی سریع</h2>
        <div className="quick-buttons">
          <button
            onClick={() => setPage("orders")}
            style={{ background: "linear-gradient(135deg, rgba(96, 165, 250, 0.95) 0%, rgba(59, 130, 246, 0.95) 100%)" }}
          >
            <span style={{ fontSize: "22px" }}>📝</span>
            <span style={{ fontSize: "15px", fontWeight: "700" }}>ثبت سفارش</span>
          </button>

          <button
            onClick={() => setPage("production")}
            style={{ background: "linear-gradient(135deg, rgba(96, 165, 250, 0.95) 0%, rgba(59, 130, 246, 0.95) 100%)" }}
          >
            <span style={{ fontSize: "22px" }}>🏭</span>
            <span style={{ fontSize: "15px", fontWeight: "700" }}>ثبت تولید</span>
          </button>

          <button
            onClick={() => setPage("shipment-create")}
            style={{ background: "linear-gradient(135deg, rgba(96, 165, 250, 0.95) 0%, rgba(59, 130, 246, 0.95) 100%)" }}
          >
            <span style={{ fontSize: "22px" }}>📤</span>
            <span style={{ fontSize: "15px", fontWeight: "700" }}>ثبت خروجی</span>
          </button>

          {currentUser?.role === "finance" && (
            <button
              onClick={() => setPage("shipment-approve")}
              style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)" }}
            >
              <span style={{ fontSize: "22px" }}>✅</span>
              <span style={{ fontSize: "15px", fontWeight: "700" }}>تأیید خروجی</span>
            </button>
          )}
        </div>
      </section>
    </>
  )
}

function SidebarSmsCredit({ currentUser }) {
  const [smsCredit, setSmsCredit] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "office")) return

    setLoading(true)
    authFetch("/api/sms-credit")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSmsCredit(data.credit)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [currentUser])

  return (
    <div className="sidebar-sms-credit" title="اعتبار پیامکی">
      <span className="sidebar-sms-credit-icon">📱</span>
      <span className="sidebar-sms-credit-label">اعتبار پیامکی</span>
      <strong className="sidebar-sms-credit-value">
        {loading
          ? "..."
          : smsCredit !== null
          ? Number(smsCredit).toLocaleString()
          : "---"}
      </strong>
    </div>
  )
}

function ThemeSwitcher({ themeMode, setThemeMode, darkMode, setDarkMode, variant = "topbar" }) {
  const themes = [
    { key: "light", icon: "☀️", label: "روشن" },
    { key: "dark", icon: "🌙", label: "تاریک" },
    { key: "system", icon: "🖥️", label: "سیستم" }
  ]

  const handleChange = (key) => {
    setThemeMode(key)

    // آپدیت فوری
    if (key === "dark") {
      setDarkMode(true)
      document.body.classList.add("dark-mode")
    } else if (key === "light") {
      setDarkMode(false)
      document.body.classList.remove("dark-mode")
    } else {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setDarkMode(isDark)
      if (isDark) {
        document.body.classList.add("dark-mode")
      } else {
        document.body.classList.remove("dark-mode")
      }
    }
  }

  return (
    <div className={`theme-switcher theme-switcher-${variant}`}>
      {themes.map((t) => (
        <button
          key={t.key}
          className={`theme-switcher-btn ${themeMode === t.key ? "active" : ""}`}
          onClick={() => handleChange(t.key)}
          title={t.label}
        >
          <span className="theme-switcher-icon">{t.icon}</span>
        </button>
      ))}
    </div>
  )
}

function MobileUserHeader({ currentUser, setPage, handleLogout, setShowMobileMenu }) {
  const fullName = currentUser?.full_name || currentUser?.username || "کاربر"
  const roleName = getRoleName(currentUser?.role)

  // انتخاب رنگ آواتار بر اساس اسم کاربر
  const avatarColors = [
    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", // نارنجی
    "linear-gradient(135deg, #10b981 0%, #059669 100%)", // سبز
    "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", // آبی
    "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)", // بنفش
    "linear-gradient(135deg, #ec4899 0%, #be185d 100%)", // صورتی
    "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)", // فیروزه‌ای
    "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)"  // قرمز
  ]

  // هش ساده از اسم برای انتخاب رنگ ثابت
  const hash = fullName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const colorIndex = hash % avatarColors.length
  const avatarGradient = avatarColors[colorIndex]

  return (
    <div className="mobile-user-header">
      <div
        className="mobile-user-avatar"
        style={{ background: avatarGradient }}
      >
        <User size={24} strokeWidth={2.4} />
      </div>
      <div className="mobile-user-info">
        <strong>{fullName}</strong>
        <small>{roleName}</small>
      </div>
    </div>
  )
}

function Topbar({ title, subtitle, currentUser, setPage, handleLogout, darkMode, setDarkMode }) {
  if (!title && !subtitle) return null

  return (
    <header className="topbar">
      <div>
        {title && (
          <h1
            style={{
              background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}
          >
            {title}
          </h1>
        )}
        {subtitle && <p>{subtitle}</p>}
      </div>
    </header>
  )
}

function Dashboard({ setPage, orders, productions, dashboardStats, showToast, currentUser, handleLogout, darkMode, setDarkMode }) {
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleOpenMenu = () => {
    setShowUserMenu(!showUserMenu)
  }

  // محاسبات آماری (با محافظت از undefined)
  const safeOrders = Array.isArray(orders) ? orders : []
  const safeProductions = Array.isArray(productions) ? productions : []

 const totalOrderedWeight = safeOrders.reduce(
  (sum, o) => sum + Number(o.quantity || 0), 0
)
const totalProducedWeight = safeProductions.reduce(
  (sum, p) => sum + Number(p.quantity || 0), 0
)
  const remainingWeight = totalOrderedWeight - totalProducedWeight
  const productsStock = dashboardStats?.productsStock || []
const topProducts = (() => {
    const productTotals = {}

        safeOrders.forEach((order) => {
      const name = order.brick_type || "نامشخص"
      const qty = Number(order.quantity || 0)

      if (!productTotals[name]) {
        productTotals[name] = { name, total: 0, count: 0 }
      }
      productTotals[name].total += qty
      productTotals[name].count += 1
    })

    const productsArray = Object.values(productTotals)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    const maxTotal = productsArray[0]?.total || 1

    return productsArray.map((p) => ({
      ...p,
      percent: (p.total / maxTotal) * 100
    }))
  })()
    // محاسبه تولید ۷ روز اخیر (بر اساس تاریخ شمسی)
  const weeklyProduction = (() => {
    const days = []
    const today = new Date()

    const toPersianDate = (date) => {
      try {
        const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }).formatToParts(date)

        const year = parts.find(p => p.type === "year")?.value
        const month = parts.find(p => p.type === "month")?.value
        const day = parts.find(p => p.type === "day")?.value

        return `${year}/${month}/${day}`
      } catch (e) {
        return ""
      }
    }
    const getDayName = (date) => {
      try {
        return new Intl.DateTimeFormat("fa-IR", { weekday: "long" }).format(date)
      } catch (e) {
        return ""
      }
    }
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const persianDate = toPersianDate(date)

         const dayProduction = safeProductions
  .filter((p) =>
    p.production_date === persianDate &&
    (p.production_type === "final" || !p.production_type)
  )
  .reduce((sum, p) => sum + Number(p.quantity || 0), 0)
      days.push({
        day: getDayName(date),
        weight: dayProduction,
        date: persianDate
      })
    }
    return days
  })()
  // محاسبه تولید ۷ روز اخیر (بر اساس تاریخ شمسی)

  return (
    <>
      <Topbar
        currentUser={currentUser}
        setPage={setPage}
        handleLogout={handleLogout}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <section className="stats">

        <div className="stat-card">
          <div className="stat-icon"><ClipboardList size={24} /></div>
          <div>
            <span>کل سفارشات</span>
            <strong>
  <AnimatedNumber value={orders.length} />
</strong>
            <small>سفارش ثبت شده</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><Factory size={24} /></div>
          <div>
            <span>تولید نهایی انجام شده</span>
            <strong>
            <AnimatedNumber value={productions.filter((p) => p.production_type === "final" || !p.production_type).reduce((sum, item) => sum + Number(item.quantity || 0), 0)} />
              <small>عدد</small>
            </strong>
            <small>تولید نهایی تجمعی</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><BarChart3 size={24} /></div>
          <div>
            <span>باقی‌مانده سفارش</span>
            <strong>
              <AnimatedNumber
  value={Math.max(0,
    orders.reduce((sum, order) => sum + Number(order.quantity || 0), 0) -
    productions.filter((p) => p.production_type === "final" || !p.production_type).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  )}
/>
              <small>عدد</small>
            </strong>
            <small>در انتظار تولید</small>
          </div>
        </div>
<div className="stat-card">
  <div className="stat-icon"><BarChart3 size={24} /></div>
  <div>
    <span>تولید امروز</span>
    <strong>
      <AnimatedNumber
        value={(() => {
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

          return productions
            .filter((p) => p.production_date === todayStr)
            .reduce((sum, item) => sum + Number(item.quantity || 0), 0)
        })()}
      />
      <small>عدد</small>
    </strong>
    <small>تولید امروز کارخانه</small>
  </div>
</div>
       

      </section>

<section className="dashboard-grid">

  {/* روند هفتگی تولید */}
  <div className="panel">

    <div className="panel-header">
      <h2>📈 روند هفتگی تولید</h2>
      <span>۷ روز اخیر</span>
    </div>

        {safeProductions.length === 0 ? (
      <div className="empty-state">
        <div>📊</div>
        <h3>هنوز تولیدی ثبت نشده</h3>
        <p>برای مشاهده نمودار، ابتدا تولید ثبت کنید.</p>
      </div>
    ) : (
      <div style={{ marginTop: "15px", width: "100%", height: "320px" }}>
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={weeklyProduction} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
      <defs>
        {/* گرادیانت اصلی زیر نمودار */}
        <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.7} />
          <stop offset="50%" stopColor="#6366f1" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
        </linearGradient>

        {/* گرادیانت خط */}
        <linearGradient id="strokeProduction" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>

        {/* سایه زیر خط */}
        <filter id="shadowProduction" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#6366f1" floodOpacity="0.35" />
        </filter>
      </defs>

      <CartesianGrid
        strokeDasharray="4 4"
        stroke="rgba(226, 232, 240, 0.5)"
        vertical={false}
      />

      <XAxis
        dataKey="day"
        tick={{ fontSize: 12, fill: "#94a3b8", fontFamily: "inherit", fontWeight: 600 }}
        axisLine={{ stroke: "#e2e8f0" }}
        tickLine={false}
        dy={8}
      />

      <YAxis
        tick={{ fontSize: 12, fill: "#94a3b8", fontFamily: "inherit", fontWeight: 600 }}
        axisLine={false}
        tickLine={false}
        dx={-5}
      />

      <Tooltip
        cursor={{ stroke: "#8b5cf6", strokeWidth: 1.5, strokeDasharray: "4 4" }}
        contentStyle={{
          background: "rgba(255, 255, 255, 0.98)",
          border: "none",
          borderRadius: "14px",
          padding: "12px 16px",
          fontFamily: "inherit",
          fontSize: "13px",
          boxShadow: "0 12px 30px rgba(99, 102, 241, 0.25)",
          backdropFilter: "blur(10px)"
        }}
        labelStyle={{
          color: "#8b5cf6",
          fontWeight: 800,
          fontSize: "13px",
          marginBottom: "6px",
          display: "block"
        }}
        itemStyle={{
          color: "#1e293b",
          fontWeight: 700,
          fontSize: "14px"
        }}
        formatter={(value) => [`${value.toLocaleString()} عدد`, "🔥 تولید"]}
        labelFormatter={(label) => `📅 ${label}`}
      />

      <Area
        type="monotone"
        dataKey="weight"
        stroke="url(#strokeProduction)"
        strokeWidth={3.5}
        fill="url(#colorProduction)"
        filter="url(#shadowProduction)"
        dot={{
          fill: "#ffffff",
          stroke: "#6366f1",
          strokeWidth: 3,
          r: 5
        }}
        activeDot={{
          r: 9,
          fill: "#8b5cf6",
          stroke: "#ffffff",
          strokeWidth: 4,
          filter: "url(#shadowProduction)"
        }}
        animationDuration={1500}
        animationEasing="ease-out"
      />
    </AreaChart>
  </ResponsiveContainer>
</div>
    )}

  </div>


  {/* تاپ ۵ محصول پرفروش */}
<div className="panel" style={{ maxHeight: "460px", overflow: "hidden", display: "flex", flexDirection: "column" }}>

  <div className="panel-header">
    <h2>🏆 ۵ محصول پرفروش</h2>
    <span>بر اساس سفارش</span>
  </div>

    {topProducts.length === 0 ? (
      <div className="empty-state">
        <div>🏆</div>
        <h3>هنوز سفارشی ثبت نشده</h3>
        <p>برای مشاهده، ابتدا سفارش ثبت کنید.</p>
      </div>
    ) : (
      <div className="top-products-list" style={{ overflowY: "auto", flex: 1 }}>
  {topProducts.map((product, index) => {
    const medals = ["🥇", "🥈", "🥉", "🏅", "🎖️"]
    const colors = [
      { from: "#fbbf24", to: "#f59e0b", shadow: "rgba(251, 191, 36, 0.4)" },
      { from: "#cbd5e1", to: "#64748b", shadow: "rgba(148, 163, 184, 0.4)" },
      { from: "#fb923c", to: "#c2410c", shadow: "rgba(251, 146, 60, 0.4)" },
      { from: "#818cf8", to: "#6366f1", shadow: "rgba(129, 140, 248, 0.4)" },
      { from: "#34d399", to: "#059669", shadow: "rgba(52, 211, 153, 0.4)" }
    ]
    const c = colors[index]
    const gradient = `linear-gradient(135deg, ${c.from} 0%, ${c.to} 100%)`

    return (
      <div
        className="top-product-item-new"
        key={product.name}
        style={{ "--accent-gradient": gradient, "--accent-shadow": c.shadow }}
      >
        {/* نشان رتبه */}
        <div className="top-product-medal" style={{ background: gradient }}>
          {medals[index]}
        </div>

        {/* محتوای اصلی */}
<div className="top-product-body">
  <div className="top-product-head">
    <div className="top-product-title">
      <strong>{product.name}</strong>
      <div className="top-product-tags">
        <span className="top-product-tag">
          {product.count} سفارش
        </span>
      </div>
    </div>
     <div className="top-product-value">
      <strong>{product.total.toLocaleString()}</strong>
      <small>عدد</small>
    </div>
  </div>
</div>
      </div>
    )
  })}
</div>
    )}

  </div>

</section>




       <section className="quick-section">

        <h2>⚡ دسترسی سریع</h2>

        <div className="quick-buttons">

                       <button
            onClick={() => setPage("orders")}
            style={{ background: "linear-gradient(135deg, rgba(96, 165, 250, 0.95) 0%, rgba(59, 130, 246, 0.95) 100%)" }}
          >
                        <span style={{ fontSize: "22px" }}>📝</span>
<span style={{ fontSize: "15px", fontWeight: "700" }}>ثبت سفارش جدید</span>
          </button>
                 <button
  onClick={() => setPage("production")}
  style={{ background: "linear-gradient(135deg, rgba(96, 165, 250, 0.95) 0%, rgba(59, 130, 246, 0.95) 100%)" }}
>
  <span style={{ fontSize: "22px" }}>🏭</span>
  <span style={{ fontSize: "15px", fontWeight: "700" }}>ثبت تولید</span>
</button>

                  <button
            onClick={() => setPage("customers")}
            style={{ background: "linear-gradient(135deg, rgba(96, 165, 250, 0.95) 0%, rgba(59, 130, 246, 0.95) 100%)" }}
          >
                       <span style={{ fontSize: "22px" }}>👥</span>
<span style={{ fontSize: "15px", fontWeight: "700" }}>ثبت مشتری جدید</span>
          </button>

                <button
            onClick={() => setPage("reports")}
            style={{ background: "linear-gradient(135deg, rgba(96, 165, 250, 0.95) 0%, rgba(59, 130, 246, 0.95) 100%)" }}
          >
                        <span style={{ fontSize: "22px" }}>📊</span>
<span style={{ fontSize: "15px", fontWeight: "700" }}>گزارشات</span>
          </button>
        </div>

      </section>
    </>
  )
}

/* =========================
   ORDER FORM
========================= */

function OrderForm({ setPage, loadOrders, products, customers, categories, showToast, currentUser, handleLogout, darkMode, setDarkMode, orders = [], exits = [], loadOrdersNotShipped }) {
const emptyItem = {
    category: "",
    brick_type: "",
    quantity: "",
    notes: ""
  }

  const [form, setForm] = useState({
    order_date: "",
    customer_name: "",
    kiln: "",
    priority: "عادی",
    notes: ""
  })

  const itemsEndRef = useRef(null)

  const [items, setItems] = useState([{ ...emptyItem }])
  const [submitting, setSubmitting] = useState(false)
  const [showAddMoreConfirm, setShowAddMoreConfirm] = useState(false)
    const [transferredDebts, setTransferredDebts] = useState([])
  // محاسبه بدهی و باقی‌مانده مشتری (فقط سفارش‌هایی که بخشی از آن‌ها ارسال شده)
  const customerDebts = (() => {
    if (!form.customer_name) return []
    
    const custOrders = orders.filter(o => o.customer_name === form.customer_name)
    
    const debts = []
    custOrders.forEach(order => {
      // 👈 اگه سفارش قبلاً منتقل یا بسته شده، نادیده بگیر
      if (order.is_transferred === 1) return

      const orderItems = Array.isArray(order.items) && order.items.length > 0
        ? order.items
        : [{ brick_type: order.brick_type, quantity: order.quantity, category: order.category }]

      // برای هر قلم سفارش، مقدار ارسال‌شده و باقی‌مانده رو جدا حساب کن
      orderItems.forEach(item => {
        const shipped = exits
          .filter(e => 
            e.order_id === order.id && 
            e.product_name === item.brick_type &&
            e.status !== "rejected" && 
            e.is_extra !== 1
          )
          .reduce((sum, e) => sum + Number(e.quantity || 0), 0)
        
        const remaining = Number(item.quantity || 0) - shipped
        
        // اگه این قلم باقی‌مانده داره، به عنوان طلب نشون بده (چه بخشی ارسال شده باشه چه نشده)
        if (remaining > 0 && !transferredDebts.includes(`${order.id}_${item.brick_type}`)) {
          debts.push({
            order_id: order.id,
            order_number: order.order_number,
            remaining: remaining,
            date: order.order_date,
            category: item.category || "",
            brick_type: item.brick_type || ""
          })
        }
      })
    })
    return debts
  })()
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }

    // اگه دسته عوض شد، آجر پاک بشه
    if (field === "category") {
      newItems[index].brick_type = ""
    }

    setItems(newItems)
  }

  const handleAddItem = () => {
    setItems([...items, { ...emptyItem }])
    
    // اسکرول به پایین‌ترین قلم بعد از اضافه شدن (با تاخیر بیشتر و تنظیمات بهتر برای موبایل)
    setTimeout(() => {
      if (itemsEndRef.current) {
        itemsEndRef.current.scrollIntoView({ 
          behavior: "smooth", 
          block: "end",
          inline: "nearest"
        })
      }
    }, 300)
  }
  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      showToast("حداقل یک قلم محصول لازمه", "warning")
      return
    }
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
  }

  const resetForm = () => {
    setForm({
      order_date: "",
      customer_name: "",
      kiln: "",
      priority: "عادی",
      notes: ""
    })
    setItems([{ ...emptyItem }])
  }

  const validateForm = () => {
    if (!form.order_date || !form.order_date.trim()) {
      showToast("⚠️ لطفاً تاریخ سفارش را انتخاب کنید", "warning")
      return false
    }

    if (!form.customer_name || !form.customer_name.trim()) {
      showToast("⚠️ لطفاً مشتری را انتخاب کنید", "warning")
      return false
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.category || !item.brick_type) {
        showToast(`⚠️ قلم ${i + 1}: دسته‌بندی و نوع آجر را انتخاب کنید`, "warning")
        return false
      }
      if (!item.quantity || Number(item.quantity) <= 0) {
        showToast(`⚠️ قلم ${i + 1}: تعداد را وارد کنید`, "warning")
        return false
      }
    }

    return true
  }
  const buildPayload = () => {
    return {
      order_date: form.order_date,
      customer_name: form.customer_name,
      kiln: form.kiln,
      priority: form.priority,
      notes: form.notes,
      items: items.map((item) => ({
        category: item.category,
        brick_type: item.brick_type,
        quantity: Number(item.quantity || 0),
        notes: item.notes
      }))
    }
  }

  const submitOrder = async () => {
    setSubmitting(true)
    try {
      const response = await authFetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload())
      })

      const rawText = await response.text()

      let data
      try {
        data = JSON.parse(rawText)
      } catch (e) {
        showToast(`سرور پاسخ نامعتبر داد (HTTP ${response.status})`, "error")
        return
      }
      if (data.success) {
        showToast(`سفارش شماره ${data.order_number} با موفقیت ثبت شد`, "success")
        loadOrders()
        if (loadOrdersNotShipped) loadOrdersNotShipped()
        resetForm()
        setShowAddMoreConfirm(false)
      } else {
        showToast(data.message || "خطا در ثبت سفارش", "error")
      }
    } catch (error) {
      console.error("ORDER SUBMIT ERROR:", error)
      showToast(`ارتباط با دیتابیس برقرار نشد: ${error.message}`, "error")
    } finally {
      setSubmitting(false)
    }
  }
  const handleSubmit = (e) => {
    e.preventDefault()
    if (submitting) return
    if (!validateForm()) return
    setShowAddMoreConfirm(true)
  }

  const handleAddMoreYes = () => {
    setItems([...items, { ...emptyItem }])
    setShowAddMoreConfirm(false)
    showToast("محصول جدید اضافه شد، اطلاعاتش رو کامل کن", "info")
  }
  const handleAddMoreNo = () => {
    submitOrder()
  }
  return (
    <>
      <header className="topbar">
        <div>
          <h1>ثبت سفارش جدید</h1>
          <p>ثبت اطلاعات سفارش مشتری با چند محصول</p>
        </div>
      </header>

      <div className="panel order-form">
        <div className="panel-header">
          <h2>اطلاعات سفارش</h2>
        </div>

        {/* 👇 هشدار بدهی مشتری 👇 */}
        {customerDebts.length > 0 && (
          <div style={{ 
            marginBottom: "20px", 
            padding: "16px", 
            background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", 
            borderRadius: "12px", 
            border: "1.5px solid #f59e0b",
            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.15)"
          }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#b45309", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              ⚠️ توجه: این مشتری دارای طلب / سفارش تکمیل‌نشده است!
            </h4>
            <ul style={{ margin: 0, paddingRight: "20px", color: "#92400e", fontSize: "13px", lineHeight: "1.8" }}>
              {customerDebts.map((debt, idx) => (
                <li key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "8px", paddingBottom: "8px", borderBottom: "1px dashed rgba(245, 158, 11, 0.3)" }}>
                  <span>
                    باقی‌مانده: <strong>{Number(debt.remaining).toLocaleString()} عدد</strong> 
                    (از سفارش شماره <strong>{debt.order_number || "-"}</strong> - تاریخ {toPersianDate(debt.date)})
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      setItems([...items, {
                        category: debt.category || "",
                        brick_type: debt.brick_type || "",
                        quantity: String(debt.remaining),
                        notes: `انتقال باقی‌مانده از سفارش شماره ${debt.order_number}`
                      }])
                      setTransferredDebts([...transferredDebts, `${debt.order_id}_${debt.brick_type}`])
                      
                      // علامت‌گذاری سفارش قدیمی به عنوان تسویه‌شده در بک‌اند
                      try {
                        await authFetch(`/api/orders/${debt.order_id}/transfer`, {
                          method: "PUT"
                        })
                      } catch (err) {
                        console.error(err)
                      }
                      
                      if (loadOrdersNotShipped) loadOrdersNotShipped()
                      loadOrders()
                      
                      showToast("باقی‌مانده به عنوان قلم جدید به سفارش اضافه شد", "success")
                    }}
                    style={{
                      padding: "6px 12px",
                      fontSize: "12px",
                      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                      boxShadow: "0 2px 6px rgba(245, 158, 11, 0.3)"
                    }}
                  >
                    ➕ انتقال به سفارش جدید
                  </button>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: "8px", fontSize: "12px", color: "#b45309", fontWeight: "600" }}>
              لطفاً قبل از ثبت سفارش جدید، وضعیت این طلب را تعیین‌تکلیف کنید.
            </div>
          </div>
        )}
        {/* 👆 پایان هشدار 👆 */}

        <form onSubmit={handleSubmit} noValidate>
          {/* اطلاعات کلی سفارش */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", marginBottom: "25px" }}>
            <div className="form-group" style={{ flex: "1 1 200px" }}>
              <label>📅 تاریخ سفارش <span style={{ color: "#ef4444" }}>*</span></label>
              <PersianDateInput
                value={form.order_date}
                onChange={(date) => setForm({ ...form, order_date: date })}
                placeholder="انتخاب تاریخ سفارش"
                required
              />
            </div>

            <div className="form-group" style={{ flex: "2 1 300px" }}>
              <label>👤 نام مشتری <span style={{ color: "#ef4444" }}>*</span></label>
              <CustomerSearchSelect
                customers={customers}
                value={form.customer_name}
                onChange={(name) => setForm({ ...form, customer_name: name })}
              />
            </div>

            <div className="form-group" style={{ flex: "0 1 150px" }}>
              <label>⚡ اولویت</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="filter-select-pretty"
              >
                <option value="عادی">عادی</option>
                <option value="فوری">فوری</option>
              </select>
            </div>

            <div className="form-group full-width" style={{ marginTop: "5px" }}>
              <label>📝 توضیحات سفارش (اختیاری)</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="توضیحات کلی مربوط به سفارش..."
                style={{ minHeight: "60px" }}
              ></textarea>
            </div>
          </div>

          {/* اقلام سفارش */}
          <div style={{ marginTop: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" }}>
              <h2 style={{ margin: 0, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                📦 اقلام سفارش
                <span style={{ fontSize: "12px", color: "#6366f1", background: darkMode ? "rgba(99, 102, 241, 0.2)" : "#e0e7ff", padding: "4px 10px", borderRadius: "20px" }}>
                  {items.length} قلم
                </span>
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {items.map((item, index) => {
                const filteredProducts = item.category
                  ? products.filter((p) => p.category === item.category)
                  : []

                return (
                  <div
                    key={index}
                    style={{
                      position: "relative",
                      padding: "16px 20px",
                      paddingTop: "36px",
                      borderRadius: "14px",
                      background: darkMode ? "rgba(30, 41, 59, 0.4)" : "#ffffff",
                      border: darkMode ? "1px solid rgba(71, 85, 105, 0.5)" : "1px solid #e2e8f0",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "20px",
                        fontSize: "13px",
                        fontWeight: "800",
                        color: "#6366f1",
                        background: darkMode ? "rgba(99, 102, 241, 0.15)" : "#e0e7ff",
                        padding: "2px 10px",
                        borderRadius: "8px"
                      }}
                    >
                      قلم {index + 1}
                    </div>

                    <div
                      className="form-grid"
                      style={{ marginTop: 0, gap: "16px" }}
                    >
                      <div className="form-group">
                        <label>📁 دسته‌بندی <span style={{ color: "#ef4444" }}>*</span></label>
                        <select
                          value={item.category}
                          onChange={(e) => handleItemChange(index, "category", e.target.value)}
                          className="filter-select-pretty"
                        >
                          <option value="">انتخاب کنید</option>
                          {categories && categories.map((cat) => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>🧱 نوع آجر <span style={{ color: "#ef4444" }}>*</span></label>
                        <select
                          value={item.brick_type}
                          onChange={(e) => handleItemChange(index, "brick_type", e.target.value)}
                          disabled={!item.category}
                          className="filter-select-pretty"
                        >
                          <option value="">
                            {item.category ? "انتخاب نوع آجر" : "ابتدا دسته‌بندی را انتخاب کنید"}
                          </option>
                          {filteredProducts.map((product) => (
                            <option key={product.id} value={product.name}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>🔢 تعداد <span style={{ color: "#ef4444" }}>*</span></label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                          placeholder="مثلاً 10000"
                          min="1"
                          style={{ 
                            colorScheme: darkMode ? "dark" : "light",
                            border: "1.5px solid #6366f1",
                            fontWeight: "700",
                            color: "#6366f1"
                          }}
                        />
                      </div>

                      <div className="form-group full-width">
                        <label>📝 توضیحات قلم (اختیاری)</label>
                        <textarea
                          value={item.notes}
                          onChange={(e) => handleItemChange(index, "notes", e.target.value)}
                          placeholder="توضیحات مربوط به این قلم..."
                          style={{ minHeight: "50px" }}
                        ></textarea>
                      </div>
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        className="row-btn delete-btn"
                        onClick={() => handleRemoveItem(index)}
                        title="حذف این قلم"
                        style={{
                          position: "absolute",
                          top: "10px",
                          left: "16px",
                          width: "28px",
                          height: "28px",
                          fontSize: "12px",
                          borderRadius: "8px"
                        }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            {/* این div برای اسکرول خودکار به پایین است */}
            <div ref={itemsEndRef}></div>
          </div>

          <div className="form-actions" style={{ marginTop: "25px", display: "flex", gap: "15px", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="cancel-btn"
              onClick={handleAddItem}
              style={{ 
                padding: "12px 25px", 
                fontSize: "14px", 
                borderRadius: "12px", 
                display: "flex", 
                alignItems: "center", 
                gap: "8px",
                background: darkMode ? "rgba(99, 102, 241, 0.1)" : "#e0e7ff",
                color: darkMode ? "#c7d2fe" : "#4338ca",
                border: "1px solid " + (darkMode ? "rgba(99, 102, 241, 0.3)" : "#c7d2fe"),
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              ➕ افزودن محصول
            </button>
            <button
              type="submit"
              className="save-btn"
              disabled={submitting}
              style={{ 
                padding: "12px 30px", 
                fontSize: "15px", 
                borderRadius: "12px", 
                boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                opacity: submitting ? 0.7 : 1
              }}
            >
              <Save size={18} /> {submitting ? "⏳ در حال ثبت..." : "ثبت سفارش"}
            </button>
          </div>
        </form>
      </div>

      {showAddMoreConfirm && createPortal(
        <div className="modal-overlay" onClick={() => !submitting && setShowAddMoreConfirm(false)} style={{ zIndex: 9999999 }}>
          <div className="modal-box restock-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="restock-confirm-icon">📦</div>
            <h2>افزودن محصول دیگر</h2>
            <p>
              آیا می‌خواهید <strong>محصول دیگری</strong> به این سفارش اضافه کنید؟
            </p>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={handleAddMoreNo}
                disabled={submitting}
              >
                {submitting ? "⏳ در حال ثبت..." : "خیر، ثبت نهایی"}
              </button>
              <button
                type="button"
                className="save-btn"
                onClick={handleAddMoreYes}
                disabled={submitting}
              >
                ✅ بله، اضافه کن
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

const KILNS = [
  "کوره ۱", "کوره ۲", "کوره ۳", "کوره ۴", "کوره ۵",
  "کوره ۶", "کوره ۷", "کوره ۸", "کوره ۹", "کوره ۱۰",
  "کوره ۱۱", "کوره ۱۲", "کوره ۱۳", "کوره ۱۴", "کوره ۱۵",
  "کوره ۱۶", "کوره ۱۷", "کوره ۱۸", "کوره ۱۹", "کوره ۲۰",
  "کوره ۲۱", "کوره ۲۲", "کوره ۲۳", "کوره ۲۴", "کوره ۲۵",
  "کوره ۲۶", "کوره ۲۷", "کوره ۲۸", "کوره ۲۹"
]

function ProductionForm({ productionType = "final", loadProductions, orders, products, categories, loadDashboardStats, showToast, currentUser, setPage, handleLogout, darkMode, setDarkMode }) {

  const [formData, setFormData] = useState({
    production_date: "",
    kiln: "",
    category: "",
    product_name: "",
    quantity: "",
    unit: "عدد",
    notes: ""
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData({ ...formData, [name]: value })
  }

  // فیلتر محصولات بر اساس دسته‌بندی انتخاب شده
  const filteredProducts = formData.category
    ? products.filter((p) => p.category === formData.category)
    : []



  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateRequiredFields(event.target, showToast)) return

    try {
      const response = await authFetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, production_type: productionType })
      })

      const data = await response.json()
      console.log("🔥 پاسخ سرور:", data)

      if (data.success) {
        showToast("تولید با موفقیت ثبت شد", "success")
        loadProductions()
        loadDashboardStats()
        setFormData({
          production_date: "",
          kiln: "",
          category: "",
          product_name: "",
          quantity: "",
          unit: "عدد",
          notes: ""
        })
      } else {
        showToast(data.message || "خطا در ثبت تولید", "error")
      }
    } catch (error) {
      console.error("خطا در ثبت تولید:", error)
      showToast("خطا در ارتباط با سرور", "error")
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>{productionType === "primary" ? "ثبت تولید اولیه" : "ثبت تولید نهایی"}</h1>
          <p>ثبت مقدار تولید روزانه کارخانه</p>
        </div>
        
      </header>

      <div className="panel order-form">
        <div className="panel-header">
          <h2>{productionType === "primary" ? "ثبت تولید اولیه" : "ثبت تولید نهایی"}</h2>
          <span>اطلاعات تولید آجر</span>
        </div>
                 <form onSubmit={(e) => {
          handleSubmit(e)
        }} noValidate>
          <div className="form-grid">

            <div className="form-group">
              <label>تاریخ تولید <span style={{ color: "#ef4444" }}>*</span></label>
              <PersianDateInput
                value={formData.production_date}
                onChange={(date) => setFormData({ ...formData, production_date: date })}
                placeholder="انتخاب تاریخ تولید"
                required
              />
            </div>

            <div className="form-group">
              <label>کوره <span style={{ color: "#ef4444" }}>*</span></label>
              <select
                name="kiln"
                value={formData.kiln}
                onChange={handleChange}
                required
                className="filter-select-pretty"
              >
                <option value="">انتخاب کوره</option>
                {KILNS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>دسته‌بندی <span style={{ color: "#ef4444" }}>*</span></label>
              <select
                name="category"
                value={formData.category}
                onChange={(e) => setFormData({
                  ...formData,
                  category: e.target.value,
                  product_name: "" // وقتی دسته عوض شد، محصول پاک بشه
                })}
                required
                className="filter-select-pretty"
              >
                <option value="">انتخاب دسته‌بندی</option>
                {categories && categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>عنوان محصول <span style={{ color: "#ef4444" }}>*</span></label>
              <select
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                required
                disabled={!formData.category}
                className="filter-select-pretty"
              >
                <option value="">
                  {formData.category ? "انتخاب محصول" : "ابتدا دسته‌بندی را انتخاب کنید"}
                </option>
                {filteredProducts.map((product) => (
                  <option key={product.id} value={product.name}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

             <div className="form-group">
              <label>مقدار تولید <span style={{ color: "#ef4444" }}>*</span></label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="مثلاً 5000"
                required
                style={{ colorScheme: darkMode ? "dark" : "light" }}
              />
            </div>

            <div className="form-group">
              <label>واحد <span style={{ color: "#ef4444" }}>*</span></label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                required
                className="filter-select-pretty"
              >
                <option value="عدد">عدد</option>
                <option value="قالب">قالب</option>
                <option value="پالت">پالت</option>
                <option value="کیلوگرم">کیلوگرم</option>
                <option value="تن">تن</option>
                <option value="متر مربع">متر مربع</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label>توضیحات</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="توضیحات مربوط به تولید..."
              ></textarea>
            </div>

          </div>

          <div className="form-actions">
            <button type="submit" className="save-btn">
              <Save size={16} /> ثبت تولید
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

function ProductionReport({ productions, loadProductions, setEditItem, products, categories, currentUser, setPage, handleLogout, darkMode, setDarkMode }) {
  const [filterDate, setFilterDate] = useState("")
  const [filterProduct, setFilterProduct] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [filterFrom, setFilterFrom] = useState("")
  const [filterTo, setFilterTo] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [sortKey, setSortKey] = useState("production_date")
  const [sortDir, setSortDir] = useState("desc")
       const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleteBlocked, setDeleteBlocked] = useState(null)
  const [deleteReason, setDeleteReason] = useState("")

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

const filteredProductions = productions.filter((item) => {
  // فیلتر تاریخ دقیق
  if (filterDate && item.production_date !== filterDate) return false

  // فیلتر دسته‌بندی
  if (filterCategory) {
    // پیدا کردن محصول توی لیست products
    const productInfo = products.find((p) => p.name === item.product_name)
    if (!productInfo || productInfo.category !== filterCategory) return false
  }

  // فیلتر محصول
  if (filterProduct && item.product_name !== filterProduct) return false

  // فیلتر بازه تاریخ
  if (filterFrom && item.production_date < filterFrom) return false
  if (filterTo && item.production_date > filterTo) return false

  return true
})
  const sortedProductions = [...filteredProductions].sort((a, b) => {
    let valA = a[sortKey]
    let valB = b[sortKey]

    if (valA === null || valA === undefined) valA = ""
    if (valB === null || valB === undefined) valB = ""

    if (sortKey === "quantity") {
      valA = Number(valA || 0)
      valB = Number(valB || 0)
      return sortDir === "asc" ? valA - valB : valB - valA
    }

    const strA = valA.toString()
    const strB = valB.toString()
    return sortDir === "asc"
      ? strA.localeCompare(strB, "fa")
      : strB.localeCompare(strA, "fa")
  })

  const totalPages = Math.ceil(sortedProductions.length / perPage)
  const startIndex = (currentPage - 1) * perPage
  const currentProductions = sortedProductions.slice(startIndex, startIndex + perPage)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])

 const totalProduction = filteredProductions.reduce(
  (sum, item) => sum + Number(item.quantity || 0),
  0
)

// محاسبات تولید اولیه و نهایی (روی productions فیلترشده)
const totalPrimary = filteredProductions
  .filter((p) => p.production_type === "primary")
  .reduce((sum, item) => sum + Number(item.quantity || 0), 0)

const totalFinal = filteredProductions
  .filter((p) => p.production_type === "final" || !p.production_type)
  .reduce((sum, item) => sum + Number(item.quantity || 0), 0)
const todayFinal = (() => {
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

  return filteredProductions
    .filter((p) =>
      p.production_date === todayStr &&
      (p.production_type === "final" || !p.production_type)
    )
    .reduce((sum, item) => sum + Number(item.quantity || 0), 0)
})()
  const machineProductTotals = {}

  filteredProductions.forEach((item) => {
    const machine = item.kiln || "نامشخص"
    const product = item.product_name || "نامشخص"

    const key = `${machine}___${product}`

    if (!machineProductTotals[key]) {
      machineProductTotals[key] = {
        machine,
        product,
        total: 0
      }
    }

    machineProductTotals[key].total += Number(item.quantity || 0)
  })

  const machineProductList = Object.values(machineProductTotals).sort((a, b) => {
    if (a.machine !== b.machine) {
      return a.machine.localeCompare(b.machine, "fa")
    }
    return b.total - a.total
  })

   const handleDelete = (id) => {
  setDeleteConfirm(id)
}

const confirmDelete = async (reason) => {
  if (!deleteConfirm) return

  try {
    const response = await authFetch(`/api/production/${deleteConfirm}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delete_reason: reason })
    })
    const data = await response.json()

    if (data.success) {
      setDeleteConfirm(null)
      loadProductions()
    }
  } catch (error) {
    console.error(error)
    setDeleteConfirm(null)
  }
}

  return (
    <>
      <header className="topbar">
        <div>
          <h1>گزارش تولید</h1>
          <p>بررسی و مدیریت تولیدهای ثبت‌شده کارخانه</p>
        </div>

              
      </header>

      <div className="panel">

        <div className="panel-header">
          <div>
            <h2>📊 گزارش عملکرد تولید</h2>
            <p>نمایش تولیدها بر اساس تاریخ و محصول</p>
          </div>
        </div>

        <div className="stats">
          <div className="stat-card">
            <div className="stat-icon"><BarChart3 size={24} /></div>
            <div>
              <span>تولید اولیه</span>
              <strong>{totalPrimary.toLocaleString()}</strong>
              <small>عدد</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"><Factory size={24} /></div>
            <div>
              <span>تولید نهایی</span>
              <strong>{totalFinal.toLocaleString()}</strong>
              <small>عدد</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"><BarChart3 size={24} /></div>
            <div>
              <span>تولید نهایی امروز</span>
              <strong>
                <AnimatedNumber value={todayFinal} />
                <small>عدد</small>
              </strong>
              <small>تولید امروز کارخانه</small>
            </div>
          </div>
        </div>
                {/* فیلترها */}
        <div className="form-group full-width" style={{ marginTop: "20px" }}>
          <label>فیلترها</label>

                   <div className="filter-row" style={{ position: "relative", zIndex: 10 }}>
            <div className="filter-item">
              <span className="filter-label">📁 دسته‌بندی</span>
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value)
                  setFilterProduct("") // وقتی دسته عوض شد، محصول پاک بشه
                }}
                className="filter-select-pretty"
              >
                <option value="">همه دسته‌ها</option>
                {categories && categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <span className="filter-label">📦 محصول</span>
              <select
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                className="filter-select-pretty"
              >
                <option value="">همه محصولات</option>
                {products
                  .filter((p) => !filterCategory || p.category === filterCategory)
                  .map((product) => (
                    <option key={product.id} value={product.name}>
                      {product.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="filter-item">
              <span className="filter-label">📅 از تاریخ</span>
              <PersianDateInput
                value={filterFrom}
                onChange={(date) => setFilterFrom(date)}
                placeholder="از تاریخ"
              />
            </div>

            <div className="filter-item">
              <span className="filter-label">📅 تا تاریخ</span>
              <PersianDateInput
                value={filterTo}
                onChange={(date) => setFilterTo(date)}
                placeholder="تا تاریخ"
              />
            </div>

            <div className="filter-item">
              <span className="filter-label">📅 تاریخ دقیق</span>
              <PersianDateInput
                value={filterDate}
                onChange={(date) => setFilterDate(date)}
                placeholder="تاریخ دقیق"
              />
            </div>

            <button
              type="button"
              className="clear-filter-btn"
              onClick={() => {
                setFilterDate("")
                setFilterProduct("")
                setFilterCategory("")
                setFilterFrom("")
                setFilterTo("")
              }}
            >
              🔄 پاک کردن فیلترها
            </button>
          </div>
        </div>
          <div className="production-details-card" style={{ position: "relative", zIndex: 1 }}>
<div className="production-details-header">
  <div>
    <h2>📋 جزئیات تولیدها</h2>
    <p>فهرست کامل تولیدهای ثبت‌شده</p>
  </div>

  <div className="table-actions">
    <button
      type="button"
      className="action-btn print-btn"
      onClick={() => printTable("production-table-print", "گزارش تولید")}
    >
      🖨️ چاپ
    </button>
    <button
      type="button"
      className="action-btn excel-btn"
      onClick={() => exportToExcel("production-table-print", "production")}
    >
      📊 Excel
    </button>
  </div>
</div>
<div className="table-container production-table">
  <table className="orders-table" id="production-table-print">
  <thead>
    <tr>
     <th>ردیف</th>
<SortableHeader label="تاریخ تولید" sortKey="production_date" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
<SortableHeader label="کوره" sortKey="kiln" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
<SortableHeader label="عنوان محصول" sortKey="product_name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
<SortableHeader label="مقدار تولید" sortKey="quantity" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
<SortableHeader label="واحد" sortKey="unit" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
<SortableHeader label="توضیحات" sortKey="notes" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
<th>ثبت‌کننده</th>
<th>عملیات</th>
</tr>
  </thead>

  <tbody>
    {filteredProductions.length === 0 ? (
      <tr>
<td colSpan="9" className="empty-table">          📭 هنوز تولیدی برای نمایش وجود ندارد
        </td>
      </tr>
    ) : (
      currentProductions.map((item, index) => (
        <tr key={item.id}>
          <td>
            <span className="row-number">
              {index + 1}
            </span>
          </td>

          <td>
           <span className="date-badge">
  📅 {toPersianDate(item.production_date)}
</span>
          </td>

          <td>
            <span className="machine-badge">
              {item.kiln || "-"}
            </span>
          </td>

          <td>
            <span className="product-name">
              🧱 {item.product_name}
            </span>
          </td>

          <td>
           <span className="weight-badge">
  {Number(item.quantity).toLocaleString()}
</span>
          </td>

          <td>
           <span className="machine-badge">
  {item.unit || "عدد"}
</span>
          </td>

          <td>
  <span className="notes-text">
    {item.notes || "—"}
  </span>
</td>
<td><span className="notes-text">👤 {item.created_by_full_name || item.created_by || "-"}</span></td>
<td>
  <div className="row-actions">
    <button
      className="row-btn edit-btn"
      onClick={() => setEditItem({ ...item, type: "production" })}
      title="ویرایش"
    >
      ✏️
    </button>
    <button
      className="row-btn delete-btn"
      onClick={() => handleDelete(item.id)}
      title="حذف"
    >
      🗑️
    </button>
  </div>
</td>
</tr>
      ))
    )}
   </tbody>
</table>

<TableControls
  totalItems={filteredProductions.length}
  perPage={perPage}
  onPerPageChange={setPerPage}
/>

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
/>
          </div>

      </div>

    </div>
      {deleteConfirm && (
        <DeleteReasonModal
          title="حذف تولید"
          itemName={productions.find((p) => p.id === deleteConfirm)?.product_name || ""}
          onConfirm={confirmDelete}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </>
  )
}
function ProductionPrimaryReport({ productions, loadProductions, setEditItem, products, categories, currentUser, setPage, handleLogout, darkMode, setDarkMode }) {
  const [filterDate, setFilterDate] = useState("")
  const [filterProduct, setFilterProduct] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [filterFrom, setFilterFrom] = useState("")
  const [filterTo, setFilterTo] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [sortKey, setSortKey] = useState("production_date")
  const [sortDir, setSortDir] = useState("desc")
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const primaryProductions = productions.filter(
    (p) => p.production_type === "primary" || !p.production_type
  )

  const filteredProductions = primaryProductions.filter((item) => {
    if (filterDate && item.production_date !== filterDate) return false

    if (filterCategory) {
      const productInfo = products.find((p) => p.name === item.product_name)
      if (!productInfo || productInfo.category !== filterCategory) return false
    }

    if (filterProduct && item.product_name !== filterProduct) return false
    if (filterFrom && item.production_date < filterFrom) return false
    if (filterTo && item.production_date > filterTo) return false

    return true
  })

  const sortedProductions = [...filteredProductions].sort((a, b) => {
    let valA = a[sortKey]
    let valB = b[sortKey]

    if (valA === null || valA === undefined) valA = ""
    if (valB === null || valB === undefined) valB = ""

    if (sortKey === "quantity") {
      valA = Number(valA || 0)
      valB = Number(valB || 0)
      return sortDir === "asc" ? valA - valB : valB - valA
    }

    const strA = valA.toString()
    const strB = valB.toString()
    return sortDir === "asc"
      ? strA.localeCompare(strB, "fa")
      : strB.localeCompare(strA, "fa")
  })

  const totalPages = Math.ceil(sortedProductions.length / perPage)
  const startIndex = (currentPage - 1) * perPage
  const currentProductions = sortedProductions.slice(startIndex, startIndex + perPage)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])

  const totalProduction = filteredProductions.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  )

  const todayPrimary = (() => {
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

    return primaryProductions
      .filter((p) => p.production_date === todayStr)
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  })()

  const handleDelete = (id) => {
    setDeleteConfirm(id)
  }

  const confirmDelete = async (reason) => {
    if (!deleteConfirm) return

    try {
      const response = await authFetch(`/api/production/${deleteConfirm}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delete_reason: reason })
      })
      const data = await response.json()

      if (data.success) {
        setDeleteConfirm(null)
        loadProductions()
      }
    } catch (error) {
      console.error(error)
      setDeleteConfirm(null)
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>گزارش تولید اولیه</h1>
          <p>بررسی و مدیریت تولیدهای اولیه ثبت‌شده</p>
        </div>
      </header>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>📊 گزارش تولید اولیه</h2>
            <p>نمایش تولیدهای اولیه بر اساس تاریخ و محصول</p>
          </div>
        </div>

        <div className="stats">
          <div className="stat-card">
            <div className="stat-icon"><BarChart3 size={24} /></div>
            <div>
              <span>جمع کل تولید اولیه</span>
              <strong>{totalProduction.toLocaleString()}</strong>
              <small>عدد</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"><Factory size={24} /></div>
            <div>
              <span>تعداد ثبت تولید</span>
              <strong>{filteredProductions.length}</strong>
              <small>رکورد تولید</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"><BarChart3 size={24} /></div>
            <div>
              <span>تولید اولیه امروز</span>
              <strong>
                <AnimatedNumber value={todayPrimary} />
                <small>عدد</small>
              </strong>
              <small>تولید اولیه امروز کارخانه</small>
            </div>
          </div>
        </div>

        <div className="form-group full-width" style={{ marginTop: "20px" }}>
          <label>فیلترها</label>

          <div className="filter-row" style={{ position: "relative", zIndex: 10 }}>
            <div className="filter-item">
              <span className="filter-label">📁 دسته‌بندی</span>
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value)
                  setFilterProduct("")
                }}
                className="filter-select-pretty"
              >
                <option value="">همه دسته‌ها</option>
                {categories && categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <span className="filter-label">📦 محصول</span>
              <select
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                className="filter-select-pretty"
              >
                <option value="">همه محصولات</option>
                {products
                  .filter((p) => !filterCategory || p.category === filterCategory)
                  .map((product) => (
                    <option key={product.id} value={product.name}>
                      {product.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="filter-item">
              <span className="filter-label">📅 از تاریخ</span>
              <PersianDateInput
                value={filterFrom}
                onChange={(date) => setFilterFrom(date)}
                placeholder="از تاریخ"
              />
            </div>

            <div className="filter-item">
              <span className="filter-label">📅 تا تاریخ</span>
              <PersianDateInput
                value={filterTo}
                onChange={(date) => setFilterTo(date)}
                placeholder="تا تاریخ"
              />
            </div>

            <div className="filter-item">
              <span className="filter-label">📅 تاریخ دقیق</span>
              <PersianDateInput
                value={filterDate}
                onChange={(date) => setFilterDate(date)}
                placeholder="تاریخ دقیق"
              />
            </div>

            <button
              type="button"
              className="clear-filter-btn"
              onClick={() => {
                setFilterDate("")
                setFilterProduct("")
                setFilterCategory("")
                setFilterFrom("")
                setFilterTo("")
              }}
            >
              🔄 پاک کردن فیلترها
            </button>
          </div>
        </div>

        <div className="production-details-card" style={{ position: "relative", zIndex: 1 }}>
          <div className="production-details-header">
            <div>
              <h2>📋 جزئیات تولیدهای اولیه</h2>
              <p>فهرست کامل تولیدهای اولیه ثبت‌شده</p>
            </div>

            <div className="table-actions">
              <button
                type="button"
                className="action-btn print-btn"
                onClick={() => printTable("production-primary-table-print", "گزارش تولید اولیه")}
              >
                🖨️ چاپ
              </button>
              <button
                type="button"
                className="action-btn excel-btn"
                onClick={() => exportToExcel("production-primary-table-print", "production-primary")}
              >
                📊 Excel
              </button>
            </div>
          </div>

          <div className="table-container production-table">
            <table className="orders-table" id="production-primary-table-print">
              <thead>
                <tr>
                  <th>ردیف</th>
                  <SortableHeader label="تاریخ تولید" sortKey="production_date" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <SortableHeader label="کوره" sortKey="kiln" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <SortableHeader label="عنوان محصول" sortKey="product_name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <SortableHeader label="مقدار تولید" sortKey="quantity" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <SortableHeader label="واحد" sortKey="unit" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <SortableHeader label="توضیحات" sortKey="notes" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <th>ثبت‌کننده</th>
                  <th>عملیات</th>
                </tr>
              </thead>

              <tbody>
                {filteredProductions.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-table">
                      📭 هنوز تولید اولیه‌ای برای نمایش وجود ندارد
                    </td>
                  </tr>
                ) : (
                  currentProductions.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        <span className="row-number">{index + 1}</span>
                      </td>

                      <td>
                        <span className="date-badge">
                          📅 {toPersianDate(item.production_date)}
                        </span>
                      </td>

                      <td>
                        <span className="machine-badge">
                          {item.kiln || "-"}
                        </span>
                      </td>

                      <td>
                        <span className="product-name">
                          🧱 {item.product_name}
                        </span>
                      </td>

                      <td>
                        <span className="weight-badge">
                          {Number(item.quantity).toLocaleString()}
                        </span>
                      </td>

                      <td>
                        <span className="machine-badge">
                          {item.unit || "عدد"}
                        </span>
                      </td>

                      <td>
                        <span className="notes-text">
                          {item.notes || "—"}
                        </span>
                      </td>

                      <td>
                        <span className="notes-text">
                          👤 {item.created_by_full_name || item.created_by || "-"}
                        </span>
                      </td>

                      <td>
                        <div className="row-actions">
                          <button
                            className="row-btn edit-btn"
                            onClick={() => setEditItem({ ...item, type: "production" })}
                            title="ویرایش"
                          >
                            ✏️
                          </button>
                          <button
                            className="row-btn delete-btn"
                            onClick={() => handleDelete(item.id)}
                            title="حذف"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <TableControls
              totalItems={filteredProductions.length}
              perPage={perPage}
              onPerPageChange={setPerPage}
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      {deleteConfirm && (
        <DeleteReasonModal
          title="حذف تولید اولیه"
          itemName={productions.find((p) => p.id === deleteConfirm)?.product_name || ""}
          onConfirm={confirmDelete}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </>
  )
}
function CustomersPage({ customers, loadCustomers, setEditItem, showToast, currentUser, setPage, handleLogout, darkMode, setDarkMode }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    company: "",
    register_date: ""
  })
  const [submitting, setSubmitting] = useState(false)

 const [currentPage, setCurrentPage] = useState(1)
const [perPage, setPerPage] = useState(10)
const [sortKey, setSortKey] = useState("created_at")
const [sortDir, setSortDir] = useState("desc")
const [deleteConfirm, setDeleteConfirm] = useState(null)
const [deleteBlocked, setDeleteBlocked] = useState(null)
const [searchInput, setSearchInput] = useState("")
const [searchTerm, setSearchTerm] = useState("")

const applySearch = () => {
  setSearchTerm(searchInput)
  setCurrentPage(1)
}

const handleSort = (key) => {
  if (sortKey === key) {
    setSortDir(sortDir === "asc" ? "desc" : "asc")
  } else {
    setSortKey(key)
    setSortDir("asc")
  }
}

const searchedCustomers = customers.filter((c) => {
  if (!searchTerm) return true
  const term = searchTerm.toLowerCase()
  return (
    c.name?.toLowerCase().includes(term) ||
    c.phone?.includes(term) ||
    c.company?.toLowerCase().includes(term) ||
    c.address?.toLowerCase().includes(term)
  )
})

const sortedCustomers = [...searchedCustomers].sort((a, b) => {
  let valA = a[sortKey]
  let valB = b[sortKey]

  if (valA === null || valA === undefined) valA = ""
  if (valB === null || valB === undefined) valB = ""

  const strA = valA.toString()
  const strB = valB.toString()
  return sortDir === "asc"
    ? strA.localeCompare(strB, "fa")
    : strB.localeCompare(strA, "fa")
})
const totalPages = Math.ceil(sortedCustomers.length / perPage)
  const startIndex = (currentPage - 1) * perPage
  const currentCustomers = sortedCustomers.slice(startIndex, startIndex + perPage)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])
  const handleDelete = (id) => {
    setDeleteConfirm(id)
  }
  const confirmDelete = async (reason) => {
    if (!deleteConfirm) return

    try {
      const response = await authFetch(`/api/customers/${deleteConfirm}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delete_reason: reason })
      })
      const data = await response.json()

      if (data.success) {
        setDeleteConfirm(null)
        showToast("مشتری به آرشیو منتقل شد", "success")
        loadCustomers()
      } else if (data.blocked) {
        // مشتری قابل حذف نیست
        setDeleteConfirm(null)
        setDeleteBlocked({
          message: data.message,
          details: data.details
        })
      }
    } catch (error) {
      console.error(error)
      setDeleteConfirm(null)
      showToast("خطا در حذف مشتری", "error")
    }
  }
  const handleChange = (event) => {
    const { name, value } = event.target

    setForm({
      ...form,
      [name]: value
    })
  }

   const handleSubmit = async (event) => {
    event.preventDefault()

    if (submitting) return

    if (!validateRequiredFields(event.target, showToast)) return

    if (!form.register_date || !form.register_date.trim()) {
      showToast("⚠️ لطفاً تاریخ ثبت مشتری را انتخاب کنید", "warning")
      return
    }

    if (form.phone && form.phone.length !== 11) {
      showToast("شماره تماس باید دقیقاً ۱۱ رقم باشد", "warning")
      return
    }

    if (form.phone && !/^\d{11}$/.test(form.phone)) {
      showToast("شماره تماس فقط باید شامل اعداد باشد", "warning")
      return
    }

    setSubmitting(true)

    try {
      const response = await authFetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      })

      const data = await response.json()

      if (data.success) {
        showToast("مشتری با موفقیت ثبت شد", "success")

        setForm({
          name: "",
          phone: "",
          company: "",
          register_date: ""
        })

        loadCustomers()
      } else {
        showToast(data.message || "خطا در ثبت مشتری", "error")
      }
    } catch (error) {
      console.error("خطا در ثبت مشتری:", error)
      showToast("خطا در ارتباط با سرور", "error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>مدیریت مشتریان</h1>
          <p>ثبت و مشاهده اطلاعات مشتریان  آجر نسوز محراب </p>
        </div>
        
      </header>

      <div className="panel order-form" style={{ position: "relative", zIndex: 10 }}>
        <div className="panel-header">
          <h2>ثبت مشتری جدید</h2>
        </div>

          <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="form-group">
              <label>نام و نام خانوادگی مشتری <span style={{ color: "#ef4444" }}>*</span></label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="نام و نام خانوادگی مشتری"
                required
              />
            </div>

            <div className="form-group" style={{ position: "relative", zIndex: 500 }}>
              <label>تاریخ ثبت مشتری <span style={{ color: "#ef4444" }}>*</span></label>
              <PersianDateInput
                value={form.register_date}
                onChange={(date) => setForm({ ...form, register_date: date })}
                placeholder="انتخاب تاریخ ثبت مشتری"
                required
              />
            </div>

            <div className="form-group">
              <label>شماره تماس <span style={{ color: "#ef4444" }}>*</span></label>
              <input
  type="text"
  name="phone"
  value={form.phone}
  onChange={(e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 11)
    setForm({ ...form, phone: value })
  }}
  placeholder="مثلاً 09123456789"
  maxLength={11}
  inputMode="numeric"
  required
/>
{form.phone && form.phone.length !== 11 && (
  <small style={{
    color: "#f59e0b",
    fontSize: "11px",
    marginTop: "4px",
    display: "block",
    fontWeight: "600"
  }}>
    ⚠️ شماره تماس باید ۱۱ رقم باشد ({form.phone.length}/۱۱)
  </small>
)}
            </div>
            <div className="form-group">
              <label>نام شرکت یا فروشگاه</label>
              <input
                type="text"
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder="نام شرکت یا فروشگاه (اختیاری)"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-btn" disabled={submitting}>
              {submitting ? "⏳ در حال ثبت..." : "💾 ثبت مشتری"}
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
         <div className="panel-header">
          <h2>فهرست مشتریان</h2>
          <div className="table-actions">
            <button
              type="button"
              className="action-btn print-btn"
              onClick={() => printTable("customers-table-print", "لیست مشتریان")}
            >
              🖨️ چاپ
            </button>
            <button
              type="button"
              className="action-btn excel-btn"
              onClick={() => exportToExcel("customers-table-print", "customers")}
            >
              📊 Excel
            </button>
          </div>
        </div>
        {customers.length === 0 ? (
          <div className="empty-state">
            <div>👥</div>
            <h3>هنوز مشتری‌ای ثبت نشده</h3>
            <p>مشتری‌های ثبت‌شده در این قسمت نمایش داده می‌شوند.</p>
          </div>
        ) : (
  <>
<div className="search-bar-wrapper">
  
  <input
    type="text"
    placeholder="🔍 جستجوی مشتری..."
    value={searchInput}
    onChange={(e) => {
      const val = e.target.value
      setSearchInput(val)
      if (val === "") {
        setSearchTerm("")
        setCurrentPage(1)
      }
    }}
    onKeyDown={(e) => {
      if (e.key === "Enter") applySearch()
    }}
    className="search-bar-input"
  />
  {searchInput && (
    <button
      className="search-bar-clear"
      onClick={() => {
        setSearchInput("")
        setSearchTerm("")
        setCurrentPage(1)
      }}
    >
      ✕
    </button>
  )}
  <button
    type="button"
    className="search-bar-apply"
    onClick={applySearch}
  >
    اعمال فیلتر
  </button>
</div>

    <div className="orders-table-wrapper">
      <table className="orders-table" id="customers-table-print">
              <thead>
                <tr>
                  <th>ردیف</th>
                  <SortableHeader label="نام مشتری" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <SortableHeader label="تاریخ ثبت" sortKey="register_date" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <SortableHeader label="شماره تماس" sortKey="phone" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <SortableHeader label="شرکت یا فروشگاه" sortKey="company" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <th>ثبت‌کننده</th>
                  <th>عملیات</th>
                </tr>
              </thead>

                            <tbody>
                {currentCustomers.map((customer, index) => (
                  <tr key={customer.id}>
                    <td>{index + 1}</td>
                    <td>{customer.name}</td>
                    <td>
                      <span className="date-badge">
                        📅 {customer.register_date ? customer.register_date : "-"}
                      </span>
                    </td>
                    <td>{customer.phone || "-"}</td>
                    <td>{customer.company || "-"}</td>
                    <td>
                      <span className="notes-text">
                        👤 {customer.created_by_full_name || customer.created_by || "-"}
                      </span>
                    </td>
<td>
  <div className="row-actions">
    <button
      className="row-btn edit-btn"
      onClick={() => setEditItem({ ...customer, type: "customer" })}
      title="ویرایش"
    >
      ✏️
    </button>
    <button
      className="row-btn delete-btn"
      onClick={() => handleDelete(customer.id)}
      title="حذف"
    >
      🗑️
    </button>
  </div>
</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <TableControls
              totalItems={searchedCustomers.length}
              perPage={perPage}
              onPerPageChange={setPerPage}
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
        )}
      </div>

      {deleteConfirm && (
        <DeleteReasonModal
          title="حذف مشتری"
          itemName={customers.find((c) => c.id === deleteConfirm)?.name || ""}
          onConfirm={confirmDelete}
          onClose={() => setDeleteConfirm(null)}
        />
      )}

      {deleteBlocked && (
        <DeleteBlockedModal
          title="امکان حذف مشتری وجود ندارد"
          message={deleteBlocked.message}
          details={deleteBlocked.details}
          onClose={() => setDeleteBlocked(null)}
        />
      )}
    </>
  )
}
function OrdersList({ orders, loadOrders, setEditItem, currentUser, setPage, handleLogout, darkMode, setDarkMode, categories }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [sortKey, setSortKey] = useState("order_date")
  const [sortDir, setSortDir] = useState("desc")
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleteBlocked, setDeleteBlocked] = useState(null)
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPriority, setFilterPriority] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [filterFrom, setFilterFrom] = useState("")
  const [filterTo, setFilterTo] = useState("")
  const [showRejectReason, setShowRejectReason] = useState(null)

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const applySearch = () => {
    setSearchTerm(searchInput)
    setCurrentPage(1)
  }
  // تابع کمکی برای تشخیص دسته‌بندی سفارش
  const resolveOrderCategory = (order) => {
    if (order.category) return order.category
    if (!order.brick_type) return ""
    const bt = order.brick_type
    if (bt.includes("شاموت") || bt.includes("شومینه") || bt.includes("رومی") || bt.includes("هلالی") || bt.includes("ال گرد") || bt.includes("ال تیز") || bt.includes("پلاک")) {
      return "آجرهای نسوز شاموت"
    }
    if (bt.includes("سمیرم")) return "آجرهای نسوز سمیرم"
    return "آجرهای صنعتی"
  }

  // فیلتر
  const filteredOrders = orders.filter((o) => {
    if (filterPriority && o.priority !== filterPriority) return false
    if (filterCategory && resolveOrderCategory(o) !== filterCategory) return false
    if (filterFrom && o.order_date < filterFrom) return false
    if (filterTo && o.order_date > filterTo) return false
 if (searchTerm) {
  const term = searchTerm.toLowerCase()
  const matchCustomer = o.customer_name?.toLowerCase().includes(term)
  const matchCategory = o.category?.toLowerCase().includes(term)
  const matchBrick = o.brick_type?.toLowerCase().includes(term)
  const matchNotes = o.notes?.toLowerCase().includes(term)

  if (!matchCustomer && !matchCategory && !matchBrick && !matchNotes) {
    return false
  }
}
    return true
  })

  // مرتب‌سازی
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let valA = a[sortKey]
    let valB = b[sortKey]

    if (valA === null || valA === undefined) valA = ""
    if (valB === null || valB === undefined) valB = ""

    if (sortKey === "quantity") {
      valA = Number(valA || 0)
      valB = Number(valB || 0)
      return sortDir === "asc" ? valA - valB : valB - valA
    }

    const strA = valA.toString()
    const strB = valB.toString()
    return sortDir === "asc"
      ? strA.localeCompare(strB, "fa")
      : strB.localeCompare(strA, "fa")
  })

  const totalPages = Math.ceil(sortedOrders.length / perPage)
  const startIndex = (currentPage - 1) * perPage
  const currentOrders = sortedOrders.slice(startIndex, startIndex + perPage)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])

  const handleDelete = (id) => {
    setDeleteConfirm(id)
  }

  const confirmDelete = async (reason) => {
    if (!deleteConfirm) return

    try {
      const response = await authFetch(`/api/orders/${deleteConfirm}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delete_reason: reason })
      })
      const data = await response.json()

      if (data.success) {
        setDeleteConfirm(null)
        loadOrders()
      } else if (data.blocked) {
        // سفارش قابل حذف نیست
        setDeleteConfirm(null)
        setDeleteBlocked({
          message: data.message,
          details: data.details
        })
      }
    } catch (error) {
      console.error(error)
      setDeleteConfirm(null)
    }
  }
  return (
    <>
      <header className="topbar">
        <div>
          <h1>سفارشات</h1>
          <p>مدیریت و مشاهده سفارش‌های ثبت شده</p>
        </div>

              
      </header>

      <div className="panel orders-list">
       <div className="panel-header">
  <h2>لیست سفارشات</h2>
</div>

        {/* فیلترها */}
        {orders.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            {/* جستجو */}
            <div className="search-bar-wrapper" style={{ maxWidth: "100%", marginBottom: "14px" }}>
              
                       <input
                type="text"
                placeholder="جستجو در مشتری، دسته‌بندی، نوع آجر، کوره، توضیحات..."
                value={searchInput}
                onChange={(e) => {
                  const val = e.target.value
                  setSearchInput(val)
                  if (val === "") {
                    setSearchTerm("")
                    setCurrentPage(1)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applySearch()
                }}
                className="search-bar-input"
              />
              {searchInput && (
                <button
                  className="search-bar-clear"
                  onClick={() => {
                    setSearchInput("")
                    setSearchTerm("")
                    setCurrentPage(1)
                  }}
                >
                  ✕
                </button>
              )}
                <button
                type="button"
                className="search-bar-apply"
                onClick={applySearch}
              >
                اعمال فیلتر
              </button>
            </div>
                     {/* فیلترها */}
            <div className="filter-row" style={{ position: "relative", zIndex: 100 }}>
              <div className="filter-item">
                <span className="filter-label">📁 دسته‌بندی</span>
                   <select
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="filter-select-pretty"
                >
                  <option value="">همه دسته‌ها</option>
                  {categories && categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

                <div className="filter-item">
                <span className="filter-label">⚡ اولویت</span>
                <select
                  value={filterPriority}
                  onChange={(e) => {
                    setFilterPriority(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="filter-select-pretty"
                >
                  <option value="">همه اولویت‌ها</option>
                  <option value="عادی">عادی</option>
                  <option value="فوری">فوری</option>
                </select>
              </div>




                    <div className="filter-item">
                <span className="filter-label">📅 از تاریخ</span>
                <PersianDateInput
                  value={filterFrom}
                  onChange={(date) => {
                    setFilterFrom(date)
                    setCurrentPage(1)
                  }}
                  placeholder="از تاریخ"
                />
              </div>

              <div className="filter-item">
                <span className="filter-label">📅 تا تاریخ</span>
                <PersianDateInput
                  value={filterTo}
                  onChange={(date) => {
                    setFilterTo(date)
                    setCurrentPage(1)
                  }}
                  placeholder="تا تاریخ"
                />
              </div>

              <button
                type="button"
                className="clear-filter-btn"
                onClick={() => {
                  setSearchInput("")
                  setSearchTerm("")
                  setFilterPriority("")
                  setFilterCategory("")
                  setFilterFrom("")
                  setFilterTo("")
                  setCurrentPage(1)
                }}
              >
                🔄 پاک کردن
              </button>
            </div>
             {/* فیلتر سریع */}
            <div className="quick-filters" style={{ position: "relative", zIndex: 1 }}>
              <span className="quick-filters-label">⚡ فیلتر سریع:</span>
              <button
                type="button"
                className={`quick-filter-btn ${filterPriority === "فوری" ? "active" : ""}`}
                onClick={() => {
                  setFilterPriority(filterPriority === "فوری" ? "" : "فوری")
                  setCurrentPage(1)
                }}
              >
                🔥 فوری
              </button>
              <button
                type="button"
                className={`quick-filter-btn ${filterPriority === "عادی" ? "active" : ""}`}
                onClick={() => {
                  setFilterPriority(filterPriority === "عادی" ? "" : "عادی")
                  setCurrentPage(1)
                }}
              >
                📋 عادی
              </button>
            </div>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="empty-state">
            <div>📋</div>
            <h3>هنوز سفارشی ثبت نشده</h3>
            <p>
              سفارش‌هایی که ثبت می‌کنید در این قسمت نمایش داده می‌شوند.
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <div>🔍</div>
            <h3>سفارشی پیدا نشد</h3>
            <p>با این فیلترها سفارشی وجود نداره.</p>
          </div>
        ) : (
  <>
     <div className="table-actions" style={{ marginBottom: "12px", justifyContent: "flex-end" }}>
      <span>{orders.length} سفارش</span>
      <button
        className="action-btn print-btn"
        onClick={() => printTable("orders-table-print", "لیست سفارشات")}
      >
        🖨️ چاپ
      </button>
      <button
        className="action-btn excel-btn"
        onClick={() => exportToExcel("orders-table-print", "orders")}
      >
        📊 Excel
      </button>
    </div>

    <div className="orders-table-wrapper">
      <table className="orders-table" id="orders-table-print">
          <thead>
  <tr>
    <th>ردیف</th>
    <SortableHeader label="شماره فاکتور" sortKey="order_number" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
    <SortableHeader label="تاریخ" sortKey="order_date" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
    <SortableHeader label="مشتری" sortKey="customer_name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
    <SortableHeader label="دسته‌بندی" sortKey="category" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
    <SortableHeader label="نوع آجر" sortKey="brick_type" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
    <SortableHeader label="تعداد" sortKey="quantity" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
    <th>خروجی رفته</th>
    <th>باقی‌مانده</th>
    <SortableHeader label="اولویت" sortKey="priority" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
    <th>ثبت‌کننده</th>
    <th>عملیات</th>
  </tr>
</thead>

              <tbody>
                {currentOrders.map((order, index) => {
                  const orderItems = Array.isArray(order.items) && order.items.length > 0
                    ? order.items
                    : [{
                        category: order.category,
                        brick_type: order.brick_type,
                        quantity: order.quantity
                      }]

                  return (
                    <tr key={order.id}>
                      <td>{startIndex + index + 1}</td>
                      <td>
                        <span className="machine-badge" style={{ background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)", color: "#3730a3" }}>
                          {order.order_number || "-"}
                        </span>
                      </td>
                      <td>{toPersianDate(order.order_date)}</td>
                      <td>{order.customer_name}</td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                          {orderItems.map((item, i) => (
                            <span key={i} className="machine-badge">
                              {item.category || resolveOrderCategory(order) || "-"}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                          {orderItems.map((item, i) => (
                            <span key={i}>{item.brick_type || "-"}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                          {orderItems.map((item, i) => (
                            <span key={i} className="weight-badge">
                              {Number(item.quantity || 0).toLocaleString()} عدد
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                          <span className="weight-badge" style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #a7f3d0 100%)", color: "#047857" }}>
                            {Number(order.total_shipped || 0).toLocaleString()} خروجی
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                          <span className="weight-badge" style={{ background: "linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)", color: "#c2410c" }}>
                            {Math.max(0, Number(order.quantity || 0) - Number(order.total_shipped || 0)).toLocaleString()} باقی
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={order.priority === "فوری" ? "priority-urgent" : "priority-normal"}>
                          {order.priority}
                        </span>
                      </td>
                      <td>
                        <span className="notes-text">
                          👤 {order.created_by_full_name || order.created_by || "-"}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          {order.hasRejectedExit && (
                            <span
                              className="status-badge status-rejected"
                              style={{ cursor: "pointer" }}
                              onClick={() => setShowRejectReason({ reason: order.rejectedExitReason, customer: order.customer_name })}
                            >
                              ❌ رد مالی
                            </span>
                          )}
                          <button
                            className="row-btn edit-btn"
                            onClick={() => setEditItem(order)}
                            title="ویرایش"
                          >
                            ✏️
                          </button>
                          <button
                            className="row-btn delete-btn"
                            onClick={() => handleDelete(order.id)}
                            title="حذف"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <TableControls
              totalItems={filteredOrders.length}
              perPage={perPage}
              onPerPageChange={setPerPage}
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
        )}

        {deleteConfirm && (
          <DeleteReasonModal
            title="حذف سفارش"
            itemName={`سفارش ${orders.find((o) => o.id === deleteConfirm)?.customer_name || ""}`}
            onConfirm={confirmDelete}
            onClose={() => setDeleteConfirm(null)}
          />
        )}

        {deleteBlocked && (
          <DeleteBlockedModal
            title="امکان حذف سفارش وجود ندارد"
            message={deleteBlocked.message}
            details={deleteBlocked.details}
            onClose={() => setDeleteBlocked(null)}
          />
        )}

        {showRejectReason && createPortal(
          <div className="modal-overlay" onClick={() => setShowRejectReason(null)} style={{ zIndex: 9999999 }}>
            <div className="modal-box reject-reason-modal" onClick={(e) => e.stopPropagation()}>
              <div className="reject-reason-modal-icon">❌</div>
              <h2>دلیل رد مالی</h2>
              <p className="reject-reason-modal-customer">
                سفارش مشتری: <strong>{showRejectReason.customer}</strong>
              </p>
              <div className="reject-reason-modal-body">
                {showRejectReason.reason || "دلیل رد ثبت نشده"}
              </div>
              <div className="delete-modal-actions">
                <button
                  className="save-btn"
                  onClick={() => setShowRejectReason(null)}
                  style={{ width: "100%" }}
                >
                  متوجه شدم
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </>
  )
}
function EditOrderModal({ order, products, customers, onClose, onSave, showToast, categories }) {
  const emptyItem = {
    category: "",
    brick_type: "",
    quantity: "",
    notes: ""
  }

  const buildInitialItems = () => {
    // اگه سفارش items داره (چندقلمی)
    if (Array.isArray(order.items) && order.items.length > 0) {
      return order.items.map((item) => ({
        category: item.category || "",
        brick_type: item.brick_type || "",
        quantity: item.quantity != null ? String(item.quantity) : "",
        notes: item.notes || ""
      }))
    }

    // وگرنه از فیلدهای قدیمی خود سفارش بساز (تک‌قلمی)
    let cat = order.category
    if (!cat && order.brick_type) {
      const bt = order.brick_type
      if (bt.includes("شاموت") || bt.includes("شومینه") || bt.includes("رومی") || bt.includes("هلالی") || bt.includes("ال گرد") || bt.includes("ال تیز") || bt.includes("پلاک")) {
        cat = "آجرهای نسوز شاموت"
      } else if (bt.includes("سمیرم")) {
        cat = "آجرهای نسوز سمیرم"
      } else {
        cat = "آجرهای صنعتی"
      }
    }

    return [{
      category: cat || "",
      brick_type: order.brick_type || "",
      quantity: order.quantity != null ? String(order.quantity) : "",
      notes: ""
    }]
  }

  const [form, setForm] = useState(() => {
    const { clay_type, items, ...orderWithoutClay } = order
    return {
      ...orderWithoutClay,
      order_date: order.order_date || "",
      customer_name: order.customer_name || "",
      kiln: order.kiln || "",
      priority: order.priority || "عادی",
      notes: order.notes || ""
    }
  })

  const [items, setItems] = useState(buildInitialItems)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === "category") {
      newItems[index].brick_type = ""
    }
    setItems(newItems)
  }

  const handleAddItem = () => {
    setItems([...items, { ...emptyItem }])
  }

  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      showToast("حداقل یک قلم محصول لازمه", "warning")
      return
    }
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.order_date || !form.order_date.trim()) {
      showToast("⚠️ لطفاً تاریخ سفارش را انتخاب کنید", "warning")
      return
    }

    if (!form.customer_name || !form.customer_name.trim()) {
      showToast("⚠️ لطفاً مشتری را انتخاب کنید", "warning")
      return
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.category || !item.brick_type) {
        showToast(`⚠️ قلم ${i + 1}: دسته‌بندی و نوع آجر را انتخاب کنید`, "warning")
        return
      }
      if (!item.quantity || Number(item.quantity) <= 0) {
        showToast(`⚠️ قلم ${i + 1}: تعداد را وارد کنید`, "warning")
        return
      }
    }

    try {
      const payload = {
        order_date: form.order_date,
        customer_name: form.customer_name,
        kiln: form.kiln,
        priority: form.priority,
        notes: form.notes,
        items: items.map((item) => ({
          category: item.category,
          brick_type: item.brick_type,
          quantity: Number(item.quantity || 0),
          notes: item.notes
        }))
      }

      const response = await authFetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.success) {
        showToast("سفارش ویرایش شد", "success")
        onSave()
        onClose()
      } else {
        showToast(data.message || "خطا در ویرایش سفارش", "error")
      }
    } catch (error) {
      console.error(error)
      showToast("خطا در ویرایش سفارش", "error")
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "800px" }}>
        <div className="modal-header">
          <h2>✏️ ویرایش سفارش</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          {/* اطلاعات کلی سفارش */}
          <div className="form-grid">
            <div className="form-group">
              <label>تاریخ سفارش</label>
              <PersianDateInput
                value={form.order_date}
                onChange={(date) => setForm({ ...form, order_date: date })}
                placeholder="انتخاب تاریخ سفارش"
              />
            </div>

            <div className="form-group">
              <label>نام مشتری</label>
              <CustomerSearchSelect
                customers={customers}
                value={form.customer_name || ""}
                onChange={(name) => setForm({ ...form, customer_name: name })}
              />
            </div>

            <div className="form-group">
              <label>اولویت</label>
              <select name="priority" value={form.priority || "عادی"} onChange={handleChange} className="filter-select-pretty">
                <option value="عادی">عادی</option>
                <option value="فوری">فوری</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label>توضیحات سفارش</label>
              <textarea
                name="notes"
                value={form.notes || ""}
                onChange={handleChange}
                placeholder="توضیحات کلی مربوط به سفارش..."
              ></textarea>
            </div>
          </div>

          {/* اقلام سفارش */}
          <div style={{ marginTop: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800" }}>📦 اقلام سفارش</h3>
              <button
                type="button"
                className="save-btn"
                onClick={handleAddItem}
                style={{ padding: "8px 16px", fontSize: "13px" }}
              >
                ➕ افزودن محصول
              </button>
            </div>

            {items.map((item, index) => {
              const filteredProducts = item.category
                ? products.filter((p) => p.category === item.category)
                : []

              return (
                <div
                  key={index}
                  style={{
                    position: "relative",
                    padding: "16px",
                    paddingTop: "28px",
                    marginBottom: "12px",
                    borderRadius: "14px",
                    background: "rgba(248, 250, 252, 0.8)",
                    border: "1px solid rgba(226, 232, 240, 0.6)"
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "14px",
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#6366f1"
                    }}
                  >
                    قلم {index + 1}
                  </div>

                  <div className="form-grid" style={{ marginTop: 0, gap: "14px" }}>
                    <div className="form-group">
                      <label>دسته‌بندی <span style={{ color: "#ef4444" }}>*</span></label>
                      <select
                        value={item.category}
                        onChange={(e) => handleItemChange(index, "category", e.target.value)}
                        className="filter-select-pretty"
                      >
                        <option value="">انتخاب دسته‌بندی</option>
                        {categories && categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>نوع آجر <span style={{ color: "#ef4444" }}>*</span></label>
                      <select
                        value={item.brick_type}
                        onChange={(e) => handleItemChange(index, "brick_type", e.target.value)}
                        disabled={!item.category}
                        className="filter-select-pretty"
                      >
                        <option value="">
                          {item.category ? "انتخاب نوع آجر" : "ابتدا دسته‌بندی را انتخاب کنید"}
                        </option>
                        {filteredProducts.map((product) => (
                          <option key={product.id} value={product.name}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>تعداد <span style={{ color: "#ef4444" }}>*</span></label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                        placeholder="مثلاً 10000"
                        min="1"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>توضیحات قلم</label>
                      <textarea
                        value={item.notes}
                        onChange={(e) => handleItemChange(index, "notes", e.target.value)}
                        placeholder="توضیحات مربوط به این قلم..."
                        style={{ minHeight: "60px" }}
                      ></textarea>
                    </div>
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      className="row-btn delete-btn"
                      onClick={() => handleRemoveItem(index)}
                      title="حذف این قلم"
                      style={{
                        position: "absolute",
                        top: "8px",
                        left: "12px",
                        width: "28px",
                        height: "28px",
                        fontSize: "12px"
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              انصراف
            </button>
            <button type="submit" className="save-btn">
              💾 ذخیره تغییرات
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
function EditCustomerModal({ customer, onClose, onSave, showToast }) {
  const [form, setForm] = useState({ ...customer })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (form.phone && form.phone.length !== 11) {
      showToast("⚠️ شماره تماس باید دقیقاً ۱۱ رقم باشد", "warning")
      return
    }

    try {
      const response = await authFetch(`/api/customers/${customer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })

    const data = await response.json()

if (data.success) {
  showToast("مشتری ویرایش شد", "success")
  onSave()
  onClose()
}
} catch (error) {
  console.error(error)
  showToast("خطا در ویرایش مشتری", "error")
}
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✏️ ویرایش مشتری</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="form-group">
              <label>نام مشتری</label>
              <input type="text" name="name" value={form.name || ""} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>تاریخ ثبت مشتری</label>
              <PersianDateInput
                value={form.register_date || ""}
                onChange={(date) => setForm({ ...form, register_date: date })}
                placeholder="انتخاب تاریخ ثبت"
              />
            </div>

            <div className="form-group">
              <label>شماره تماس</label>
              <input
                type="text"
                name="phone"
                value={form.phone || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 11)
                  setForm({ ...form, phone: value })
                }}
                maxLength={11}
                inputMode="numeric"
                placeholder="۰۹xxxxxxxxx"
              />
              {form.phone && form.phone.length !== 11 && (
                <small style={{
                  color: "#f59e0b",
                  fontSize: "11px",
                  marginTop: "4px",
                  display: "block",
                  fontWeight: "600"
                }}>
                  ⚠️ شماره تماس باید ۱۱ رقم باشد ({form.phone.length}/۱۱)
                </small>
              )}
            </div>
            <div className="form-group">
              <label>نام شرکت یا فروشگاه</label>
              <input type="text" name="company" value={form.company || ""} onChange={handleChange} />
            </div>

            <div className="form-group full-width">
              <label>آدرس</label>
              <input type="text" name="address" value={form.address || ""} onChange={handleChange} />
            </div>

            <div className="form-group full-width">
              <label>توضیحات</label>
              <textarea name="notes" value={form.notes || ""} onChange={handleChange}></textarea>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>انصراف</button>
            <button type="submit" className="save-btn">💾 ذخیره تغییرات</button>
          </div>
        </form>
      </div>
    </div>
  )
}
function EditProductionModal({ production, orders, onClose, onSave, showToast, products, categories }) {
  const [form, setForm] = useState(() => {
    const productInfo = products.find((p) => p.name === production.product_name)
    return {
      ...production,
      category: productInfo?.category || production.category || ""
    }
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const filteredProducts = form.category
    ? products.filter((p) => p.category === form.category)
    : []

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.category || !form.product_name) {
      showToast("⚠️ دسته‌بندی و نوع آجر را انتخاب کنید", "warning")
      return
    }

    try {
      const response = await authFetch(`/api/production/${production.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })

      const data = await response.json()

      if (data.success) {
        showToast("تولید ویرایش شد", "success")
        onSave()
        onClose()
      }
    } catch (error) {
      console.error(error)
      showToast("خطا در ویرایش تولید", "error")
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✏️ ویرایش تولید</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="form-group">
              <label>تاریخ تولید</label>
              <PersianDateInput
                value={form.production_date}
                onChange={(date) => setForm({ ...form, production_date: date })}
                placeholder="انتخاب تاریخ تولید"
              />
            </div>

            <div className="form-group">
              <label>کوره</label>
              <select
                name="kiln"
                value={form.kiln || ""}
                onChange={handleChange}
                className="filter-select-pretty"
              >
                <option value="">انتخاب کوره</option>
                {KILNS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>دسته‌بندی</label>
              <select
                name="category"
                value={form.category || ""}
                onChange={(e) => setForm({
                  ...form,
                  category: e.target.value,
                  product_name: ""
                })}
                className="filter-select-pretty"
              >
                <option value="">انتخاب دسته‌بندی</option>
                {categories && categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>نوع آجر</label>
              <select
                name="product_name"
                value={form.product_name || ""}
                onChange={handleChange}
                disabled={!form.category}
                className="filter-select-pretty"
              >
                <option value="">
                  {form.category ? "انتخاب نوع آجر" : "ابتدا دسته‌بندی را انتخاب کنید"}
                </option>
                {filteredProducts.map((product) => (
                  <option key={product.id} value={product.name}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>مقدار تولید</label>
              <input
                type="number"
                name="quantity"
                value={form.quantity || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>واحد</label>
              <select
                name="unit"
                value={form.unit || "عدد"}
                onChange={handleChange}
                className="filter-select-pretty"
              >
                <option value="عدد">عدد</option>
                <option value="قالب">قالب</option>
                <option value="پالت">پالت</option>
                <option value="کیلوگرم">کیلوگرم</option>
                <option value="تن">تن</option>
                <option value="متر مربع">متر مربع</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label>توضیحات</label>
              <textarea
                name="notes"
                value={form.notes || ""}
                onChange={handleChange}
              ></textarea>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              انصراف
            </button>
            <button type="submit" className="save-btn">
              💾 ذخیره تغییرات
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
/* =========================
   PRODUCTS PAGE
========================= */

function ProductsPage({ products, loadProducts, setEditItem, showToast, setPage, currentUser, handleLogout, darkMode, setDarkMode, categories, loadCategories }) {
  const formRef = useRef(null)

  useEffect(() => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [])

  const [form, setForm] = useState({
    name: "",
    category: "",
    unit: "قالب",
    notes: ""
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [sortOrder, setSortOrder] = useState("newest")

    const [filterCategory, setFilterCategory] = useState("")

  const filteredProducts = products.filter((p) => {
    if (filterCategory && p.category !== filterCategory) return false
    return true
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const dateA = a.created_at || ""
    const dateB = b.created_at || ""
    return sortOrder === "newest"
      ? dateB.localeCompare(dateA)
      : dateA.localeCompare(dateB)
  })

  const totalPages = Math.ceil(sortedProducts.length / perPage)
  const startIndex = (currentPage - 1) * perPage
  const currentProducts = sortedProducts.slice(startIndex, startIndex + perPage)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const [deleteProductId, setDeleteProductId] = useState(null)

  const handleDelete = (id) => {
    setDeleteProductId(id)
  }

  const confirmDeleteProduct = async (reason) => {
    if (!deleteProductId) return

    try {
      const response = await authFetch(`/api/products/${deleteProductId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delete_reason: reason })
      })
      const data = await response.json()

      if (data.success) {
        showToast("محصول به آرشیو منتقل شد", "success")
        setDeleteProductId(null)
        loadProducts()
      }
    } catch (error) {
      console.error(error)
      showToast("خطا در حذف محصول", "error")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateRequiredFields(e.target, showToast)) return

    if (!form.name.trim()) {
  showToast("لطفاً نام محصول را وارد کنید", "warning")
  return
}

  try {
  const response = await authFetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form)
  })

  const data = await response.json()

  if (data.success) {
    showToast("محصول با موفقیت ثبت شد", "success")
        setForm({ name: "", category: "", unit: "قالب", notes: "" })
    loadProducts()
  } else {
    showToast(data.message || "خطا در ثبت محصول", "error")
  }
} catch (error) {
  console.error(error)
  showToast("خطا در ارتباط با سرور", "error")
}
  }

  const [newCategory, setNewCategory] = useState("")
  const [showManageCategories, setShowManageCategories] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editCategoryName, setEditCategoryName] = useState("")
  const [deletingCategory, setDeletingCategory] = useState(null)

  const categoryNames = categories.map((c) => c.name)

  const handleAddCategory = async () => {
    const val = newCategory.trim()
    if (!val) return

    if (categoryNames.includes(val)) {
      showToast("این دسته‌بندی قبلاً وجود داره", "warning")
      return
    }

    try {
      const res = await authFetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: val })
      })
      const data = await res.json()

      if (data.success) {
        showToast("دسته‌بندی اضافه شد", "success")
        setNewCategory("")
        loadCategories()
      } else {
        showToast(data.message || "خطا در افزودن دسته‌بندی", "error")
      }
    } catch (error) {
      console.error(error)
      showToast("خطا در ارتباط با سرور", "error")
    }
  }

  const handleStartEditCategory = (cat) => {
    setEditingCategory(cat.id)
    setEditCategoryName(cat.name)
  }

  const handleSaveEditCategory = async () => {
    const val = editCategoryName.trim()
    if (!val) return

    try {
      const res = await authFetch(`/api/categories/${editingCategory}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: val })
      })
      const data = await res.json()

      if (data.success) {
        showToast("دسته‌بندی ویرایش شد", "success")
        setEditingCategory(null)
        setEditCategoryName("")
        loadCategories()
      } else {
        showToast(data.message || "خطا در ویرایش", "error")
      }
    } catch (error) {
      console.error(error)
      showToast("خطا در ارتباط با سرور", "error")
    }
  }

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return

    try {
      const res = await authFetch(`/api/categories/${deletingCategory.id}`, {
        method: "DELETE"
      })
      const data = await res.json()

      if (data.success) {
        showToast("دسته‌بندی حذف شد", "success")
        setDeletingCategory(null)
        loadCategories()
      } else {
        showToast(data.message || "خطا در حذف", "error")
      }
    } catch (error) {
      console.error(error)
      showToast("خطا در ارتباط با سرور", "error")
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>مدیریت محصولات</h1>
          <p>تعریف و مشاهده محصولات کارخانه</p>
        </div>
              
      </header>

      {/* فرم ثبت محصول جدید */}
      <div className="panel order-form" ref={formRef}>
        <div className="panel-header">
          <h2>ثبت محصول جدید</h2>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
          <div className="form-group">
  <label>نام محصول</label>
  <input
    type="text"
    name="name"
    value={form.name}
    onChange={handleChange}
    placeholder="مثلاً آجر نسوز شاموتی ۱"
    required
  />
</div>

                 <div className="form-group">
              <label>دسته‌بندی</label>

              <div className="cat-row">
                         <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="cat-select filter-select-pretty"
                >
                  <option value="">انتخاب دسته</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>

                             <button
                  type="button"
                  className="cat-manage-btn"
                  onClick={() => setShowManageCategories(true)}
                  title="ویرایش دسته‌بندی‌ها"
                >
                  ✏️ ویرایش دسته‌بندی
                </button>
              </div>
            </div>
                      <div className="form-group">
              <label>واحد</label>
              <select name="unit" value={form.unit} onChange={handleChange}>
                <option value="قالب">قالب</option>
                <option value="عدد">عدد</option>
                <option value="کیلوگرم">کیلوگرم</option>
                <option value="کیسه">کیسه</option>
              </select>
            </div>
            <div className="form-group full-width">
              <label>توضیحات</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="توضیحات مربوط به محصول..."
              ></textarea>
            </div>
          </div>

                  <div className="form-actions">
            <button type="submit" className="save-btn">
              <Save size={16} /> ثبت محصول
            </button>
          </div>
        </form>
      </div>
      {deletingCategory && createPortal(
        <div className="modal-overlay" onClick={() => setDeletingCategory(null)} style={{ zIndex: 9999999 }}>
          <div className="modal-box delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">🗑️</div>
            <h2>حذف دسته‌بندی</h2>
            <p>
              آیا مطمئنی می‌خوای دسته‌بندی <strong>{deletingCategory.name}</strong> رو حذف کنی؟
              <br />
              <strong>این عمل قابل بازگشت نیست.</strong>
            </p>

            <div className="delete-modal-actions">
              <button className="cancel-btn" onClick={() => setDeletingCategory(null)}>
                انصراف
              </button>
              <button className="confirm-delete-btn" onClick={handleConfirmDeleteCategory}>
                🗑️ بله، حذف کن
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {deleteProductId && (
        <DeleteReasonModal
          title="حذف محصول"
          itemName={products.find((p) => p.id === deleteProductId)?.name || ""}
          onConfirm={confirmDeleteProduct}
          onClose={() => setDeleteProductId(null)}
        />
      )}

      {showManageCategories && createPortal(
        <div className="modal-overlay" onClick={() => setShowManageCategories(false)} style={{ zIndex: 999999 }}>
          <div className="modal-box cat-manage-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚙️ مدیریت دسته‌بندی‌ها</h2>
              <button className="modal-close" onClick={() => setShowManageCategories(false)}>✕</button>
            </div>

            <div className="cat-manage-body">
              <div className="cat-manage-list">
                {categories.map((cat) => (
                  <div key={cat.id} className="cat-manage-item">
                    {editingCategory === cat.id ? (
                      <>
                        <input
                          type="text"
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleSaveEditCategory()
                            }
                            if (e.key === "Escape") {
                              setEditingCategory(null)
                              setEditCategoryName("")
                            }
                          }}
                          autoFocus
                          className="cat-edit-input"
                        />
                        <button
                          type="button"
                          className="cat-mini-btn save"
                          onClick={handleSaveEditCategory}
                          title="ذخیره"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          className="cat-mini-btn cancel"
                          onClick={() => {
                            setEditingCategory(null)
                            setEditCategoryName("")
                          }}
                          title="انصراف"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="cat-manage-name">🏷 {cat.name}</span>
                        <button
                          type="button"
                          className="cat-mini-btn edit"
                          onClick={() => handleStartEditCategory(cat)}
                          title="ویرایش"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="cat-mini-btn delete"
                          onClick={() => setDeletingCategory(cat)}
                          title="حذف"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="cat-manage-add">
                <span className="cat-manage-add-label">➕ افزودن دسته‌بندی جدید</span>
                <div className="cat-manage-add-row">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="نام دسته‌بندی..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddCategory()
                      }
                    }}
                    className="cat-add-input"
                  />
                  <button
                    type="button"
                    className="cat-save-btn"
                    onClick={handleAddCategory}
                  >
                    ثبت
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
/* =========================
   PRODUCTS LIST PAGE
========================= */
function ProductsListPage({ products, loadProducts, setEditItem, showToast, setPage, currentUser, handleLogout, darkMode, setDarkMode, categories }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [sortOrder, setSortOrder] = useState("newest")
  const [filterCategory, setFilterCategory] = useState("")
  const [deleteProductId, setDeleteProductId] = useState(null)

  const filteredProducts = products.filter((p) => {
    if (filterCategory && p.category !== filterCategory) return false
    return true
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const dateA = a.created_at || ""
    const dateB = b.created_at || ""
    return sortOrder === "newest"
      ? dateB.localeCompare(dateA)
      : dateA.localeCompare(dateB)
  })

  const totalPages = Math.ceil(sortedProducts.length / perPage)
  const startIndex = (currentPage - 1) * perPage
  const currentProducts = sortedProducts.slice(startIndex, startIndex + perPage)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])

  const handleDelete = (id) => {
    setDeleteProductId(id)
  }

  const confirmDeleteProduct = async (reason) => {
    if (!deleteProductId) return

    try {
      const response = await authFetch(`/api/products/${deleteProductId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delete_reason: reason })
      })
      const data = await response.json()

      if (data.success) {
        showToast("محصول به آرشیو منتقل شد", "success")
        setDeleteProductId(null)
        loadProducts()
      }
    } catch (error) {
      console.error(error)
      showToast("خطا در حذف محصول", "error")
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>گزارش محصولات</h1>
          <p>مشاهده و مدیریت محصولات ثبت‌شده</p>
        </div>
      </header>

      <div className="panel">
        <div className="panel-header">
          <h2>فهرست محصولات</h2>
          <span>{filteredProducts.length} محصول</span>
        </div>

        {/* فیلتر دسته‌بندی */}
        <div className="filter-row" style={{ marginBottom: "16px", justifyContent: "flex-start" }}>
          <div className="filter-item" style={{ flex: "0 0 auto", minWidth: "auto", maxWidth: "220px" }}>
            <span className="filter-label">📁 دسته‌بندی</span>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value)
                setCurrentPage(1)
              }}
              className="filter-select-pretty"
              style={{
                padding: "9px 14px",
                borderRadius: "12px",
                fontFamily: "'Vazirmatn', 'Tahoma', sans-serif",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                width: "200px",
                outline: "none"
              }}
            >
              <option value="">همه دسته‌ها</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <div>📦</div>
            <h3>محصولی پیدا نشد</h3>
            <p>با این فیلتر محصولی وجود نداره.</p>
          </div>
        ) : (
          <>
            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>ردیف</th>
                    <th>نام محصول</th>
                    <th>دسته‌بندی</th>
                    <th>واحد</th>
                    <th>توضیحات</th>
                    <th>عملیات</th>
                  </tr>
                </thead>

                <tbody>
                  {currentProducts.map((product, index) => (
                    <tr key={product.id}>
                      <td>{startIndex + index + 1}</td>
                      <td><span className="customer-name">{product.name}</span></td>
                      <td>
                        <span className="machine-badge">
                          {product.category || "-"}
                        </span>
                      </td>
                      <td>{product.unit || "عدد"}</td>
                      <td>{product.notes || "-"}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="row-btn edit-btn"
                            onClick={() => setEditItem({ ...product, type: "product" })}
                            title="ویرایش"
                          >
                            ✏️
                          </button>
                          <button
                            className="row-btn delete-btn"
                            onClick={() => handleDelete(product.id)}
                            title="حذف"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <TableControls
              totalItems={filteredProducts.length}
              perPage={perPage}
              onPerPageChange={setPerPage}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {deleteProductId && (
        <DeleteReasonModal
          title="حذف محصول"
          itemName={products.find((p) => p.id === deleteProductId)?.name || ""}
          onConfirm={confirmDeleteProduct}
          onClose={() => setDeleteProductId(null)}
        />
      )}
    </>
  )
}

/* =========================
   EDIT PRODUCT MODAL
========================= */
function EditProductModal({ product, onClose, onSave, showToast, categories }) {
  const [form, setForm] = useState({ ...product })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const response = await authFetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })

      const data = await response.json()

      if (data.success) {
  showToast("محصول ویرایش شد", "success")
  onSave()
  onClose()
}
   } catch (error) {
  console.error(error)
  showToast("خطا در ویرایش محصول", "error")
}
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✏️ ویرایش محصول</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="form-group">
              <label>نام محصول</label>
              <input
                type="text"
                name="name"
                value={form.name || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>دسته‌بندی</label>
              <select
                name="category"
                value={form.category || ""}
                onChange={handleChange}
                className="filter-select-pretty"
              >
                <option value="">انتخاب دسته</option>
                {categories && categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

                     <div className="form-group">
              <label>واحد</label>
              <select name="unit" value={form.unit || "قالب"} onChange={handleChange}>
                <option value="قالب">قالب</option>
                <option value="عدد">عدد</option>
                <option value="کیلوگرم">کیلوگرم</option>
                <option value="کیسه">کیسه</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label>توضیحات</label>
              <textarea
                name="notes"
                value={form.notes || ""}
                onChange={handleChange}
              ></textarea>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              انصراف
            </button>
            <button type="submit" className="save-btn">
              💾 ذخیره تغییرات
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
/* =========================
   CUSTOMER REPORT
========================= */

function CustomerReport({ customers, products, currentUser, setPage, handleLogout, darkMode, setDarkMode }) {
  const [report, setReport] = useState([])
  const [filterCustomer, setFilterCustomer] = useState("")
  const [filterFrom, setFilterFrom] = useState("")
  const [filterTo, setFilterTo] = useState("")
  const [loading, setLoading] = useState(false)
  const [expandedCustomer, setExpandedCustomer] = useState(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [sortKey, setSortKey] = useState("customer_name")
  const [sortDir, setSortDir] = useState("asc")

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }
  useEffect(() => {
    setLoading(true)

    const params = new URLSearchParams()
    if (filterCustomer) params.append("customer_name", filterCustomer)
    if (filterFrom) params.append("from_date", filterFrom)
    if (filterTo) params.append("to_date", filterTo)

    authFetch(`/api/customers-report?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setReport(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error("خطا در دریافت گزارش:", error)
        setLoading(false)
      })
  }, [filterCustomer, filterFrom, filterTo])

  const handleClear = () => {
    setFilterCustomer("")
    setFilterFrom("")
    setFilterTo("")
  }

  const toggleExpand = (customerName) => {
    if (expandedCustomer === customerName) {
      setExpandedCustomer(null)
    } else {
      setExpandedCustomer(customerName)
    }
  }

  // پیدا کردن پرتکرارترین محصول برای هر مشتری
  const getTopProduct = (customer) => {
    if (!customer.products || customer.products.length === 0) return "-"
    
    const top = customer.products.reduce((max, product) => {
      return product.count > max.count ? product : max
    }, customer.products[0])
    
    return top.product_name
  }

  const sortedReport = [...report].sort((a, b) => {
    let valA = a[sortKey]
    let valB = b[sortKey]

    if (valA === null || valA === undefined) valA = ""
    if (valB === null || valB === undefined) valB = ""

    if (sortKey === "total_orders" || sortKey === "total_quantity") {
      valA = Number(valA || 0)
      valB = Number(valB || 0)
      return sortDir === "asc" ? valA - valB : valB - valA
    }

    const strA = valA.toString()
    const strB = valB.toString()
    return sortDir === "asc"
      ? strA.localeCompare(strB, "fa")
      : strB.localeCompare(strA, "fa")
  })

  const totalPages = Math.ceil(sortedReport.length / perPage)
  const startIndex = (currentPage - 1) * perPage
  const currentReport = sortedReport.slice(startIndex, startIndex + perPage)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])

  const grandTotalOrders = report.reduce((sum, c) => sum + c.total_orders, 0)
 const grandTotalWeight = report.reduce((sum, c) => sum + (c.total_quantity || 0), 0)

  return (
    <>
      <header className="topbar">
        <div>
          <h1>گزارش سفارشات مشتریان</h1>
          <p>مشاهده سفارشات هر مشتری به تفکیک محصول و تاریخ</p>
        </div>
               
      </header>
  {/* آمار کلی */}
      <section className="stats">
        <div className="stat-card">
          <div className="stat-icon"><Users size={24} /></div>
          <div>
            <span>تعداد مشتریان</span>
            <strong>{report.length}</strong>
            <small>مشتری فعال</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><ClipboardList size={24} /></div>
          <div>
            <span>کل سفارشات</span>
            <strong>{grandTotalOrders}</strong>
            <small>سفارش ثبت شده</small>
          </div>
        </div>

      <div className="stat-card">
  <div className="stat-icon"><BarChart3 size={24} /></div>
  <div>
    <span>جمع کل تعداد</span>
    <strong>{grandTotalWeight.toLocaleString()}</strong>
    <small>عدد</small>
  </div>
</div>
      </section>
                  {/* فیلترها */}
                    <div className="panel" style={{ padding: "15px 20px", marginBottom: "15px", position: "relative", zIndex: 100 }}>
        <div className="panel-header" style={{ marginBottom: "10px", paddingBottom: "10px" }}>
          <h2>🔍 فیلتر گزارش</h2>
        </div>

        <div className="filter-row customer-filter-row">
          <div className="filter-item">
            <span className="filter-label">👤 مشتری</span>
            <CustomerSearchSelect
              customers={customers}
              value={filterCustomer}
              onChange={setFilterCustomer}
            />
          </div>

          <div className="filter-item">
            <span className="filter-label">📅 از تاریخ</span>
            <PersianDateInput
              value={filterFrom}
              onChange={(date) => setFilterFrom(date)}
              placeholder="از تاریخ"
            />
          </div>

          <div className="filter-item">
            <span className="filter-label">📅 تا تاریخ</span>
            <PersianDateInput
              value={filterTo}
              onChange={(date) => setFilterTo(date)}
              placeholder="تا تاریخ"
            />
          </div>

          <button
            type="button"
            className="clear-filter-btn"
            onClick={handleClear}
          >
            🔄 پاک کردن
          </button>
        </div>
      </div>
      
      

    

      {/* جدول */}
           <div className="panel" style={{ position: "relative", zIndex: 1 }}>
        <div className="panel-header">
          <h2>📋 لیست مشتریان</h2>
          <div className="table-actions">
            <span>{report.length} مشتری</span>
            <button
              type="button"
              className="action-btn print-btn"
              onClick={() => printTable("customer-report-print", "گزارش مشتریان")}
            >
              🖨️ چاپ
            </button>
            <button
              type="button"
              className="action-btn excel-btn"
              onClick={() => exportToExcel("customer-report-print", "customer-report")}
            >
              📊 Excel
            </button>
          </div>
        </div>
        {loading ? (
          <div className="empty-state">
            <div>⏳</div>
            <h3>در حال بارگذاری...</h3>
          </div>
        ) : report.length === 0 ? (
          <div className="empty-state">
            <div>📋</div>
            <h3>سفارشی برای نمایش وجود ندارد</h3>
            <p>با این فیلترها سفارشی پیدا نشد.</p>
          </div>
        ) : (
          <>
             <div className="orders-table-wrapper">
              <table className="orders-table" id="customer-report-print">
                 <thead>
                  <tr>
                    <th>ردیف</th>
                    <SortableHeader label="نام مشتری" sortKey="customer_name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="تعداد دفعات سفارش" sortKey="total_orders" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="تعداد کل سفارشات" sortKey="total_quantity" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <th>بیشترین سفارش</th>
                    <th>جزئیات</th>
                  </tr>
                </thead>
                <tbody>
                  {currentReport.map((customer, index) => (
                    <>
                      <tr key={customer.customer_name}>
                        <td>
                          <span className="row-number">
                            {startIndex + index + 1}
                          </span>
                        </td>
                        <td>
                          <span className="customer-name">
                            {customer.customer_name}
                          </span>
                        </td>
                        <td>
                          <span className="weight-badge">
                            {customer.total_orders} بار
                          </span>
                        </td>
                        <td>
  <span className="weight-badge">
    {(customer.total_quantity || 0).toLocaleString()} عدد
  </span>
</td>
                        <td>
                          <span className="machine-badge">
                            {getTopProduct(customer)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="details-btn"
                            onClick={() => toggleExpand(customer.customer_name)}
                          >
                            📋 جزئیات
                          </button>
                        </td>
                      </tr>

                      {/* سفارشات بازشده */}
                      {expandedCustomer === customer.customer_name && (
                        <tr className="expanded-row">
                          <td colSpan="6">
                            <div className="customer-details-expanded">
                              <h4>📦 سفارشات {customer.customer_name}:</h4>

                              <div className="product-report-list">
                                {customer.products.map((product) => (
                                  <div className="product-report-item" key={product.product_name}>
                                    <div className="product-report-header">
                                      <span className="product-name-badge">
                                        🧱 {product.product_name}
                                      </span>
                                    <span className="product-stats">
  <strong>{product.count}</strong> بار سفارش |
  <strong> {(product.total_quantity || 0).toLocaleString()}</strong> عدد
</span>
                                    </div>

                                          <table className="mini-table">
                                      <thead>
                                        <tr>
                                          <th>تاریخ</th>
                                          <th>سفارش</th>
                                          <th>خروجی</th>
                                          <th>بار اضافه</th>
                                          <th>باقی‌مانده</th>
                                          <th>اولویت</th>
                                          <th>وضعیت خروجی</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {product.orders.map((o) => (
                                                               <tr key={o.id} className={o.hasRejected ? "rejected-order-row" : ""}>
                                            <td>{toPersianDate(o.date)}</td>
                                            <td>{Number(o.quantity).toLocaleString()} عدد</td>
                                            <td style={{ color: "#047857", fontWeight: "700" }}>{Number(o.shipped_quantity || 0).toLocaleString()}</td>
                                            <td style={{ color: Number(o.extra_quantity || 0) > 0 ? "#d97706" : "#94a3b8", fontWeight: "700" }}>
                                              {Number(o.extra_quantity || 0) > 0 ? `🎁 ${Number(o.extra_quantity || 0).toLocaleString()}` : "-"}
                                            </td>
                                            <td style={{ color: o.quantity - Number(o.shipped_quantity || 0) > 0 ? "#c2410c" : "#10b981", fontWeight: "700" }}>
                                              {Math.max(0, Number(o.quantity || 0) - Number(o.shipped_quantity || 0)).toLocaleString()}
                                            </td>
                                            <td>
                                              <span className={o.priority === "فوری" ? "priority-urgent" : "priority-normal"}>
                                                {o.priority}
                                              </span>
                                            </td>
                                            <td>
                                              {o.hasRejected ? (
                                                <span className="rejected-badge" title={o.rejectedReason || ""}>
                                                  ❌ خروجی رد شده
                                                </span>
                                              ) : o.exitsCount === 0 ? (
                                                <span className="pending-badge">
                                                  ⏳ بدون خروجی
                                                </span>
                                              ) : (
                                                <span className="approved-badge">
                                                  ✅ خروجی ثبت شده
                                                </span>
                                              )}
                                              {o.hasRejected && o.rejectedReason && (
                                                <div className="reject-reason-text">
                                                  دلیل: {o.rejectedReason}
                                                </div>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            <TableControls
              totalItems={report.length}
              perPage={perPage}
              onPerPageChange={setPerPage}
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </>
  )
}
/* =========================
   CUSTOMER SEARCH SELECT
========================= */

function CustomerSearchSelect({ customers, value, onChange }) {
  const [search, setSearch] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

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

  const filteredCustomers = customers
    ? customers.filter((c) =>
        c.name?.toLowerCase().includes(search.toLowerCase())
      )
    : []

  const handleSelect = (name) => {
    onChange(name)
    setSearch("")
    setIsOpen(false)
  }

  return (
    <div className="search-select-wrapper" ref={containerRef}>
      <div
        className={`search-select-input ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {value ? (
          <div className="selected-value">
            <span className="chip-avatar">{value.charAt(0)}</span>
            <span>{value}</span>
            <button
              type="button"
              className="clear-selected"
              onClick={(e) => {
                e.stopPropagation()
                onChange("")
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <span className="placeholder-text">
            👤 انتخاب مشتری...
          </span>
        )}
        <span className="dropdown-arrow">{isOpen ? "▲" : "▼"}</span>
      </div>

      {isOpen && (
        <div className="search-select-dropdown">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="جستجوی مشتری..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>

          <div className="search-results">
            <div
              className={`search-result-item ${!value ? "active" : ""}`}
              onClick={() => handleSelect("")}
            >
              <span className="chip-avatar all">👥</span>
              <span>همه مشتریان</span>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="no-result">
                🔍 مشتری‌ای با این نام پیدا نشد
              </div>
            ) : (
              filteredCustomers.map((c) => (
                <div
                  key={c.id}
                  className={`search-result-item ${value === c.name ? "active" : ""}`}
                  onClick={() => handleSelect(c.name)}
                >
                  <span className="chip-avatar">{c.name.charAt(0)}</span>
                  <div className="customer-info">
                    <span className="customer-name-result">{c.name}</span>
                    {c.company && (
                      <span className="customer-company">{c.company}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
/* =========================
   PAGINATION COMPONENT
========================= */

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const getPages = () => {
    const pages = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push("...")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push("...")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push("...")
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="pagination-wrapper">
      <button
        className="pagination-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        › قبلی
      </button>

      {getPages().map((page, i) => (
        <button
          key={i}
          className={`pagination-btn ${page === currentPage ? "active" : ""} ${page === "..." ? "dots" : ""}`}
          onClick={() => typeof page === "number" && onPageChange(page)}
          disabled={page === "..."}
        >
          {page}
        </button>
      ))}

      <button
        className="pagination-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        بعدی ‹
      </button>
    </div>
  )
}
/* =========================
   SORTABLE HEADER (هدر قابل سورت)
========================= */
function SortableHeader({ label, sortKey, currentSort, currentDir, onSort }) {
  const isActive = currentSort === sortKey

  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{ cursor: "pointer", userSelect: "none" }}
      title={`سورت بر اساس ${label}`}
    >
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px"
      }}>
        <span>{label}</span>
        <span style={{
          fontSize: "11px",
          color: isActive ? "#fbbf24" : "#94a3b8",
          transition: "all 0.2s ease",
          transform: isActive && currentDir === "asc" ? "rotate(180deg)" : "rotate(0deg)"
        }}>
          {isActive ? "▼" : "▾"}
        </span>
      </div>
    </th>
  )
}
/* =========================
   TABLE CONTROLS
========================= */
function TableControls({
  totalItems,
  perPage,
  onPerPageChange
}) {
  return (
    <div className="table-controls">
      <div className="control-group">
        <span className="control-label">📊 نمایش:</span>
        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="control-select"
        >
          <option value={10}>۱۰</option>
          <option value={20}>۲۰</option>
          <option value={30}>۳۰</option>
          <option value={50}>۵۰</option>
          <option value={100}>۱۰۰</option>
        </select>
        <span className="control-label">رکورد در هر صفحه</span>
      </div>

      <div className="control-group">
        <span className="control-label">🔢 کل:</span>
        <strong className="total-count">{totalItems}</strong>
        <span className="control-label">رکورد</span>
      </div>
    </div>
  )
}
/* =========================
   TOAST NOTIFICATION
========================= */

function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onClose])

  const icons = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️"
  }

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>✕</button>
    </div>
  )
}

/* =========================
   TOAST CONTAINER
========================= */

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}
/* =========================
   USE TOAST HOOK
========================= */

/* =========================
   اعتبارسنجی خودکار فیلدهای اجباری
========================= */
function validateRequiredFields(formEl, showToast) {
  const requiredEls = formEl.querySelectorAll("[required]")
  let hasError = false
  let firstError = null

  requiredEls.forEach((el) => {
    el.classList.remove("input-empty-error")

    const val = el.value
    if (!val || !val.toString().trim()) {
      el.classList.add("input-empty-error")
      hasError = true
      if (!firstError) firstError = el
    }
  })

  if (hasError) {
    showToast("⚠️ لطفاً همه فیلدهای ضروری را کامل پر کنید", "warning")
    if (firstError) {
      firstError.scrollIntoView({ behavior: "smooth", block: "center" })
      setTimeout(() => firstError.focus(), 300)
    }
  }

  return !hasError
}

function clearEmptyErrors(formEl) {
  if (!formEl) return
  formEl.querySelectorAll(".input-empty-error").forEach((el) => {
    el.classList.remove("input-empty-error")
  })
}
/* =========================
   LOGIN PAGE
========================= */

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!username || !password) {
      setError("نام کاربری و رمز عبور را وارد کنید")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (data.success) {
        onLogin(data.user, data.token)
      } else {
        setError(data.message || "نام کاربری یا رمز عبور اشتباه است")
      }
    } catch (error) {
      console.error(error)
      setError("خطا در ارتباط با سرور")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page-modern">
      {/* حباب‌های شناور */}
      <div className="login-bubble bubble-1"></div>
      <div className="login-bubble bubble-2"></div>
      <div className="login-bubble bubble-3"></div>
      <div className="login-bubble bubble-4"></div>
      <div className="login-bubble bubble-5"></div>

      {/* ستاره‌های چشمک‌زن */}
      <div className="login-star star-1">✦</div>
      <div className="login-star star-2">✧</div>
      <div className="login-star star-3">✦</div>
      <div className="login-star star-4">✧</div>
      <div className="login-star star-5">✦</div>

      <div className="login-card-modern">
        {/* لوگو */}
        <div className="login-logo-wrapper">
          <div className="login-logo-glow"></div>
          <img src="/logo.jpg" alt="آجر نسوز و نما" className="login-logo-modern" />
        </div>

        <h1 className="login-title-modern">خوش آمدید</h1>
        <p className="login-subtitle-modern">
          سیستم مدیریت تولید و فروش آجر نسوز محراب
        </p>

        <form className="login-form-modern" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error-modern">
              <span>⚠️</span>
              {error}
            </div>
          )}

          <div className="login-input-group">
            <label>نام کاربری</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">👤</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="نام کاربری خود را وارد کنید"
                autoFocus
                disabled={loading}
              />
            </div>
          </div>

          <div className="login-input-group">
            <label>رمز عبور</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبور خود را وارد کنید"
                disabled={loading}
              />
              <button
                type="button"
                className="login-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-btn-modern"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="login-spinner"></span>
                در حال ورود...
              </>
            ) : (
              <>
                <span>🚀</span>
                ورود به سیستم
              </>
            )}
          </button>
        </form>

        <div className="login-footer-modern">
          <div className="login-footer-line"></div>
                    <p>نوشته شده توسط SR • 2026</p>
          <div className="login-footer-line"></div>
        </div>
      </div>
    </div>
  )
}
/* =========================
   USERS PAGE
========================= */

function UsersPage({ currentUser, showToast, setPage, handleLogout, darkMode, setDarkMode }) {
  const [users, setUsers] = useState([])
  const [fieldErrors, setFieldErrors] = useState({})
  const [form, setForm] = useState({
    username: "",
    password: "",
    full_name: "",
    role: "office",
    is_active: 1
  })
  const [editUser, setEditUser] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const loadUsers = () => {
    authFetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((error) => console.error("خطا در دریافت کاربران:", error))
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target

    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: "" })
    }

    if (name === "username") {
      setForm({ ...form, username: value.toLowerCase().replace(/[^a-z0-9_]/g, "") })
      return
    }

    if (name === "password") {
      setForm({ ...form, password: value.replace(/[^a-zA-Z0-9]/g, "") })
      return
    }

    setForm({ ...form, [name]: value })
  }

  const validateUserForm = () => {
    const errors = {}

    if (!form.full_name || !form.full_name.trim()) errors.full_name = "نام و نام خانوادگی نمی‌تونه خالی باشه"
    if (!form.username.trim()) errors.username = "نام کاربری نمی‌تونه خالی باشه"
    if (!form.password.trim()) errors.password = "رمز عبور نمی‌تونه خالی باشه"

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      showToast("لطفاً اطلاعات لازم را کامل پر کنید", "warning")
      return false
    }

    setFieldErrors({})
    if (!/^[a-z][a-z0-9_]*$/.test(form.username)) {
      showToast("نام کاربری باید فقط با حروف کوچیک انگلیسی، عدد یا _ باشه", "warning")
      return false
    }

    if (form.username.length < 3) {
      showToast("نام کاربری باید حداقل ۳ کاراکتر باشه", "warning")
      return false
    }

    if (form.password.length < 6) {
      showToast("رمز عبور باید حداقل ۶ کاراکتر باشه", "warning")
      return false
    }

    if (!/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      showToast("رمز عبور باید شامل حروف انگلیسی و عدد باشه", "warning")
      return false
    }

    return true
  }

   const handleSubmit = async (e) => {
    e.preventDefault()

    clearEmptyErrors(e.target)

    if (!validateRequiredFields(e.target, showToast)) return

    if (!validateUserForm()) return
    try {
      const response = await authFetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })

      const data = await response.json()

       if (data.success) {
        showToast("کاربر با موفقیت ثبت شد", "success")
        setForm({ username: "", password: "", full_name: "", role: "office", is_active: 1 })
        setFieldErrors({})
        loadUsers()
      }
       else {
        showToast(data.message || "خطا در ثبت کاربر", "error")
      }
    } catch (error) {
      console.error(error)
      showToast("خطا در ارتباط با سرور", "error")
    }
  }

  const handleDelete = (id) => {
  setDeleteConfirm(id)
}

const confirmDelete = async () => {
  if (!deleteConfirm) return

  try {
    const response = await authFetch(`/api/users/${deleteConfirm}`, {
      method: "DELETE"
    })
    const data = await response.json()

    if (data.success) {
      showToast("کاربر حذف شد", "success")
      loadUsers()
    } else {
      showToast(data.message || "خطا در حذف", "error")
    }
  } catch (error) {
    console.error(error)
    showToast("خطا در حذف کاربر", "error")
  } finally {
    setDeleteConfirm(null)
  }
}

  const handleEdit = (user) => {
    setEditUser(user)
    setForm({
      username: user.username,
      password: "",
      full_name: user.full_name || "",
      role: user.role || "office",
      is_active: user.is_active
    })

    // اسکرول به بالای صفحه
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }, 50)
  }

const handleUpdate = async (e) => {
  e.preventDefault()

  if (!editUser) return

  const missing = []

  if (!form.full_name || !form.full_name.trim()) missing.push("نام و نام خانوادگی")
  if (!form.username.trim()) missing.push("نام کاربری")
  if (!form.password.trim()) missing.push("رمز عبور (برای تأیید تغییرات)")

  if (missing.length > 0) {
    showToast("⚠️ لطفاً اطلاعات لازم را کامل پر کنید: " + missing.join("، "), "warning")
    return
  }

  if (!/^[a-z][a-z0-9_]*$/.test(form.username)) {
    showToast("⚠️ نام کاربری فقط با حروف کوچک انگلیسی، عدد یا _", "warning")
    return
  }

  if (form.username.length < 3) {
    showToast("⚠️ نام کاربری حداقل ۳ کاراکتر باشد", "warning")
    return
  }

  if (form.password.length < 6) {
    showToast("⚠️ رمز عبور حداقل ۶ کاراکتر باشد", "warning")
    return
  }

  if (!/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
    showToast("⚠️ رمز عبور شامل حروف انگلیسی و عدد باشد", "warning")
    return
  }

  try {
    const response = await authFetch(`/api/users/${editUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.username,
        password: form.password,
        full_name: form.full_name,
        role: form.role,
        is_active: form.is_active
      })
    })

    const data = await response.json()

    if (data.success) {
      showToast("کاربر ویرایش شد", "success")

      // اگه کاربر خودش رو ویرایش کرد، sessionStorage رو آپدیت کن
      if (editUser.id === currentUser?.id) {
        const updatedUser = {
          ...currentUser,
          username: form.username,
          full_name: form.full_name,
          role: form.role
        }
        sessionStorage.setItem("elena_user", JSON.stringify(updatedUser))
      }

      setEditUser(null)
      setForm({ username: "", password: "", full_name: "", role: "office" })
      loadUsers()
    } else {
      showToast(data.message || "خطا در ویرایش", "error")
    }
  } catch (error) {
    console.error(error)
    showToast("خطا در ویرایش کاربر", "error")
  }
}

  const handleCancelEdit = () => {
    setEditUser(null)
    setForm({ username: "", password: "", full_name: "", role: "office" })

    // اسکرول به بالای صفحه
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }, 50)
  }
  const getRoleBadgeClass = (role) => {
    if (role === "admin") return "role-admin"
    if (role === "office") return "role-tehran"
    if (role === "factory") return "role-factory"
    if (role === "finance") return "role-tehran"
    return "role-viewer"
  }
  const roles = [
    { value: "admin", label: "👑 مدیر سیستم" },
    { value: "office", label: "💼 مسئول فروش" },
    { value: "finance", label: "💰 امور مالی" },
    { value: "production", label: "🏭 مسئول تولید" }
  ]

  return (
    <>
      <header className="topbar">
        <div>
          <h1>مدیریت کاربران</h1>
          <p>تعریف کاربران و تعیین سطح دسترسی</p>
        </div>
              
      </header>

      {/* فرم */}
      <div className="panel order-form">
        <div className="panel-header">
          <h2>{editUser ? "✏️ ویرایش کاربر" : "➕ ثبت کاربر جدید"}</h2>
        </div>

                        <form onSubmit={editUser ? handleUpdate : handleSubmit} key={editUser ? editUser.id : "new"} noValidate>
          <div className="form-grid">
                          <div className="form-group">
              <label>نام کاربری <span style={{ color: "#ef4444" }}>*</span></label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="فقط حروف کوچیک انگلیسی، عدد، _"
                dir="ltr"
                className={fieldErrors.username ? "input-error" : ""}
              />
              {fieldErrors.username && (
                <div className="field-error-message">
                  <span>⚠️</span>
                  <span>{fieldErrors.username}</span>
                </div>
              )}
              {!fieldErrors.username && form.username && !/^[a-z][a-z0-9_]*$/.test(form.username) && (
                <div className="field-error-message">
                  <span>⚠️</span>
                  <span>فقط حروف کوچیک انگلیسی، عدد یا _ (اولش حرف)</span>
                </div>
              )}
              {!fieldErrors.username && form.username && form.username.length > 0 && form.username.length < 3 && (
                <div className="field-error-message">
                  <span>⚠️</span>
                  <span>حداقل ۳ کاراکتر</span>
                </div>
              )}
            </div>

               <div className="form-group">
              <label>
                رمز عبور <span style={{ color: "#ef4444" }}>*</span> {editUser && "(برای تأیید تغییرات الزامیه)"}
              </label>
              <input
                type="text"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="حداقل ۶ کاراکتر شامل حرف و عدد"
                dir="ltr"
                className={fieldErrors.password ? "input-error" : ""}
              />
              {fieldErrors.password && (
                <div className="field-error-message">
                  <span>⚠️</span>
                  <span>{fieldErrors.password}</span>
                </div>
              )}
              {!fieldErrors.password && form.password && form.password.length < 6 && (
                <div className="field-error-message">
                  <span>⚠️</span>
                  <span>حداقل ۶ کاراکتر ({form.password.length}/۶)</span>
                </div>
              )}
              {!fieldErrors.password && form.password && form.password.length >= 6 && (!/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password)) && (
                <div className="field-error-message">
                  <span>⚠️</span>
                  <span>باید شامل حروف انگلیسی و عدد باشه</span>
                </div>
              )}
            </div>
                    <div className="form-group">
              <label>نام و نام خانوادگی {!editUser && <span style={{ color: "#ef4444" }}>*</span>}</label>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="مثلاً علی احمدی"
                className={fieldErrors.full_name ? "input-error" : ""}
              />
              {fieldErrors.full_name && (
                <div className="field-error-message">
                  <span>⚠️</span>
                  <span>{fieldErrors.full_name}</span>
                </div>
              )}
            </div>
               <div className="form-group">
              <label>سطح دسترسی</label>
              <select name="role" value={form.role} onChange={handleChange}>
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>وضعیت</label>
              <select name="is_active" value={form.is_active} onChange={(e) => setForm({ ...form, is_active: Number(e.target.value) })}>
                <option value={1}>✅ فعال</option>
                <option value={0}>❌ غیرفعال</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            {editUser && (
              <button
                type="button"
                className="cancel-btn"
                onClick={handleCancelEdit}
              >
                انصراف
              </button>
            )}
            <button type="submit" className="save-btn">
              <Save size={16} /> {editUser ? "ذخیره تغییرات" : "ثبت کاربر"}
            </button>
          </div>
        </form>
      </div>

      {/* لیست کاربران */}
      <div className="panel">
        <div className="panel-header">
          <h2>فهرست کاربران</h2>
          <span>{users.length} کاربر</span>
        </div>

        {users.length === 0 ? (
          <div className="empty-state">
            <div>👤</div>
            <h3>هنوز کاربری ثبت نشده</h3>
          </div>
        ) : (
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>ردیف</th>
                  <th>نام کاربری</th>
                  <th>نام کامل</th>
                  <th>سطح دسترسی</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.id}>
                    <td>{index + 1}</td>
                    <td>
                      <span className="customer-name">
                        {user.username === "admin" && "👑 "}
                        {user.username}
                      </span>
                    </td>
                    <td>{user.full_name || "-"}</td>
                    <td>
                      <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                        {getRoleName(user.role)}
                      </span>
                    </td>
                    <td>
                      <span className={user.is_active ? "priority-normal" : "priority-urgent"}>
                        {user.is_active ? "✅ فعال" : "❌ غیرفعال"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="row-btn edit-btn"
                          onClick={() => handleEdit(user)}
                          title="ویرایش"
                        >
                          ✏️
                        </button>
                        {user.username !== "admin" && (
                          <button
                            className="row-btn delete-btn"
                            onClick={() => handleDelete(user.id)}
                            title="حذف"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* مودال تأیید حذف */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">🗑️</div>
            <h2>حذف کاربر</h2>
            <p>
              آیا مطمئنی می‌خوای این کاربر رو حذف کنی؟
              <br />
              <strong>این عمل قابل بازگشت نیست.</strong>
            </p>

            <div className="delete-modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setDeleteConfirm(null)}
              >
                انصراف
              </button>
              <button
                className="confirm-delete-btn"
                onClick={confirmDelete}
              >
                🗑️ بله، حذف کن
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
/* =========================
   SHIPMENT CREATE (ثبت خروجی جدید)
========================= */

function ShipmentCreate({ customers, products, categories, exits, loadExits, ordersNotShipped, loadOrdersNotShipped, loadOrders, currentUser, showToast, setPage, handleLogout, darkMode, setDarkMode }) {
  const [form, setForm] = useState({
    customer_name: "",
    exit_date: "",
    category: "",
    product_name: "",
    quantity: "",
    unit: "عدد",
    order_id: "",
    notes: "",
    driver_name: "",
    driver_phone: "",
    vehicle_plate: "",
    vehicle_type: ""
  })

  const [selectedOrder, setSelectedOrder] = useState(null)
    const [selectedItems, setSelectedItems] = useState([])
      const [platePart1, setPlatePart1] = useState("")
  const [platePart2, setPlatePart2] = useState("")
  const [platePart3, setPlatePart3] = useState("")
  const [plateCity, setPlateCity] = useState("")
  const [showOrderPicker, setShowOrderPicker] = useState(true)
  const [orderSearchInput, setOrderSearchInput] = useState("")
  const [orderSearchTerm, setOrderSearchTerm] = useState("")
  const [orderPickerPage, setOrderPickerPage] = useState(1)
  const [orderPickerPerPage] = useState(20)
  const [showRejectReason, setShowRejectReason] = useState(null)
  const [isExtra, setIsExtra] = useState(false)
  const [showShortageConfirm, setShowShortageConfirm] = useState(false)
  const [showExtraConfirm, setShowExtraConfirm] = useState(false)
  const [shortageReason, setShortageReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const applyOrderSearch = () => {
    setOrderSearchTerm(orderSearchInput)
    setOrderPickerPage(1)
  }

  const filteredOrderPicker = ordersNotShipped.filter((o) => {
    if (!orderSearchTerm) return true
    const term = orderSearchTerm.toLowerCase()
    const matchCustomer = o.customer_name?.toLowerCase().includes(term)
    const matchDate = o.order_date?.includes(term)
    
    // چک کردن همه اقلام
    const matchProduct = o.items?.some(item => 
      item.brick_type?.toLowerCase().includes(term)
    ) || o.brick_type?.toLowerCase().includes(term)

    return matchCustomer || matchProduct || matchDate
  })

  const totalOrderPickerPages = Math.ceil(filteredOrderPicker.length / orderPickerPerPage)
  const startOrderPickerIndex = (orderPickerPage - 1) * orderPickerPerPage
  const currentOrderPicker = filteredOrderPicker.slice(
    startOrderPickerIndex,
    startOrderPickerIndex + orderPickerPerPage
  )

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (submitting) return
    setSubmitting(true)

    if (!form.order_id) {
      setSubmitting(false)
      showToast("⚠️ ابتدا باید یک سفارش انتخاب کنید", "warning")
      return
    }

    if (!form.exit_date) {
      setSubmitting(false)
      showToast("⚠️ تاریخ خروج را انتخاب کنید", "warning")
      return
    }

    if (selectedOrder?.order_date && form.exit_date < selectedOrder.order_date) {
      setSubmitting(false)
      showToast(`⚠️ تاریخ خروج نمی‌تواند قبل از تاریخ سفارش (${toPersianDate(selectedOrder.order_date)}) باشد`, "warning")
      return
    }
    
    if (!form.driver_name || !form.driver_name.trim()) {
      setSubmitting(false)
      showToast("⚠️ نام و نام خانوادگی راننده را وارد کنید", "warning")
      return
    }

    if (!form.driver_phone || form.driver_phone.length !== 11) {
      setSubmitting(false)
      showToast("⚠️ شماره تماس راننده باید ۱۱ رقم باشد", "warning")
      return
    }

    if (!form.vehicle_plate || !form.vehicle_plate.trim()) {
      setSubmitting(false)
      showToast("⚠️ شماره پلاک خودرو را وارد کنید", "warning")
      return
    }

    if (!platePart1 || platePart1.length !== 2) {
      setSubmitting(false)
      showToast("⚠️ بخش اول شماره پلاک باید دقیقاً ۲ رقم باشد", "warning")
      return
    }

    if (!platePart3 || platePart3.length !== 3) {
      setSubmitting(false)
      showToast("⚠️ بخش دوم شماره پلاک باید دقیقاً ۳ رقم باشد", "warning")
      return
    }

    if (!platePart2 || !platePart2.trim()) {
      setSubmitting(false)
      showToast("⚠️ حرف شماره پلاک را انتخاب کنید", "warning")
      return
    }

    if (!plateCity || plateCity.length !== 2) {
      setSubmitting(false)
      showToast("⚠️ کد شهر شماره پلاک باید دقیقاً ۲ رقم باشد", "warning")
      return
    }

    if (!form.vehicle_type || !form.vehicle_type.trim()) {
      setSubmitting(false)
      showToast("⚠️ نوع خودرو را انتخاب کنید", "warning")
      return
    }
    // فیلتر کردن محصولاتی که مقدار خروجی براشون وارد شده
    const itemsToSubmit = selectedItems
      .map(item => ({
        ...item,
        finalExitQty: item.exitQuantity !== undefined ? Number(item.exitQuantity) : Math.max(0, Number(item.quantity || 0) - Number(item.shipped_quantity || 0))
      }))
      .filter(item => item.finalExitQty > 0)

    if (itemsToSubmit.length === 0) {
      setSubmitting(false)
      showToast("⚠️ مقدار خروجی برای هیچ محصولی وارد نشده است", "warning")
      return
    }

    let successCount = 0
    let hasError = false

    // حلقه برای ثبت تک تک محصولات
    for (const item of itemsToSubmit) {
      const maxRemaining = Math.max(0, Number(item.quantity || 0) - Number(item.shipped_quantity || 0))
      const isExtraFlag = item.finalExitQty > maxRemaining
      const productInfo = products.find((p) => p.name === item.brick_type)
      const category = productInfo?.category || item.category || ""

      try {
        const response = await authFetch("/api/exits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            ...form,
            category: category,
            product_name: item.brick_type,
            quantity: item.finalExitQty,
            is_extra: isExtraFlag,
            close_order: false,
            shortage_reason: "ارسال کامل"
          })
        })
        const data = await response.json()
        if (data.success) {
          successCount++
        } else {
          hasError = true
          console.error("❌ خطای سرور برای محصول", item.brick_type, ":", data.message)
        }
      } catch (error) {
        hasError = true
      }
    }

    setSubmitting(false)

    if (successCount > 0) {
      // =========================
      // بستن سفارش حالا سمت سرور انجام می‌شه
      // (سرور بعد از هر خروجی خودش چک می‌کنه و اگه کامل شد، می‌بنده)
      // =========================

      showToast(`${successCount} محصول با موفقیت به خروجی اضافه شد`, "success")
      setForm({
        customer_name: "",
        exit_date: "",
        category: "",
        product_name: "",
        quantity: "",
        unit: "عدد",
        order_id: "",
        notes: "",
        driver_name: "",
        driver_phone: "",
        vehicle_plate: "",
        vehicle_type: ""
      })
      setSelectedOrder(null)
      setSelectedItems([]) // پاک کردن لیست
      setShowOrderPicker(true)
            setPlatePart1("")
      setPlatePart2("")
      setPlatePart3("")
      setPlateCity("")
      loadExits()
      loadOrdersNotShipped()
      if (loadOrders) loadOrders()
    } else if (hasError) {
      showToast("خطا در ثبت برخی محصولات", "error")
    }
  }

  // تابع مجزا برای ثبت نهایی
  const submitExit = async (exitQty, remaining, extraFlag = false, closeOrderFlag = false, finalShortageReason = null) => {
    try {
      const response = await authFetch("/api/exits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...form, 
          is_extra: extraFlag || isExtra,
          close_order: closeOrderFlag,
          shortage_reason: finalShortageReason
        })
      })
      const data = await response.json()
      if (data.success) {
        showToast("خروجی با موفقیت ثبت شد", "success")
        setForm({
          customer_name: "",
          exit_date: "",
          category: "",
          product_name: "",
          quantity: "",
          unit: "عدد",
          order_id: "",
          notes: "",
          driver_name: "",
          driver_phone: "",
          vehicle_plate: "",
          vehicle_type: ""
        })
        setSelectedOrder(null)
        setShowOrderPicker(true)
        setShowShortageConfirm(false)
        setShortageReason("")
        loadExits()
        loadOrdersNotShipped()
        if (loadOrders) loadOrders()
      } else {
        showToast(data.message || "خطا در ثبت", "error")
      }
    } catch (error) {
      console.error(error)
      showToast("خطا در ارتباط با سرور", "error")
    }
  }

  // تابع وقتی کاربر تایید می‌کند که باقی‌مانده در سفارش بعدی ارسال شود
  const handleConfirmShortage = () => {
    if (!shortageReason.trim()) {
      showToast("⚠️ لطفاً علت کم ارسال کردن را وارد کنید", "warning")
      return
    }

    const exitQty = Number(form.quantity || 0)
    const remaining = Number(selectedOrder.quantity || 0) - Number(selectedOrder.shipped_quantity || 0)
    
    // ثبت با پرچم بستن سفارش و ارسال علت
    submitExit(exitQty, remaining, false, true, shortageReason.trim())
  }
  // تابع وقتی کاربر می‌گوید خیر، همینطور ثبت کن (بدون بستن سفارش)
  const handleRejectShortage = () => {
    if (!shortageReason.trim()) {
      showToast("⚠️ لطفاً علت کم ارسال کردن را وارد کنید", "warning")
      return
    }

    const exitQty = Number(form.quantity || 0)
    const remaining = Number(selectedOrder.quantity || 0) - Number(selectedOrder.shipped_quantity || 0)
    
    // ثبت با پرچم باز ماندن سفارش و ارسال علت
    submitExit(exitQty, remaining, false, false, shortageReason.trim())
  }

  const handlePickOrder = (order, itemsArray) => {
    const initialItems = itemsArray.map(item => ({
      ...item,
      exitQuantity: Math.max(0, Number(item.quantity || 0) - Number(item.shipped_quantity || 0))
    }))
    setSelectedItems(initialItems)

    const firstItem = itemsArray[0]
    const productInfo = products.find((p) => p.name === firstItem.brick_type)

    // تشخیص هوشمند دسته‌بندی
    let resolvedCategory = productInfo?.category || firstItem.category || ""

    if (!resolvedCategory && firstItem.brick_type) {
      const bt = firstItem.brick_type
      if (bt.includes("شاموت") || bt.includes("شومینه") || bt.includes("رومی") || bt.includes("هلالی") || bt.includes("ال گرد") || bt.includes("ال تیز") || bt.includes("پلاک")) {
        resolvedCategory = "آجرهای نسوز شاموت"
      } else if (bt.includes("سمیرم")) {
        resolvedCategory = "آجرهای نسوز سمیرم"
      } else {
        resolvedCategory = "آجرهای صنعتی"
      }
    }

    setSelectedOrder(order)
    setForm({
      customer_name: order.customer_name || "",
      exit_date: "",
      category: resolvedCategory,
      product_name: firstItem.brick_type || "",
      quantity: "",
      unit: "عدد",
      order_id: order.id,
      notes: ""
    })

    setShowOrderPicker(false)
    showToast("سفارش انتخاب شد", "success")
  }

  const handleClearOrder = () => {
    setSelectedOrder(null)
    setForm({
      customer_name: "",
      exit_date: "",
      category: "",
      product_name: "",
      quantity: "",
      unit: "عدد",
      order_id: "",
      notes: "",
      driver_name: "",
      driver_phone: "",
      vehicle_plate: "",
      vehicle_type: ""
    })
    setShowOrderPicker(true)
  }
  // پیدا کردن آیتم فعلی از روی سفارش انتخاب شده
  const currentItem = selectedOrder?.items?.find(i => i.brick_type === form.product_name)
  
  const remainingOfSelected = currentItem
    ? Number(currentItem.quantity || 0) - Number(currentItem.shipped_quantity || 0)
    : 0

  // بررسی اینکه تاریخ انتخاب‌شده معتبره یا نه
  const isExitDateInvalid =
    selectedOrder?.order_date &&
    form.exit_date &&
    form.exit_date < selectedOrder.order_date

  return (
    <>
      <header className="topbar">
        <div>
          <h1>ثبت خروجی جدید</h1>
          <p>ثبت خروج کالا از کارخانه</p>
        </div>
      </header>

      {!selectedOrder && (
        <div className="panel">
          <div className="panel-header">
            <h2>📋 سفارش‌های ارسال‌نشده</h2>
            <button
              type="button"
              className={`order-picker-btn ${showOrderPicker ? "active" : ""}`}
              onClick={() => setShowOrderPicker(!showOrderPicker)}
              style={{
                background: showOrderPicker
                  ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                  : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                color: "#ffffff",
                border: "none"
              }}
            >
              <span className="order-picker-icon" style={{ color: "#ffffff" }}>📥</span>
              <span style={{ color: "#ffffff", fontWeight: 700 }}>
                {showOrderPicker ? "بستن لیست" : "نمایش لیست"}
              </span>
              <span
                className="order-picker-badge"
                style={{ color: "#ffffff", background: "rgba(255,255,255,0.25)" }}
              >
                {ordersNotShipped.length}
              </span>
              <span className="order-picker-arrow" style={{ color: "#ffffff" }}>
                {showOrderPicker ? "▲" : "▼"}
              </span>
            </button>
          </div>

          {showOrderPicker && (
            <div className="order-picker-wrapper">
              {ordersNotShipped.length === 0 ? (
                <div className="empty-state">
                  <div>✅</div>
                  <h3>همه سفارش‌ها ارسال شدن</h3>
                  <p>برای ثبت خروجی جدید، ابتدا باید یک سفارش ثبت کنید.</p>
                </div>
              ) : (
                <>
                  <div className="search-bar-wrapper" style={{ maxWidth: "100%", marginBottom: "15px" }}>
                    
                    <input
                      type="text"
                      placeholder="جستجو در مشتری، محصول، تاریخ..."
                      value={orderSearchInput}
                      onChange={(e) => {
                        const val = e.target.value
                        setOrderSearchInput(val)
                        if (val === "") {
                          setOrderSearchTerm("")
                          setOrderPickerPage(1)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") applyOrderSearch()
                      }}
                      className="search-bar-input"
                    />
                    {orderSearchInput && (
                      <button
                        className="search-bar-clear"
                        onClick={() => {
                          setOrderSearchInput("")
                          setOrderSearchTerm("")
                          setOrderPickerPage(1)
                        }}
                      >
                        ✕
                      </button>
                    )}
                    <button
                      type="button"
                      className="search-bar-apply"
                      onClick={applyOrderSearch}
                    >
                      اعمال فیلتر
                    </button>
                  </div>

                  <div className="orders-table-wrapper">
                    <table className="orders-table order-picker-table">
                      <thead>
                        <tr>
                          <th>ردیف</th>
                          <th>تاریخ سفارش</th>
                          <th>مشتری</th>
                          <th>محصول</th>
                          <th>سفارش</th>
                          <th>ارسالی</th>
                          <th>باقی‌مانده</th>
                          <th>عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentOrderPicker.map((o, index) => {
                          // اگه آیتم‌ها وجود نداشتن، یه آرایه با اطلاعات پایه بساز
                          const orderItems = o.items && o.items.length > 0 
                            ? o.items 
                            : [{ id: o.id, brick_type: o.brick_type, quantity: o.quantity, shipped_quantity: o.shipped_quantity }]

                          // فیلتر کردن آیتم‌هایی که باقی‌مانده دارن
                          const activeItems = orderItems.filter(item => {
                            const remaining = Number(item.quantity || 0) - Number(item.shipped_quantity || 0)
                            return remaining > 0
                          })

                          // اگه هیچ آیتم فعالی نبود، این سفارش رو نمایش نده
                          if (activeItems.length === 0) return null

                          return (
                            <tr key={o.id}>
                              <td>
                                <span className="row-number">
                                  {(orderPickerPage - 1) * orderPickerPerPage + index + 1}
                                </span>
                              </td>
                              <td>
                                <span className="date-badge">
                                  📅 {toPersianDate(o.order_date)}
                                </span>
                              </td>
                              <td>
                                <span className="customer-name">{o.customer_name}</span>
                              </td>
                              <td>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                  {activeItems.map(item => (
                                    <div key={item.id || item.brick_type} style={{ fontWeight: "600", color: "#334155" }}>
                                      {item.brick_type || "-"}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                  {activeItems.map(item => (
                                    <span key={item.id || item.brick_type} className="weight-badge">
                                      {Number(item.quantity || 0).toLocaleString()}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                  {activeItems.map(item => (
                                    <span key={item.id || item.brick_type} className="weight-badge">
                                      {Number(item.shipped_quantity || 0).toLocaleString()}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                  {activeItems.map(item => {
                                    const remaining = Math.max(0, Number(item.quantity || 0) - Number(item.shipped_quantity || 0))
                                    return (
                                      <strong key={item.id || item.brick_type} style={{ color: "#f59e0b", display: "block" }}>
                                        {remaining.toLocaleString()}
                                      </strong>
                                    )
                                  })}
                                </div>
                              </td>
                              <td>
                                {/* فقط یک دکمه برای انتخاب کل سفارش */}
                                <button
                                  type="button"
                                  className="save-btn"
                                  style={{
                                    padding: "6px 14px",
                                    fontSize: "12px",
                                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                    whiteSpace: "nowrap"
                                  }}
                                  onClick={() => handlePickOrder(o, activeItems)}
                                >
                                  ✅ انتخاب همه
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {totalOrderPickerPages > 1 && (
                    <Pagination
                      currentPage={orderPickerPage}
                      totalPages={totalOrderPickerPages}
                      onPageChange={setOrderPickerPage}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {selectedOrder && (
        <div className="panel order-form">
          <div className="panel-header">
            <h2>📤 اطلاعات خروجی</h2>
            <button
              type="button"
              className="cancel-btn"
              onClick={handleClearOrder}
              style={{ padding: "8px 16px", fontSize: "12px" }}
            >
              🔄 تغییر سفارش
            </button>
          </div>

          <div className="final-summary-section" style={{ marginBottom: "20px" }}>
            <h3>📋 سفارش انتخاب‌شده</h3>
            <div className="summary-grid">
              <div><span>تاریخ سفارش:</span><strong>{toPersianDate(selectedOrder.order_date)}</strong></div>
              <div><span>مشتری:</span><strong>{selectedOrder.customer_name}</strong></div>
              <div><span>تعداد محصولات:</span><strong>{selectedItems.length} قلم</strong></div>
              <div><span>مجموع باقی‌مانده:</span><strong style={{ color: "#f59e0b" }}>{selectedItems.reduce((sum, item) => sum + Math.max(0, Number(item.quantity || 0) - Number(item.shipped_quantity || 0)), 0).toLocaleString()} عدد</strong></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* بخش بالا: تاریخ خروج و واحد */}
            <div className="form-grid" style={{ marginBottom: "15px" }}>
              <div className="form-group">
                <label>📅 تاریخ خروج <span style={{ color: "#ef4444" }}>*</span></label>
                <PersianDateInput
                  value={form.exit_date}
                  onChange={(date) => setForm({ ...form, exit_date: date })}
                  placeholder="انتخاب تاریخ خروج"
                />
                <small style={{
                  color: isExitDateInvalid ? "#ef4444" : "#6b7280",
                  fontSize: "11px",
                  marginTop: "4px",
                  display: "block",
                  fontWeight: isExitDateInvalid ? "700" : "normal"
                }}>
                  {isExitDateInvalid
                    ? `⚠️ تاریخ خروج نمی‌تواند قبل از تاریخ سفارش (${toPersianDate(selectedOrder.order_date)}) باشد`
                    : `حداقل تاریخ مجاز: ${toPersianDate(selectedOrder.order_date)}`
                  }
                </small>
              </div>

              <div className="form-group">
                <label>📏 واحد</label>
                <select
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  className="filter-select-pretty"
                >
                  <option value="عدد">عدد</option>
                  <option value="قالب">قالب</option>
                  <option value="پالت">پالت</option>
                  <option value="کیلوگرم">کیلوگرم</option>
                  <option value="تن">تن</option>
                  <option value="متر مربع">متر مربع</option>
                </select>
              </div>
            </div>

            {/* بخش پایین: دو باکس کنار هم */}
                       <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", alignItems: "flex-start", marginBottom: "20px" }}>
              
              {/* باکس ۱: اقلام خروجی */}
                            <div style={{ width: "100%", minWidth: 0 }}>
                <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontWeight: "700", fontSize: "14px", color: darkMode ? "#f1f5f9" : "#1e293b" }}>📦 اقلام خروجی</span>
                  <span style={{ fontSize: "12px", color: "#6366f1", background: darkMode ? "rgba(99, 102, 241, 0.2)" : "#e0e7ff", padding: "4px 10px", borderRadius: "20px" }}>
                    {selectedItems.length} محصول
                  </span>
                </label>
                <div style={{ 
                  background: darkMode ? "rgba(15, 23, 42, 0.3)" : "#f8fafc", 
                  padding: "12px 16px", 
                  borderRadius: "12px", 
                  border: darkMode ? "1px solid rgba(51, 65, 85, 0.6)" : "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  height: "100%",
                  maxHeight: "350px",
                  overflowY: "auto"
                }}>
                  {selectedItems.map((item, idx) => {
                    const maxRemaining = Math.max(0, Number(item.quantity || 0) - Number(item.shipped_quantity || 0))
                    return (
                      <div key={idx} style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        background: darkMode ? "rgba(30, 41, 59, 0.6)" : "#ffffff",
                        padding: "10px 14px", 
                        borderRadius: "10px",
                        border: darkMode ? "1px solid rgba(71, 85, 105, 0.5)" : "1px solid #e5e7eb",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                      }}>
                        <span style={{ fontWeight: "600", color: darkMode ? "#f1f5f9" : "#1e293b", fontSize: "14px", width: "45%" }}>{item.brick_type}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "50%", justifyContent: "flex-end" }}>
                          <span style={{ fontSize: "11px", color: "#64748b", background: darkMode ? "rgba(255,255,255,0.1)" : "#f1f5f9", padding: "2px 6px", borderRadius: "6px", whiteSpace: "nowrap" }}>
                            حداکثر: {maxRemaining.toLocaleString()}
                          </span>
                          <input
                            type="number"
                            value={item.exitQuantity !== undefined ? item.exitQuantity : maxRemaining}
                            onChange={(e) => {
                              const val = Number(e.target.value)
                              const newItems = [...selectedItems]
                              newItems[idx].exitQuantity = val > maxRemaining ? maxRemaining : val
                              setSelectedItems(newItems)
                            }}
                            style={{
                              width: "80px",
                              padding: "6px 8px",
                              borderRadius: "8px",
                              border: "1.5px solid #6366f1",
                              background: darkMode ? "#0f172a" : "#ffffff",
                              textAlign: "center",
                              fontSize: "14px",
                              fontWeight: "700",
                              color: "#6366f1",
                              colorScheme: darkMode ? "dark" : "light"
                            }}
                            min={0}
                            max={maxRemaining}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* باکس ۲: مشخصات راننده */}
                            <div style={{ width: "100%", minWidth: 0 }}>
                <label style={{ fontWeight: "700", fontSize: "14px", color: darkMode ? "#f1f5f9" : "#1e293b", marginBottom: "8px", display: "block" }}>
                  🚚 مشخصات راننده و خودرو
                </label>
                <div style={{ 
                  background: darkMode ? "rgba(15, 23, 42, 0.3)" : "#f8fafc", 
                  padding: "16px", 
                  borderRadius: "12px", 
                  border: darkMode ? "1px solid rgba(51, 65, 85, 0.6)" : "1px solid #e2e8f0",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px"
                }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "12px" }}>👤 نام راننده <span style={{ color: "#ef4444" }}>*</span></label>
                    <input
                      type="text"
                      name="driver_name"
                      value={form.driver_name}
                      onChange={handleChange}
                      placeholder="مثلاً علی احمدی"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "12px" }}>📞 شماره تماس <span style={{ color: "#ef4444" }}>*</span></label>
                    <input
                      type="text"
                      name="driver_phone"
                      value={form.driver_phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 11)
                        setForm({ ...form, driver_phone: value })
                      }}
                      placeholder="09123456789"
                      maxLength={11}
                      inputMode="numeric"
                      required
                    />
                    {form.driver_phone && form.driver_phone.length !== 11 && (
                      <small style={{ color: "#f59e0b", fontSize: "10px", marginTop: "2px", display: "block", fontWeight: "600" }}>
                        ⚠️ باید ۱۱ رقم باشد ({form.driver_phone.length}/۱۱)
                      </small>
                    )}
                  </div>

                  <div className="form-group full-width" style={{ margin: 0 }}>
                    <label style={{ fontSize: "12px" }}>🚗 شماره پلاک <span style={{ color: "#ef4444" }}>*</span></label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px", direction: "ltr", marginTop: "6px" }}>
                      <input
                        type="text"
                        placeholder="۲ رقم"
                        value={platePart1}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 2)
                          setPlatePart1(val)
                          setForm({ ...form, vehicle_plate: `${val} ${platePart2} ${platePart3} - ${plateCity}` })
                        }}
                        style={{ width: "100%", textAlign: "center", padding: "8px 4px", borderRadius: "6px", border: "1.5px solid #e5e7eb", fontSize: "13px", boxSizing: "border-box", minWidth: 0 }}
                        required
                      />
                      <select
                        value={platePart2}
                        onChange={(e) => {
                          setPlatePart2(e.target.value)
                          setForm({ ...form, vehicle_plate: `${platePart1} ${e.target.value} ${platePart3} - ${plateCity}` })
                        }}
                        style={{ width: "100%", textAlign: "center", padding: "8px 4px", borderRadius: "6px", border: "1.5px solid #e5e7eb", fontSize: "13px", boxSizing: "border-box", minWidth: 0 }}
                        required
                      >
                        <option value="">حرف</option>
                        {["الف", "ب", "پ", "ت", "ث", "ج", "چ", "ح", "خ", "د", "ذ", "ر", "ز", "ژ", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ک", "گ", "ل", "م", "ن", "و", "ه", "ی"].map(l => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="۳ رقم"
                        value={platePart3}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 3)
                          setPlatePart3(val)
                          setForm({ ...form, vehicle_plate: `${platePart1} ${platePart2} ${val} - ${plateCity}` })
                        }}
                        style={{ width: "100%", textAlign: "center", padding: "8px 4px", borderRadius: "6px", border: "1.5px solid #e5e7eb", fontSize: "13px", boxSizing: "border-box", minWidth: 0 }}
                        required
                      />
                      <input
                        type="text"
                        placeholder="کد شهر"
                        value={plateCity}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 2)
                          setPlateCity(val)
                          setForm({ ...form, vehicle_plate: `${platePart1} ${platePart2} ${platePart3} - ${val}` })
                        }}
                        style={{ width: "100%", textAlign: "center", padding: "8px 4px", borderRadius: "6px", border: "1.5px solid #e5e7eb", fontSize: "13px", boxSizing: "border-box", minWidth: 0 }}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group full-width" style={{ margin: 0 }}>
                    <label style={{ fontSize: "12px" }}>🚚 نوع خودرو <span style={{ color: "#ef4444" }}>*</span></label>
                    <select
                      name="vehicle_type"
                      value={form.vehicle_type}
                      onChange={handleChange}
                      className="filter-select-pretty"
                      required
                      style={{ width: "100%", marginTop: "6px" }}
                    >
                      <option value="">انتخاب کنید</option>
                      <option value="کامیون">کامیون</option>
                      <option value="کامیونت">کامیونت</option>
                      <option value="تریلی">تریلی</option>
                      <option value="خاور">خاور</option>
                      <option value="نیسان">نیسان</option>
                      <option value="وانت">وانت</option>
                      <option value="سایر">سایر</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* بخش توضیحات و دکمه ثبت */}
            <div className="form-group full-width" style={{ marginBottom: "20px" }}>
              <label>📝 توضیحات (اختیاری)</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="توضیحات مربوط به خروج..."
                style={{ minHeight: "60px" }}
              ></textarea>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn" disabled={submitting} style={{ padding: "12px 30px", fontSize: "15px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)", opacity: submitting ? 0.7 : 1 }}>
                <Save size={18} /> {submitting ? "⏳ در حال ثبت..." : "ثبت خروجی"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <h2>📋 خروجی‌های اخیر</h2>
          <span>{exits.length} خروجی</span>
        </div>

        {exits.length === 0 ? (
          <div className="empty-state">
            <div>📤</div>
            <h3>هنوز خروجی‌ای ثبت نشده</h3>
          </div>
        ) : (
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>ردیف</th>
                  <th>تاریخ خروج</th>
                  <th>مشتری</th>
                  <th>دسته</th>
                  <th>محصول</th>
                  <th>مقدار</th>
                  <th>واحد</th>
                  <th>وضعیت</th>
                  <th>ثبت‌کننده</th>
                </tr>
              </thead>
              <tbody>
                           {exits.slice(0, 10).map((ex, index) => (
                  <tr key={ex.id}>
                    <td>{index + 1}</td>
                    <td>{toPersianDate(ex.exit_date)}</td>
                    <td>{ex.customer_name}</td>
                    <td><span className="machine-badge">{ex.category || "-"}</span></td>
                    <td>{ex.product_name}</td>
                    <td><span className="weight-badge">{Number(ex.quantity || 0).toLocaleString()}</span></td>
                    <td>{ex.unit || "عدد"}</td>
                    <td>
                      {ex.status === "approved" ? (
                        <span className="status-badge status-approved">✅ تأیید مالی</span>
                      ) : ex.status === "rejected" ? (
                        <span
                          className="status-badge status-rejected"
                          style={{ cursor: "pointer" }}
                          onClick={() => setShowRejectReason({ reason: ex.reject_reason, customer: ex.customer_name })}
                        >
                          ❌ رد مالی
                        </span>
                      ) : (
                        <span className="status-badge status-pending">⏳ در انتظار</span>
                      )}
                    </td>
                    <td><span className="notes-text">👤 {ex.created_by_full_name || ex.created_by || "-"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showShortageConfirm && createPortal(
        <div className="modal-overlay" onClick={() => setShowShortageConfirm(false)} style={{ zIndex: 9999999 }}>
          <div className="modal-box restock-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="restock-confirm-icon">⚠️</div>
            <h2>ارسال کمتر از سفارش</h2>
            <p>
              مقدار ارسال شده کمتر از باقی‌مانده سفارش است. آیا می‌خواهید باقی‌مانده این سفارش در سفارش بعدی ارسال شود؟
            </p>

            <div className="form-group" style={{ marginTop: "15px", textAlign: "right" }}>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>
                علت کم ارسال کردن (اجباری) <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <textarea
                value={shortageReason}
                onChange={(e) => setShortageReason(e.target.value)}
                placeholder="مثلاً: کمبود تولید، درخواست مشتری، خرابی بار و..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1.5px solid #e5e7eb",
                  fontFamily: "inherit",
                  marginTop: "6px"
                }}
              ></textarea>
            </div>

            <div className="delete-modal-actions" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="cancel-btn"
                onClick={handleRejectShortage}
              >
                خیر، سفارش باز بماند
              </button>
              <button
                type="button"
                className="save-btn"
                onClick={handleConfirmShortage}
              >
                ✅ بله، سفارش را ببند
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showExtraConfirm && createPortal(
        <div className="modal-overlay" onClick={() => setShowExtraConfirm(false)} style={{ zIndex: 9999999 }}>
          <div className="modal-box restock-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="restock-confirm-icon">🎁</div>
            <h2>ارسال بیشتر از سفارش</h2>
            <p>
              مقدار وارد شده (<strong>{Number(form.quantity || 0).toLocaleString()}</strong>) بیشتر از باقی‌مانده سفارش (<strong>{remainingOfSelected.toLocaleString()}</strong>) است.
              <br />
              مقدار اضافه: <strong>{Math.max(0, Number(form.quantity || 0) - remainingOfSelected).toLocaleString()} عدد</strong>
              <br /><br />
              آیا این مقدار اضافه به عنوان «بار اضافه» ارسال شود؟
            </p>

            <div className="delete-modal-actions" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowExtraConfirm(false)}
              >
                انصراف
              </button>
              <button
                type="button"
                className="save-btn"
                onClick={() => {
                  setShowExtraConfirm(false)
                  setIsExtra(true)
                  const exitQty = Number(form.quantity || 0)
                  const remaining = Number(selectedOrder.quantity || 0) - Number(selectedOrder.shipped_quantity || 0)
                  setTimeout(() => {
                    submitExit(exitQty, remaining, true)
                  }, 100)
                }}
              >
                🎁 بله، بار اضافه ثبت شود
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
/* =========================
   SHIPMENT APPROVE (کارخانه)
========================= */

/* =========================
   SHIPMENT APPROVE (کارخانه)
========================= */

/* =========================
   SHIPMENT APPROVE (تأیید مالی)
========================= */

function ShipmentApprove({ currentUser, showToast, setPage, handleLogout, darkMode, setDarkMode, loadExits: loadExitsApp }) {
  const [exits, setExits] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [rejectGroup, setRejectGroup] = useState(null)

  const [paymentForm, setPaymentForm] = useState({ methods: {} })
  const [rejectReason, setRejectReason] = useState("")

  const loadExits = () => {
    authFetch("/api/exits")
      .then((res) => res.json())
      .then((data) => setExits(Array.isArray(data) ? data : []))
      .catch((error) => console.error("خطا در دریافت خروجی‌ها:", error))
  }

  useEffect(() => {
    loadExits()
  }, [])

  // گروه‌بندی خروجی‌های در انتظار
  const pendingExits = exits.filter((e) => e.status === "pending" || !e.status)
  const groupedExits = Object.values(
    pendingExits.reduce((acc, ex) => {
      // کلید گروه: مشتری + تاریخ خروج + پلاک خودرو + نام راننده
      const key = `${ex.customer_name}_${ex.exit_date}_${ex.vehicle_plate}_${ex.driver_name}`
      if (!acc[key]) {
        acc[key] = {
          key,
          customer_name: ex.customer_name,
          exit_date: ex.exit_date,
          driver_name: ex.driver_name,
          driver_phone: ex.driver_phone,
          vehicle_plate: ex.vehicle_plate,
          vehicle_type: ex.vehicle_type,
          created_by: ex.created_by,
          created_by_full_name: ex.created_by_full_name,
          items: [],
          total_quantity: 0,
          ids: []
        }
      }
      acc[key].items.push(ex)
      acc[key].total_quantity += Number(ex.quantity || 0)
      acc[key].ids.push(ex.id)
      return acc
    }, {})
  )

  const handleApprove = async () => {
    const selectedMethods = Object.entries(paymentForm.methods || {})
      .filter(([_, val]) => val.checked)
      .map(([method, val]) => ({
        method,
        note: val.note || ""
      }))

    if (selectedMethods.length === 0) {
      showToast("حداقل یه روش پرداخت رو انتخاب کن", "warning")
      return
    }

    let successCount = 0
    let hasError = false

    for (const id of selectedGroup.ids) {
      try {
        const response = await authFetch(`/api/exits/${id}/approve`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment_methods: JSON.stringify(selectedMethods)
          })
        })
        const data = await response.json()
        if (data.success) {
          successCount++
        } else {
          hasError = true
        }
      } catch (error) {
        hasError = true
      }
    }

    if (successCount > 0) {
      showToast(`✅ ${successCount} محصول تأیید مالی شد`, "success")
      setSelectedGroup(null)
      setPaymentForm({ methods: {} })
      loadExits()
      if (loadExitsApp) loadExitsApp()
    } else if (hasError) {
      showToast("خطا در تأیید برخی محصولات", "error")
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showToast("دلیل رد رو وارد کن", "warning")
      return
    }

    let successCount = 0
    let hasError = false

    for (const id of rejectGroup.ids) {
      try {
        const response = await authFetch(`/api/exits/${id}/reject`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reject_reason: rejectReason })
        })
        const data = await response.json()
        if (data.success) {
          successCount++
        } else {
          hasError = true
        }
      } catch (error) {
        hasError = true
      }
    }

    if (successCount > 0) {
      showToast(`❌ ${successCount} محصول رد شد`, "success")
      setRejectGroup(null)
      setRejectReason("")
      loadExits()
      if (loadExitsApp) loadExitsApp()
    } else if (hasError) {
      showToast("خطا در رد برخی محصولات", "error")
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>تأیید مالی خروجی</h1>
          <p>بررسی و تأیید مالی خروجی‌های ثبت‌شده</p>
        </div>
      </header>

      <div className="panel">
        <div className="panel-header">
          <h2>⏳ خروجی‌های در انتظار تأیید مالی</h2>
          <span>{groupedExits.length} درخواست</span>
        </div>

        {groupedExits.length === 0 ? (
          <div className="empty-state">
            <div>✅</div>
            <h3>همه خروجی‌ها تأیید شدن</h3>
            <p>درخواست جدیدی برای تأیید وجود نداره.</p>
          </div>
        ) : (
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>ردیف</th>
                  <th>تاریخ خروج</th>
                  <th>مشتری</th>
                  <th>محصولات</th>
                  <th>مجموع مقدار</th>
                  <th>راننده / خودرو</th>
                  <th>ثبت‌کننده</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {groupedExits.map((group, index) => (
                  <tr key={group.key}>
                    <td><span className="row-number">{index + 1}</span></td>
                    <td><span className="date-badge">📅 {toPersianDate(group.exit_date)}</span></td>
                    <td><span className="customer-name">{group.customer_name}</span></td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {group.items.map((item, i) => (
                          <span key={i} className="machine-badge" style={{ fontSize: "11px" }}>
                            {item.product_name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="weight-badge">{Number(group.total_quantity || 0).toLocaleString()}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: "12px", lineHeight: "1.6", textAlign: "right" }}>
                        <div>👤 {group.driver_name || "-"}</div>
                        <div>📞 {group.driver_phone || "-"}</div>
                        <div>🚗 {group.vehicle_type || "-"} | {group.vehicle_plate || "-"}</div>
                      </div>
                    </td>
                    <td><span className="notes-text">👤 {group.created_by_full_name || group.created_by || "-"}</span></td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="save-btn"
                          style={{
                            padding: "8px 16px",
                            fontSize: "12px",
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            color: "#ffffff",
                            fontWeight: 700,
                            border: "none",
                            borderRadius: "10px",
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35)",
                            transition: "all 0.25s ease"
                          }}
                          onClick={() => {
                            setSelectedGroup(group)
                            setPaymentForm({ methods: {} })
                          }}
                        >
                          ✅ تأیید مالی
                        </button>
                        <button
                          className="row-btn delete-btn"
                          title="رد"
                          onClick={() => {
                            setRejectGroup(group)
                            setRejectReason("")
                          }}
                        >
                          ❌
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* مودال تأیید مالی */}
      {selectedGroup && (
        <div className="modal-overlay" onClick={() => setSelectedGroup(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✅ تأیید مالی - {selectedGroup.customer_name}</h2>
              <button className="modal-close" onClick={() => setSelectedGroup(null)}>✕</button>
            </div>

            <div style={{ padding: "20px" }}>
              <div className="final-summary-section">
                <h3>📋 اطلاعات خروجی</h3>
                <div className="summary-grid">
                  <div><span>تاریخ خروج:</span><strong>{toPersianDate(selectedGroup.exit_date)}</strong></div>
                  <div><span>مشتری:</span><strong>{selectedGroup.customer_name}</strong></div>
                  <div><span>تعداد محصولات:</span><strong>{selectedGroup.items.length} قلم</strong></div>
                  <div><span>مجموع مقدار:</span><strong>{Number(selectedGroup.total_quantity).toLocaleString()} عدد</strong></div>
                  <div><span>ثبت‌کننده:</span><strong>{selectedGroup.created_by || "-"}</strong></div>
                </div>
              </div>

              <div className="final-summary-section" style={{ marginTop: "15px" }}>
                <h3>📦 لیست محصولات</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {selectedGroup.items.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px", background: "#f8fafc", borderRadius: "8px" }}>
                      <span style={{ fontWeight: "600" }}>{item.product_name}</span>
                      <span style={{ color: "#6366f1", fontWeight: "700" }}>{Number(item.quantity).toLocaleString()} {item.unit || "عدد"}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="final-summary-section" style={{ marginTop: "15px" }}>
                <h3>🚚 اطلاعات راننده و خودرو</h3>
                <div className="summary-grid">
                  <div><span>نام راننده:</span><strong>{selectedGroup.driver_name || "-"}</strong></div>
                  <div><span>شماره تماس:</span><strong>{selectedGroup.driver_phone || "-"}</strong></div>
                  <div><span>نوع خودرو:</span><strong>{selectedGroup.vehicle_type || "-"}</strong></div>
                  <div><span>شماره پلاک:</span><strong>{selectedGroup.vehicle_plate || "-"}</strong></div>
                </div>
              </div>

              <div style={{ marginTop: "20px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "12px",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#334155"
                }}>
                  💳 نوع پرداخت (چندتا می‌تونی انتخاب کنی)
                </label>

                <div className="payment-methods-list">
                  {["نقدی", "چکی", "کارت به کارت", "اعتباری"].map((method) => {
                    const isChecked = paymentForm.methods?.[method]?.checked || false
                    const note = paymentForm.methods?.[method]?.note || ""

                    return (
                      <div key={method} className="payment-method-row">
                        <label className="payment-method-label">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const newMethods = { ...(paymentForm.methods || {}) }
                              newMethods[method] = {
                                checked: e.target.checked,
                                note: note
                              }
                              setPaymentForm({ ...paymentForm, methods: newMethods })
                            }}
                          />
                          <span>{method}</span>
                        </label>

                        {isChecked && (
                          <input
                            type="text"
                            placeholder="شماره رهگیری یا توضیحات..."
                            value={note}
                            onChange={(e) => {
                              const newMethods = { ...(paymentForm.methods || {}) }
                              newMethods[method] = {
                                checked: true,
                                note: e.target.value
                              }
                              setPaymentForm({ ...paymentForm, methods: newMethods })
                            }}
                            className="payment-method-note"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setSelectedGroup(null)}
                >
                  انصراف
                </button>
                <button
                  type="button"
                  className="save-btn"
                  onClick={handleApprove}
                  style={{
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#ffffff",
                    fontWeight: 700,
                    padding: "12px 28px",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    boxShadow: "0 6px 18px rgba(16, 185, 129, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.25s ease"
                  }}
                >
                  ✅ تأیید مالی ({selectedGroup.items.length} محصول)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال رد */}
      {rejectGroup && (
        <div className="modal-overlay" onClick={() => { setRejectGroup(null); setRejectReason("") }}>
          <div className="modal-box delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">❌</div>
            <h2>رد خروجی</h2>
            <p>
              آیا مطمئنی می‌خوای خروجی <strong>{rejectGroup.customer_name}</strong> (شامل {rejectGroup.items.length} محصول) رو رد کنی؟
            </p>

            <div className="form-group" style={{ marginTop: "15px", textAlign: "right" }}>
              <label>دلیل رد</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="دلیل رد خروجی..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1.5px solid #e5e7eb",
                  fontFamily: "inherit"
                }}
              ></textarea>
            </div>
            <div className="delete-modal-actions">
              <button className="cancel-btn" onClick={() => { setRejectGroup(null); setRejectReason("") }}>
                انصراف
              </button>
              <button className="confirm-delete-btn" onClick={handleReject}>
                ❌ رد کن
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
/* =========================
   SHIPMENT REPORT (گزارش خروجی جدید)
========================= */

function ShipmentReport({ currentUser, setPage, handleLogout, darkMode, setDarkMode }) {
  const [exits, setExits] = useState([])
  const [selectedGroupDetail, setSelectedGroupDetail] = useState(null)
  const [deleteGroup, setDeleteGroup] = useState(null)

  const [filterStatus, setFilterStatus] = useState("")
  const [filterCustomer, setFilterCustomer] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterFrom, setFilterFrom] = useState("")
  const [filterTo, setFilterTo] = useState("")

  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [sortKey, setSortKey] = useState("exit_date")
  const [sortDir, setSortDir] = useState("desc")

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const applySearch = () => {
    setSearchTerm(searchInput)
    setCurrentPage(1)
  }

  const loadExits = () => {
    authFetch("/api/exits")
      .then((res) => res.json())
      .then((data) => setExits(Array.isArray(data) ? data : []))
      .catch((error) => console.error("خطا در دریافت خروجی‌ها:", error))
  }

  useEffect(() => {
    loadExits()
  }, [])

  // گروه‌بندی خروجی‌ها
  const groupedExits = Object.values(
    exits.reduce((acc, ex) => {
      const key = `${ex.customer_name}_${ex.exit_date}_${ex.vehicle_plate}_${ex.driver_name}`
      if (!acc[key]) {
        acc[key] = {
          key,
          customer_name: ex.customer_name,
          exit_date: ex.exit_date,
          driver_name: ex.driver_name,
          driver_phone: ex.driver_phone,
          vehicle_plate: ex.vehicle_plate,
          vehicle_type: ex.vehicle_type,
          created_by: ex.created_by,
          created_by_full_name: ex.created_by_full_name,
          status: ex.status, // فرض می‌کنیم وضعیت همه آیتم‌های یک گروه یکیه
          approved_by: ex.approved_by,
          items: [],
          total_quantity: 0,
          ids: []
        }
      }
      acc[key].items.push(ex)
      acc[key].total_quantity += Number(ex.quantity || 0)
      acc[key].ids.push(ex.id)
      
      // اگه یکی از آیتم‌ها رد شده بود، وضعیت کل گروه رو رد کن
      if (ex.status === "rejected") acc[key].status = "rejected"
      // اگه یکی در انتظار بود، کل گروه در انتظاره
      else if (ex.status === "pending" || !ex.status) acc[key].status = "pending"

      return acc
    }, {})
  )

  const filteredExits = groupedExits.filter((g) => {
    if (filterStatus && g.status !== filterStatus) return false
    if (filterCustomer && g.customer_name !== filterCustomer) return false
    if (filterFrom && g.exit_date < filterFrom) return false
    if (filterTo && g.exit_date > filterTo) return false

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const matchCustomer = g.customer_name?.toLowerCase().includes(term)
      const matchDate = toPersianDate(g.exit_date).includes(searchTerm) || g.exit_date?.includes(searchTerm)
      const matchProduct = g.items.some(i => i.product_name?.toLowerCase().includes(term))
      
      if (!matchCustomer && !matchDate && !matchProduct) return false
    }

    return true
  })

  const sortedExits = [...filteredExits].sort((a, b) => {
    let valA = a[sortKey]
    let valB = b[sortKey]

    if (valA === null || valA === undefined) valA = ""
    if (valB === null || valB === undefined) valB = ""

    if (sortKey === "quantity") {
      valA = Number(valA || 0)
      valB = Number(valB || 0)
      return sortDir === "asc" ? valA - valB : valB - valA
    }

    const strA = valA.toString()
    const strB = valB.toString()
    return sortDir === "asc"
      ? strA.localeCompare(strB, "fa")
      : strB.localeCompare(strA, "fa")
  })
  
  const totalPages = Math.ceil(sortedExits.length / perPage)
  const startIndex = (currentPage - 1) * perPage
  const currentExits = sortedExits.slice(startIndex, startIndex + perPage)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])

  const handleClear = () => {
    setFilterStatus("")
    setFilterCustomer("")
    setSearchInput("")
    setSearchTerm("")
    setFilterFrom("")
    setFilterTo("")
    setCurrentPage(1)
  }

  const handleDeleteGroup = async (reason) => {
    if (!deleteGroup) return

    let successCount = 0
    for (const id of deleteGroup.ids) {
      try {
        const response = await authFetch(`/api/exits/${id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ delete_reason: reason })
        })
        const data = await response.json()
        if (data.success) successCount++
      } catch (error) {
        console.error(error)
      }
    }
    
    if (successCount > 0) {
      setDeleteGroup(null)
      loadExits()
    }
  }

  const getStatusBadge = (status) => {
    if (status === "pending" || !status) return { text: "⏳ در انتظار تأیید مالی", class: "status-pending" }
    if (status === "approved") return { text: "✅ تأیید مالی شده", class: "status-approved" }
    if (status === "rejected") return { text: "❌ رد شده", class: "status-rejected" }
    return { text: status, class: "" }
  }

  const parsePaymentMethods = (paymentType) => {
    if (!paymentType) return []
    try {
      const parsed = JSON.parse(paymentType)
      if (Array.isArray(parsed)) return parsed
      return []
    } catch (e) {
      return [{ method: paymentType, note: "" }]
    }
  }

  const uniqueCustomers = [...new Set(exits.map((e) => e.customer_name))]

  const totalQuantity = filteredExits
    .filter((g) => g.status !== "rejected")
    .reduce((sum, g) => sum + Number(g.total_quantity || 0), 0)
  const approvedCount = filteredExits.filter((g) => g.status === "approved").length
  const pendingCount = filteredExits.filter((g) => !g.status || g.status === "pending").length

  return (
    <>
      <header className="topbar">
        <div>
          <h1>گزارش خروجی</h1>
          <p>مشاهده و جستجوی همه خروجی‌های ثبت‌شده</p>
        </div>
      </header>

      <section className="stats">
        <div className="stat-card">
          <div className="stat-icon"><span>📤</span></div>
          <div>
            <span>کل خروجی‌ها</span>
            <strong>{filteredExits.length}</strong>
            <small>فاکتور</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><span>✅</span></div>
          <div>
            <span>تأیید مالی شده</span>
            <strong>{approvedCount}</strong>
            <small>فاکتور</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><span>⏳</span></div>
          <div>
            <span>در انتظار تأیید</span>
            <strong>{pendingCount}</strong>
            <small>فاکتور</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><span>🔢</span></div>
          <div>
            <span>جمع مقادیر</span>
            <strong>{totalQuantity.toLocaleString()}</strong>
            <small>عدد</small>
          </div>
        </div>
      </section>

      <div className="panel" style={{ position: "relative", zIndex: 100 }}>
        <div className="panel-header">
          <h2>🔍 فیلترها</h2>
          <span>جستجو و فیلتر خروجی‌ها</span>
        </div>

        <div className="search-bar-wrapper" style={{ maxWidth: "100%", marginBottom: "18px" }}>
          <input
            type="text"
            placeholder="جستجو در مشتری، محصول، تاریخ..."
            value={searchInput}
            onChange={(e) => {
              const val = e.target.value
              setSearchInput(val)
              if (val === "") {
                setSearchTerm("")
                setCurrentPage(1)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch()
            }}
            className="search-bar-input"
          />
          {searchInput && (
            <button
              className="search-bar-clear"
              onClick={() => {
                setSearchInput("")
                setSearchTerm("")
                setCurrentPage(1)
              }}
            >
              ✕
            </button>
          )}
          <button
            type="button"
            className="search-bar-apply"
            onClick={applySearch}
          >
            اعمال فیلتر
          </button>
        </div>

        <div className="filter-row">
          <div className="filter-item">
            <span className="filter-label">📊 وضعیت</span>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="filter-select-pretty"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="pending">⏳ در انتظار تأیید</option>
              <option value="approved">✅ تأیید مالی شده</option>
              <option value="rejected">❌ رد شده</option>
            </select>
          </div>

          <div className="filter-item">
            <span className="filter-label">👤 مشتری</span>
            <CustomerSearchSelect
              customers={uniqueCustomers.map((name, i) => ({ id: i, name }))}
              value={filterCustomer}
              onChange={(name) => {
                setFilterCustomer(name)
                setCurrentPage(1)
              }}
            />
          </div>

          <div className="filter-item">
            <span className="filter-label">📅 از تاریخ</span>
            <PersianDateInput
              value={filterFrom}
              onChange={(date) => {
                setFilterFrom(date)
                setCurrentPage(1)
              }}
              placeholder="از تاریخ"
            />
          </div>

          <div className="filter-item">
            <span className="filter-label">📅 تا تاریخ</span>
            <PersianDateInput
              value={filterTo}
              onChange={(date) => {
                setFilterTo(date)
                setCurrentPage(1)
              }}
              placeholder="تا تاریخ"
            />
          </div>

          <button
            type="button"
            className="clear-filter-btn"
            onClick={handleClear}
          >
            🔄 پاک کردن
          </button>
        </div>
      </div>

      <div className="panel" style={{ position: "relative", zIndex: 1 }}>
        <div className="panel-header">
          <h2>📋 لیست خروجی‌ها</h2>
          <div className="table-actions">
            <span>{filteredExits.length} فاکتور</span>
            <button
              type="button"
              className="action-btn print-btn"
              onClick={() => printTable("exits-table-print", "گزارش خروجی")}
            >
              🖨️ چاپ
            </button>
            <button
              type="button"
              className="action-btn excel-btn"
              onClick={() => exportToExcel("exits-table-print", "exits")}
            >
              📊 Excel
            </button>
          </div>
        </div>
        {filteredExits.length === 0 ? (
          <div className="empty-state">
            <div>📤</div>
            <h3>خروجی‌ای پیدا نشد</h3>
            <p>با این فیلترها خروجی‌ای وجود نداره.</p>
          </div>
        ) : (
          <>
            <div className="orders-table-wrapper">
              <table className="orders-table" id="exits-table-print">
                <thead>
                  <tr>
                    <th>ردیف</th>
                    <SortableHeader label="تاریخ خروج" sortKey="exit_date" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="مشتری" sortKey="customer_name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <th>محصولات</th>
                    <SortableHeader label="مجموع مقدار" sortKey="total_quantity" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="وضعیت" sortKey="status" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <th>راننده / خودرو</th>
                    <SortableHeader label="ثبت‌کننده" sortKey="created_by" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {currentExits.map((g, index) => {
                    const statusBadge = getStatusBadge(g.status)
                    return (
                      <tr key={g.key}>
                        <td>{startIndex + index + 1}</td>
                        <td>
                          <span className="date-badge">
                            📅 {toPersianDate(g.exit_date)}
                          </span>
                        </td>
                        <td><span className="customer-name">{g.customer_name}</span></td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {g.items.map((item, i) => (
                              <span key={i} className="machine-badge" style={{ fontSize: "11px" }}>
                                {item.product_name} ({Number(item.quantity).toLocaleString()})
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className="weight-badge">
                            {Number(g.total_quantity || 0).toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${statusBadge.class}`}>
                            {statusBadge.text}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: "11px", lineHeight: "1.6", textAlign: "right" }}>
                            <div>👤 {g.driver_name || "-"}</div>
                            <div>📞 {g.driver_phone || "-"}</div>
                            <div>🚗 {g.vehicle_type || "-"} | {g.vehicle_plate || "-"}</div>
                          </div>
                        </td>
                        <td>
                          <span className="notes-text">👤 {g.created_by_full_name || g.created_by || "-"}</span>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="row-btn edit-btn"
                              title="جزئیات"
                              onClick={() => setSelectedGroupDetail(g)}
                            >
                              👁️
                            </button>

                            {currentUser?.role === "admin" && (
                              <button
                                type="button"
                                className="row-btn delete-btn"
                                title="حذف کل فاکتور"
                                onClick={() => setDeleteGroup(g)}
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <TableControls
              totalItems={filteredExits.length}
              perPage={perPage}
              onPerPageChange={setPerPage}
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {selectedGroupDetail && (
        <div className="modal-overlay" onClick={() => setSelectedGroupDetail(null)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "850px", maxHeight: "95vh", overflowY: "auto", padding: "20px" }}
          >
            {/* هدر دکمه‌های عملیات (در پرینت مخفی می‌شود) */}
            <div className="modal-header no-print" style={{ marginBottom: "15px" }}>
              <h2>پیش‌نمایش فرم چاپی</h2>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  type="button"
                  className="save-btn"
                  style={{ padding: "8px 16px", fontSize: "13px" }}
                  onClick={() => {
                    setTimeout(() => {
                      window.print()
                    }, 100)
                  }}
                >
                  🖨️ پرینت / PDF
                </button>
                <button className="modal-close" onClick={() => setSelectedGroupDetail(null)}>✕</button>
              </div>
            </div>

            {/* ==================== فرم چاپی (شبیه عکس) ==================== */}
            <div className="official-print-form">
              {/* هدر فرم */}
              <div className="op-header">
                <div className="op-header-right">
                  <div className="op-header-company">شرکت فرآورده‌های نسوز محراب</div>
                  <div className="op-header-title">حواله انبار (مجوز خروج از انبار)</div>
                </div>
                <div className="op-header-left">
                  <div className="op-order-number">
                    شماره: <span>{selectedGroupDetail.items[0]?.order_number || "-"}</span>
                  </div>
                </div>
              </div>

              {/* ردیف اول اطلاعات */}
              <div className="op-info-row">
                <div className="op-info-cell">
                  <span className="op-label">نام خریدار:</span>
                  <span className="op-value">{selectedGroupDetail.customer_name}</span>
                </div>
                <div className="op-info-cell">
                  <span className="op-label">شماره فاکتور:</span>
                  <span className="op-value"></span>
                </div>
              </div>
              <div className="op-info-row">
                <div className="op-info-cell">
                  <span className="op-label">شماره همراه:</span>
                  <span className="op-value">{selectedGroupDetail.driver_phone || "-"}</span>
                </div>
                <div className="op-info-cell">
                  <span className="op-label">تاریخ:</span>
                  <span className="op-value">{toPersianDate(selectedGroupDetail.exit_date)}</span>
                </div>
              </div>

              {/* جدول اصلی */}
              <table className="op-table">
                <thead>
                  <tr>
                    <th rowSpan="2" style={{ width: "40px" }}>ردیف</th>
                    <th colSpan="3">شرح کالا</th>
                    <th colSpan="3">تعداد بسته</th>
                  </tr>
                  <tr>
                    <th>شرح کالا</th>
                    <th>جنس کالا</th>
                    <th>تعداد قالب</th>
                    <th>تعداد بسته</th>
                    <th>تعداد قالب</th>
                    <th>تعداد بسته</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGroupDetail.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td style={{ textAlign: "right", paddingRight: "10px" }}>{item.product_name}</td>
                      <td>{item.category || "-"}</td>
                      <td>{Number(item.quantity).toLocaleString()}</td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  ))}
                  {/* ردیف‌های خالی برای پر کردن فرم */}
                  {Array.from({ length: Math.max(0, 8 - selectedGroupDetail.items.length) }).map((_, i) => (
                    <tr key={`empty-${i}`}>
                      <td>{selectedGroupDetail.items.length + i + 1}</td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* متن تعهد */}
              <div className="op-footer-text">
                محصولات فوق سالم و به مقدار فوق به اینجانب <strong>{selectedGroupDetail.driver_name || "................"}</strong> راننده <strong>{selectedGroupDetail.vehicle_plate || "................"}</strong> به شماره <strong>{selectedGroupDetail.driver_phone || "................"}</strong> تحویل گردید.
              </div>

              {/* جدول پایین (امضاها) */}
              <table className="op-signatures-table">
                <tbody>
                  <tr>
                    <td>مسئول فروش</td>
                    <td>بارگیری</td>
                    <td>تحویل گیرنده</td>
                    <td>مسئول مالی</td>
                  </tr>
                  <tr>
                    <td style={{ height: "80px" }}></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan="2" style={{ textAlign: "right", paddingRight: "15px", fontSize: "11px", fontWeight: "bold" }}>
                      صادر گردید و خروج ماشین با مشخصات فوق بلا مانع می‌باشد.
                    </td>
                    <td colSpan="2" style={{ textAlign: "right", paddingRight: "15px" }}>
                      پارنامه شماره: ............................
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* ==================== پایان فرم چاپی ==================== */}
            
          </div>
        </div>
      )}

      {deleteGroup && (
        <DeleteReasonModal
          title="حذف کل فاکتور خروجی"
          itemName={`${deleteGroup.customer_name} (${deleteGroup.items.length} قلم)`}
          onConfirm={handleDeleteGroup}
          onClose={() => setDeleteGroup(null)}
        />
      )}
    </>
  )
}
function TicketPage({ currentUser, showToast, setPage, handleLogout, darkMode, setDarkMode }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)

  const [form, setForm] = useState({ subject: "", message: "" })
  const [replyText, setReplyText] = useState("")

const loadTickets = () => {
    setLoading(true)
    authFetch("/api/my-tickets")
      .then((res) => res.json())
      .then((data) => {
        setTickets(Array.isArray(data) ? data : (data?.tickets || []))
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.subject.trim() || !form.message.trim()) {
      showToast("موضوع و متن رو پر کن", "warning")
      return
    }

    try {
      const response = await authFetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      const data = await response.json()

      if (data.success) {
        showToast("تیکت ارسال شد", "success")
        setForm({ subject: "", message: "" })
        setShowNewForm(false)
        loadTickets()
      } else {
        showToast(data.message || "خطا", "error")
      }
    } catch (error) {
      console.error(error)
      showToast("خطا در ارتباط با سرور", "error")
    }
  }

  const handleOpenTicket = (ticketId) => {
    authFetch(`/api/tickets/${ticketId}`)
      .then((res) => res.json())
      .then((data) => setSelectedTicket(data))
      .catch((err) => console.error(err))
  }

  const handleReply = async () => {
    if (!replyText.trim()) return

    try {
      const response = await authFetch(
        `/api/tickets/${selectedTicket.id}/reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: replyText })
        }
      )
      const data = await response.json()

      if (data.success) {
        setReplyText("")
        handleOpenTicket(selectedTicket.id)
        loadTickets()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const getStatusBadge = (status) => {
    if (status === "open") return { text: "🟢 باز", class: "status-approved" }
    return { text: "⚪ بسته", class: "status-pending" }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>🎫 تیکت‌های من</h1>
          <p>ارسال و پیگیری درخواست‌ها به مدیر</p>
        </div>
             
      </header>

      {/* دکمه تیکت جدید */}
      <div className="panel">
        <div className="panel-header">
          <h2>📝 تیکت جدید</h2>
          <button
            className="save-btn"
            onClick={() => setShowNewForm(!showNewForm)}
            style={{ padding: "8px 16px", fontSize: "13px" }}
          >
            {showNewForm ? "بستن" : "➕ ارسال تیکت جدید"}
          </button>
        </div>

        {showNewForm && (
          <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
            <div className="form-group">
              <label>موضوع</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="موضوع تیکت"
                required
              />
            </div>

            <div className="form-group" style={{ marginTop: "15px" }}>
              <label>متن پیام</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="متن پیام..."
                rows={5}
                required
              ></textarea>
            </div>

            <div className="form-actions" style={{ marginTop: "20px" }}>
              <button type="button" className="cancel-btn" onClick={() => setShowNewForm(false)}>
                انصراف
              </button>
              <button type="submit" className="save-btn">
                📤 ارسال تیکت
              </button>
            </div>
          </form>
        )}
      </div>

      {/* لیست تیکت‌ها */}
      <div className="panel">
        <div className="panel-header">
          <h2>📋 تیکت‌های من</h2>
          <span>{tickets.length} تیکت</span>
        </div>

        {loading ? (
          <div className="empty-state">
            <div>⏳</div>
            <h3>در حال بارگذاری...</h3>
          </div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <div>🎫</div>
            <h3>هنوز تیکتی نداری</h3>
            <p>با دکمه بالا اولین تیکتت رو ارسال کن.</p>
          </div>
        ) : (
          <div className="shipments-list">
            {tickets.map((t) => {
              const badge = getStatusBadge(t.status)
              return (
                <div
                  className="shipment-card"
                  key={t.id}
                  onClick={() => handleOpenTicket(t.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="shipment-card-header">
                    <div>
                      <strong>{t.subject}</strong>
                      <small style={{ display: "block", marginTop: "5px", color: "#6b7280" }}>
                        📅 {toPersianDate(t.created_at?.split("T")[0])}
                      </small>
                    </div>
                    <span className={`status-badge ${badge.class}`}>
                      {badge.text}
                    </span>
                  </div>

                  <div style={{ marginTop: "10px", color: "#6b7280", fontSize: "13px" }}>
                    💬 {t.replies_count} پاسخ
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* مودال جزئیات تیکت */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "700px", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="modal-header">
              <h2>🎫 {selectedTicket.subject}</h2>
              <button className="modal-close" onClick={() => setSelectedTicket(null)}>✕</button>
            </div>

            <div style={{ padding: "20px" }}>
              {/* پیام اصلی */}
              <div style={{
                padding: "15px",
                background: "#f9fafb",
                borderRadius: "10px",
                marginBottom: "20px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <strong>👤 {selectedTicket.user_name}</strong>
                  <small>{toPersianDate(selectedTicket.created_at?.split("T")[0])}</small>
                </div>
                <p style={{ margin: 0, lineHeight: "1.8" }}>{selectedTicket.message}</p>
              </div>

              {/* پاسخ‌ها */}
              {selectedTicket.replies?.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ marginBottom: "10px" }}>💬 پاسخ‌ها:</h4>
                  {selectedTicket.replies.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        padding: "12px 15px",
                        background: r.is_admin ? "#dbeafe" : "#f3f4f6",
                        borderRadius: "10px",
                        marginBottom: "10px",
                        borderRight: r.is_admin ? "4px solid #3b82f6" : "4px solid #9ca3af"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <strong>
                          {r.is_admin ? "👑 مدیر" : "👤 " + r.user_name}
                        </strong>
                        <small>{toPersianDate(r.created_at?.split("T")[0])}</small>
                      </div>
                      <p style={{ margin: 0, lineHeight: "1.8" }}>{r.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* فرم پاسخ (اگه تیکت بازه) */}
              {selectedTicket.status === "open" ? (
                <div>
                  <h4 style={{ marginBottom: "10px" }}>✍️ پاسخ بده:</h4>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="متن پاسخ..."
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: "1.5px solid #e5e7eb",
                      fontFamily: "inherit",
                      marginBottom: "10px"
                    }}
                  ></textarea>
                  <button
                    className="save-btn"
                    onClick={handleReply}
                    style={{ padding: "10px 20px" }}
                  >
                    📤 ارسال پاسخ
                  </button>
                </div>
              ) : (
                <div style={{
                  padding: "15px",
                  background: "#fef3c7",
                  borderRadius: "10px",
                  textAlign: "center"
                }}>
                  ⚪ این تیکت بسته شده
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}


/* =========================
   TICKETS ADMIN PAGE (مدیر)
========================= */

function TicketsAdminPage({ currentUser, showToast, setPage, handleLogout, darkMode, setDarkMode }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [replyText, setReplyText] = useState("")
  const [showNewForm, setShowNewForm] = useState(false)
  const [newTicketForm, setNewTicketForm] = useState({ subject: "", message: "" })

  const loadTickets = () => {
    setLoading(true)
    authFetch("/api/tickets")
      .then((res) => res.json())
      .then((data) => {
        setTickets(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }

  const handleNewTicket = async (e) => {
    e.preventDefault()
    if (!newTicketForm.subject.trim() || !newTicketForm.message.trim()) {
      showToast("موضوع و متن رو پر کن", "warning")
      return
    }

    try {
      const response = await authFetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicketForm)
      })
      const data = await response.json()

      if (data.success) {
        showToast("تیکت ارسال شد", "success")
        setNewTicketForm({ subject: "", message: "" })
        setShowNewForm(false)
        loadTickets()
      } else {
        showToast(data.message || "خطا", "error")
      }
    } catch (error) {
      console.error(error)
      showToast("خطا در ارتباط با سرور", "error")
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const handleOpenTicket = (ticketId) => {
    authFetch(`/api/tickets/${ticketId}`)
      .then((res) => res.json())
      .then((data) => setSelectedTicket(data))
      .catch((err) => console.error(err))
  }

  const handleReply = async () => {
    if (!replyText.trim()) return

    try {
      const response = await authFetch(
        `/api/tickets/${selectedTicket.id}/reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: replyText })
        }
      )
      const data = await response.json()

      if (data.success) {
        setReplyText("")
        handleOpenTicket(selectedTicket.id)
        loadTickets()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleClose = async () => {
    try {
      await authFetch(`/api/tickets/${selectedTicket.id}/close`, {
        method: "PUT"
      })
      showToast("تیکت بسته شد", "success")
      handleOpenTicket(selectedTicket.id)
      loadTickets()
    } catch (error) {
      console.error(error)
    }
  }

  const handleReopen = async () => {
    try {
      await authFetch(`/api/tickets/${selectedTicket.id}/reopen`, {
        method: "PUT"
      })
      showToast("تیکت باز شد", "success")
      handleOpenTicket(selectedTicket.id)
      loadTickets()
    } catch (error) {
      console.error(error)
    }
  }

  const getStatusBadge = (status) => {
    if (status === "open") return { text: "🟢 باز", class: "status-approved" }
    return { text: "⚪ بسته", class: "status-pending" }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>🎫 مدیریت تیکت‌ها</h1>
          <p>مشاهده و پاسخ به تیکت‌های کاربران</p>
        </div>
              
      </header>

      {/* فرم ارسال تیکت جدید برای ادمین */}
      <div className="panel">
        <div className="panel-header">
          <h2>📝 ارسال تیکت جدید</h2>
          <button
            className="save-btn"
            onClick={() => setShowNewForm(!showNewForm)}
            style={{ padding: "8px 16px", fontSize: "13px" }}
          >
            {showNewForm ? "بستن" : "➕ ارسال تیکت جدید"}
          </button>
        </div>

        {showNewForm && (
          <form onSubmit={handleNewTicket} style={{ padding: "20px" }}>
            <div className="form-group">
              <label>موضوع</label>
              <input
                type="text"
                value={newTicketForm.subject}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                placeholder="موضوع تیکت"
                required
              />
            </div>

            <div className="form-group" style={{ marginTop: "15px" }}>
              <label>متن پیام</label>
              <textarea
                value={newTicketForm.message}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, message: e.target.value })}
                placeholder="متن پیام..."
                rows={5}
                required
              ></textarea>
            </div>

            <div className="form-actions" style={{ marginTop: "20px" }}>
              <button type="button" className="cancel-btn" onClick={() => setShowNewForm(false)}>
                انصراف
              </button>
              <button type="submit" className="save-btn">
                📤 ارسال تیکت
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>📋 همه تیکت‌ها</h2>
          <span>{tickets.length} تیکت</span>
        </div>

        {loading ? (
          <div className="empty-state">
            <div>⏳</div>
            <h3>در حال بارگذاری...</h3>
          </div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <div>🎫</div>
            <h3>هنوز تیکتی ارسال نشده</h3>
          </div>
        ) : (
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>ردیف</th>
                  <th>موضوع</th>
                  <th>کاربر</th>
                  <th>پاسخ‌ها</th>
                  <th>وضعیت</th>
                  <th>تاریخ</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t, index) => {
                  const badge = getStatusBadge(t.status)
                  return (
                    <tr key={t.id}>
                      <td>{index + 1}</td>
                      <td>
                        <span className="customer-name">{t.subject}</span>
                      </td>
                      <td>{t.user_name}</td>
                      <td>
                        <span className="weight-badge">{t.replies_count} پاسخ</span>
                      </td>
                      <td>
                        <span className={`status-badge ${badge.class}`}>{badge.text}</span>
                      </td>
                      <td>
                        <span className="date-badge">
                          📅 {toPersianDate(t.created_at?.split("T")[0])}
                        </span>
                      </td>
                      <td>
                        <button
                          className="save-btn"
                          style={{ padding: "6px 14px", fontSize: "12px" }}
                          onClick={() => handleOpenTicket(t.id)}
                        >
                          👁️ مشاهده
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* مودال جزئیات */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "700px", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="modal-header">
              <h2>🎫 {selectedTicket.subject}</h2>
              <button className="modal-close" onClick={() => setSelectedTicket(null)}>✕</button>
            </div>

            <div style={{ padding: "20px" }}>
              {/* پیام اصلی */}
              <div style={{
                padding: "15px",
                background: "#f9fafb",
                borderRadius: "10px",
                marginBottom: "20px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <strong>👤 {selectedTicket.user_name}</strong>
                  <small>{toPersianDate(selectedTicket.created_at?.split("T")[0])}</small>
                </div>
                <p style={{ margin: 0, lineHeight: "1.8" }}>{selectedTicket.message}</p>
              </div>

              {/* پاسخ‌ها */}
              {selectedTicket.replies?.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ marginBottom: "10px" }}>💬 پاسخ‌ها:</h4>
                  {selectedTicket.replies.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        padding: "12px 15px",
                        background: r.is_admin ? "#dbeafe" : "#f3f4f6",
                        borderRadius: "10px",
                        marginBottom: "10px",
                        borderRight: r.is_admin ? "4px solid #3b82f6" : "4px solid #9ca3af"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <strong>
                          {r.is_admin ? "👑 مدیر" : "👤 " + r.user_name}
                        </strong>
                        <small>{toPersianDate(r.created_at?.split("T")[0])}</small>
                      </div>
                      <p style={{ margin: 0, lineHeight: "1.8" }}>{r.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* فرم پاسخ */}
              {selectedTicket.status === "open" && (
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ marginBottom: "10px" }}>✍️ پاسخ بده:</h4>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="متن پاسخ..."
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: "1.5px solid #e5e7eb",
                      fontFamily: "inherit",
                      marginBottom: "10px"
                    }}
                  ></textarea>
                  <button
                    className="save-btn"
                    onClick={handleReply}
                    style={{ padding: "10px 20px" }}
                  >
                    📤 ارسال پاسخ
                  </button>
                </div>
              )}

              {/* دکمه بستن/بازکردن */}
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                {selectedTicket.status === "open" ? (
                  <button className="confirm-delete-btn" onClick={handleClose}>
                    🔒 بستن تیکت
                  </button>
                ) : (
                  <button className="save-btn" onClick={handleReopen}>
                    🔓 باز کردن دوباره
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
/* =========================
   REPORTS PAGE
========================= */

function ReportsPage({ setPage, currentUser, handleLogout, darkMode, setDarkMode }) {
  const reports = [
    {
      id: "products-stock",
      title: "موجودی محصولات",
      icon: "📦",
      desc: "موجودی هر محصول بر اساس سفارش و تولید",
      page: "products-stock",
      color: "#6366f1"
    },
    {
      id: "customer-report",
      title: "گزارش مشتریان",
      icon: "👥",
      desc: "گزارش سفارشات هر مشتری",
      page: "customer-report",
      color: "#8b5cf6"
    },
    {
      id: "orders-report",
      title: "گزارش سفارشات",
      icon: "📋",
      desc: "لیست کامل سفارشات ثبت‌شده",
      page: "orders-list",
      color: "#06b6d4"
    },
    {
      id: "production-report",
      title: "گزارش تولید",
      icon: "🏭",
      desc: "گزارش تولید روزانه کارخانه",
      page: "production-report",
      color: "#10b981"
    },
    {
      id: "shipment-report",
      title: "گزارش خروجی‌ها",
      icon: "📤",
      desc: "گزارش خروج کالا از کارخانه",
      page: "shipment-report",
      color: "#f59e0b"
    }
  ]

  return (
    <>
      <header className="topbar">
        <div>
          <h1>📊 گزارشات</h1>
          <p>دسترسی به همه گزارشات سیستم</p>
        </div>
             
      </header>

      <div className="reports-grid">
        {reports.map((report) => (
          <button
            key={report.id}
            className="report-card"
            onClick={() => setPage(report.page)}
            style={{ "--report-color": report.color }}
          >
            <div className="report-icon">{report.icon}</div>
            <div className="report-info">
              <h3>{report.title}</h3>
              <p>{report.desc}</p>
            </div>
            <div className="report-arrow">←</div>
          </button>
        ))}
      </div>
    </>
  )
}
/* =========================
   PRODUCTS STOCK PAGE
========================= */

function ProductsStockPage({ currentUser, setPage, handleLogout, darkMode, setDarkMode }) {
  const [stock, setStock] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("")

  const applySearch = () => {
    setSearchTerm(searchInput)
    setCurrentPage(1)
  }

  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
    const [sortBy, setSortBy] = useState("id")
  const [sortDir, setSortDir] = useState("desc")

  const loadStock = () => {
  setLoading(true)
  authFetch("/api/products-stock-full")
    .then((res) => res.json())
    .then((data) => {
      setStock(data || [])
      setLoading(false)
    })
    .catch((error) => {
      console.error(error)
      setLoading(false)
    })
}
  useEffect(() => {
    loadStock()
  }, [])

  // فیلتر

  const filteredStock = stock.filter((p) => {
    if (filterCategory && p.category !== filterCategory) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return p.name?.toLowerCase().includes(term)
    }
    return true
  })

  // مرتب‌سازی
  const sortedStock = [...filteredStock].sort((a, b) => {
    let valA, valB

    switch (sortBy) {
      case "ordered":
        valA = Number(a.ordered || 0)
        valB = Number(b.ordered || 0)
        break
      case "produced":
        valA = Number(a.produced || 0)
        valB = Number(b.produced || 0)
        break
      case "remaining":
        valA = Number(a.remaining || 0)
        valB = Number(b.remaining || 0)
        break
      case "name":
        valA = (a.name || "").toString()
        valB = (b.name || "").toString()
        break
      case "category":
        valA = (a.category || "").toString()
        valB = (b.category || "").toString()
        break
      default:
        valA = Number(a.id || 0)
        valB = Number(b.id || 0)
    }

    if (typeof valA === "string") {
      return sortDir === "asc"
        ? valA.localeCompare(valB, "fa")
        : valB.localeCompare(valA, "fa")
    }

    return sortDir === "asc" ? valA - valB : valB - valA
  })

  // صفحه‌بندی
  const totalPages = Math.ceil(sortedStock.length / perPage)
  const startIndex = (currentPage - 1) * perPage
  const currentStock = sortedStock.slice(startIndex, startIndex + perPage)

useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])

  // آمار کلی
  const totalOrdered = filteredStock.reduce((sum, p) => sum + Number(p.ordered || 0), 0)
  const totalProduced = filteredStock.reduce((sum, p) => sum + Number(p.produced || 0), 0)
  const totalRemaining = filteredStock.reduce((sum, p) => sum + Number(p.remaining || 0), 0)

  // لیست دسته‌ها
 const categories = [...new Set(stock.map((p) => p.category).filter(Boolean))]

  const handleClear = () => {
    setSearchInput("")
    setSearchTerm("")
    setFilterCategory("")
  }
  return (
    <>
      <header className="topbar">
        <div>
          <h1>📦 موجودی محصولات</h1>
          <p>گزارش موجودی هر محصول بر اساس سفارش و تولید</p>
        </div>
               
      </header>

      {/* آمار */}
      <section className="stats">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div>
          <span>کل سفارش شده</span>
<strong>{totalOrdered.toLocaleString()}</strong>
<small>عدد</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div>
          <span>کل تولید شده</span>
<strong>{totalProduced.toLocaleString()}</strong>
<small>عدد</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div>
           <span>کل باقی‌مانده</span>
<strong style={{ color: totalRemaining > 0 ? "#f59e0b" : "#10b981" }}>
  {totalRemaining.toLocaleString()}
</strong>
<small>عدد</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div>
            <span>تعداد محصولات</span>
            <strong>{filteredStock.length}</strong>
            <small>محصول</small>
          </div>
        </div>
      </section>

      {/* فیلترها */}
      <div className="panel">
        <div className="panel-header">
          <h2>🔍 فیلترها</h2>
        </div>

        <div className="search-bar-wrapper" style={{ maxWidth: "100%" }}>
          
          <input
            type="text"
            placeholder="جستجوی محصول..."
            value={searchInput}
            onChange={(e) => {
              const val = e.target.value
              setSearchInput(val)
              if (val === "") {
                setSearchTerm("")
                setCurrentPage(1)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch()
            }}
            className="search-bar-input"
          />
          {searchInput && (
            <button
              className="search-bar-clear"
              onClick={() => {
                setSearchInput("")
                setSearchTerm("")
                setCurrentPage(1)
              }}
            >
              ✕
            </button>
          )}
          <button
            type="button"
            className="search-bar-apply"
            onClick={applySearch}
          >
            اعمال فیلتر
          </button>
        </div>

          <div className="filter-row" style={{ position: "relative", zIndex: 10 }}>
          <div className="filter-item">
            <span className="filter-label">📁 دسته‌بندی</span>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value)
                setCurrentPage(1)
              }}
              className="filter-select-pretty"
              style={{
                width: "200px",
                fontFamily: "'Vazirmatn', 'Tahoma', sans-serif"
              }}
            >
              <option value="">همه دسته‌ها</option>
              {categories.map((cat, index) => (
                <option key={index} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <span className="filter-label">🔃 ترتیب</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value)
                setCurrentPage(1)
              }}
              className="filter-select-pretty"
            >
              <option value="id">پیش‌فرض</option>
              <option value="ordered">سفارش شده</option>
              <option value="produced">تولید شده</option>
              <option value="remaining">باقی‌مانده</option>
              <option value="name">نام محصول</option>
              <option value="category">دسته‌بندی</option>
            </select>
          </div>

          <div className="filter-item">
            <span className="filter-label">↕️ جهت</span>
            <select
              value={sortDir}
              onChange={(e) => {
                setSortDir(e.target.value)
                setCurrentPage(1)
              }}
              className="filter-select-pretty"
            >
              <option value="desc">بیشترین → کمترین</option>
              <option value="asc">کمترین → بیشترین</option>
            </select>
          </div>

          <button
            type="button"
            className="clear-filter-btn"
            onClick={() => {
              handleClear()
              setSortBy("id")
              setSortDir("desc")
            }}
          >
            🔄 پاک کردن
          </button>
        </div>
      </div>

      {/* جدول */}
          <div className="panel" style={{ position: "relative", zIndex: 1 }}>
        <div className="panel-header">
          <h2>📋 لیست موجودی</h2>
          <div className="table-actions">
            <span>{filteredStock.length} محصول</span>
            <button
              className="action-btn print-btn"
              onClick={() => printTable("products-stock-print", "موجودی محصولات")}
            >
              🖨️ چاپ
            </button>
            <button
              className="action-btn excel-btn"
              onClick={() => exportToExcel("products-stock-print", "products-stock")}
            >
              📊 Excel
            </button>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <div>⏳</div>
            <h3>در حال بارگذاری...</h3>
          </div>
        ) : filteredStock.length === 0 ? (
          <div className="empty-state">
            <div>📦</div>
            <h3>محصولی پیدا نشد</h3>
          </div>
        ) : (
          <>
            <TableControls
              totalItems={filteredStock.length}
              perPage={perPage}
              onPerPageChange={setPerPage}
            />

            <div className="orders-table-wrapper">
              <table className="orders-table" id="products-stock-print">
                <thead>
                  <tr>
                    <th>ردیف</th>
                    <th>محصول</th>
                    <th>دسته</th>
                    <th>سفارش شده</th>
                    <th>تولید شده</th>
                    <th>باقی‌مانده</th>
                    <th>وضعیت</th>
                  </tr>
                </thead>
<tbody>
                  {currentStock.map((product, index) => (
                    <tr key={product.id}>
                      <td>
                        <span className="row-number">{startIndex + index + 1}</span>
                      </td>
                      <td>
                        <span className="customer-name">{product.name}</span>
                      </td>
                      <td>
                        <span className="machine-badge">{product.category || "-"}</span>
                      </td>
                      <td>
                        <span className="weight-badge">
                          {Number(product.ordered || 0).toLocaleString()} عدد
                        </span>
                      </td>
                      <td>
                        <span className="weight-badge">
                          {Number(product.produced || 0).toLocaleString()} عدد
                        </span>
                      </td>
                      <td>
                        <strong style={{
                          color: product.remaining > 0 ? "#f59e0b" : "#10b981"
                        }}>
                          {Number(product.remaining || 0).toLocaleString()} عدد
                        </strong>
                      </td>
                      <td>
                        <span className={
                          product.status === "تکمیل شده" ? "priority-normal" :
                          product.status === "در حال تولید" ? "priority-urgent" :
                          "priority-normal"
                        }>
                          {product.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </>
  )
}
/* =========================
   CHAT BUTTON + CHAT MODAL
========================= */

function ChatButton({ currentUser, showToast }) {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const loadUnread = () => {
    if (!currentUser) return
    authFetch("/api/chat/unread-count")
      .then((res) => res.json())
      .then((data) => setUnreadCount(data.count || 0))
      .catch((err) => console.error(err))
  }

  useEffect(() => {
    if (!currentUser) return
    loadUnread()

    let interval = null

    const startPolling = () => {
      if (interval) return
      interval = setInterval(loadUnread, 5000)
    }

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
    }

    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        loadUnread()
        startPolling()
      }
    }

    startPolling()
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      stopPolling()
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [currentUser])
  const handleOpen = () => {
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    // وقتی بست، unread رو دوباره بگیر
    setTimeout(loadUnread, 500)
  }

  return (
    <>
      <button
        className={`chat-bell-btn ${unreadCount > 0 ? "has-unread" : ""}`}
        onClick={handleOpen}
        title="چت روم"
      >
                <MessageCircle size={20} strokeWidth={2.4} />
        {unreadCount > 0 && (
          <span className="chat-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && createPortal(
        <ChatModal
          currentUser={currentUser}
          onClose={handleClose}
          showToast={showToast}
        />,
        document.body
      )}
    </>
  )
}


function ChatModal({ currentUser, onClose, showToast }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState("")
  const [replyTo, setReplyTo] = useState(null)
  const [editingMsg, setEditingMsg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [viewingImage, setViewingImage] = useState(null)
  const messagesEndRef = useRef(null)
  const lastMessageIdRef = useRef(null)
  const audioRef = useRef(null)
  const imageInputRef = useRef(null)


  const loadMessages = () => {
    authFetch("/api/chat/messages")
      .then((res) => res.json())
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err))
  }

  const markRead = () => {
    authFetch("/api/chat/read", { method: "POST" })
      .catch((err) => console.error(err))
  }

  // ایجاد آبجکت صدا یک بار
  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3")
    audioRef.current.volume = 0.5

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    loadMessages()
    markRead()

    let interval = null

    const startPolling = () => {
      if (interval) return
      interval = setInterval(() => {
        loadMessages()
        markRead()
      }, 3000)
    }

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
    }

    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        loadMessages()
        markRead()
        startPolling()
      }
    }

    startPolling()
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      stopPolling()
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [])

  // فشرده‌سازی عکس قبل از آپلود
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target.result
        img.onload = () => {
          const canvas = document.createElement("canvas")
          const MAX_WIDTH = 800
          const scale = Math.min(1, MAX_WIDTH / img.width)
          canvas.width = img.width * scale
          canvas.height = img.height * scale

          const ctx = canvas.getContext("2d")
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          canvas.toBlob(
            (blob) => resolve(blob),
            "image/jpeg",
            0.7
          )
        }
        img.onerror = reject
      }
      reader.onerror = reject
    })
  }

  // انتخاب عکس
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      showToast("حجم عکس حداکثر باید ۵ مگابایت باشد", "warning")
      return
    }

    try {
      const compressedBlob = await compressImage(file)
      const previewUrl = URL.createObjectURL(compressedBlob)
      setSelectedImage({ blob: compressedBlob, preview: previewUrl, originalName: file.name })
    } catch (err) {
      console.error(err)
      showToast("خطا در پردازش عکس", "error")
    }

    e.target.value = ""
  }

  // پخش صدا و اسکرول وقتی پیام جدید از دیگری میاد
  useEffect(() => {
    if (messages.length === 0) return

    const lastMsg = messages[messages.length - 1]

    if (lastMessageIdRef.current === null) {
      lastMessageIdRef.current = lastMsg.id
      return
    }

    if (lastMsg.id !== lastMessageIdRef.current) {
      lastMessageIdRef.current = lastMsg.id

      if (lastMsg.user_id !== currentUser?.id) {
        audioRef.current?.play().catch(() => {})
      }

      // اسکرول به پایین وقتی پیام جدید اومد
      setTimeout(() => {
        if (messagesEndRef.current) {
          const container = messagesEndRef.current.parentElement
          if (container) {
            container.scrollTop = container.scrollHeight
          }
        }
      }, 150)
    }
  }, [messages, currentUser])

  // قفل کردن اسکرول صفحه پشت مودال
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])
  // اسکرول خودکار به آخر
  useEffect(() => {
    const timer = setTimeout(() => {
      if (messagesEndRef.current) {
        const container = messagesEndRef.current.parentElement
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      }
    }, 150)
    return () => clearTimeout(timer)
  }, [messages.length])

  const handleSend = async () => {
    if (!text.trim() && !selectedImage) return

    setLoading(true)
    try {
      let uploadedImageUrl = null
      let uploadedImageType = null

      // اگه عکس انتخاب شده، اول آپلود کن
      if (selectedImage && !editingMsg) {
        const formData = new FormData()
        formData.append("image", selectedImage.blob, selectedImage.originalName || "image.jpg")

        const uploadRes = await authFetch("/api/chat/upload", {
          method: "POST",
          body: formData
        })
        const uploadData = await uploadRes.json()

        if (!uploadData.success) {
          showToast(uploadData.message || "خطا در آپلود عکس", "error")
          setLoading(false)
          return
        }

        uploadedImageUrl = uploadData.image_url
        uploadedImageType = uploadData.image_type
      }

      const url = editingMsg
        ? `/api/chat/messages/${editingMsg.id}`
        : "/api/chat/messages"

      const method = editingMsg ? "PUT" : "POST"

      const response = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          reply_to_id: replyTo?.id || null,
          image_url: uploadedImageUrl,
          image_type: uploadedImageType
        })
      })

      const data = await response.json()

      if (data.success) {
        setText("")
        setReplyTo(null)
        setEditingMsg(null)
        setSelectedImage(null)
        loadMessages()
      } else {
        showToast(data.message || "خطا در ارسال", "error")
      }
    } catch (error) {
      console.error(error)
      showToast("خطا در ارتباط با سرور", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (msg) => {
    // چک کن که از ۱ دقیقه نگذشته باشه
    const createdAt = new Date(msg.created_at + "Z").getTime()
    const now = Date.now()
    const diffMinutes = (now - createdAt) / 1000 / 60

    if (diffMinutes > 1) {
      showToast("زمان ویرایش (۱ دقیقه) گذشته است", "warning")
      return
    }

    setEditingMsg(msg)
    setText(msg.message)
    setReplyTo(null)
  }

const [deleteTarget, setDeleteTarget] = useState(null)

const handleDelete = (msg) => {
  setDeleteTarget(msg)
}

const confirmDelete = async () => {
  if (!deleteTarget) return

  try {
    const response = await authFetch(`/api/chat/messages/${deleteTarget.id}`, {
      method: "DELETE"
    })
    const data = await response.json()

    if (data.success) {
      showToast("پیام حذف شد", "success")
      setDeleteTarget(null)
      loadMessages()
    } else {
      showToast(data.message || "خطا در حذف", "error")
    }
  } catch (error) {
    console.error(error)
    showToast("خطا در حذف", "error")
  }
}

  const handleReply = (msg) => {
    setReplyTo(msg)
    setEditingMsg(null)
    setText("")
  }

  const cancelReply = () => {
    setReplyTo(null)
  }

  const cancelEdit = () => {
    setEditingMsg(null)
    setText("")
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ""
    try {
      const d = new Date(dateStr + "Z")
      return d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
    } catch (e) {
      return ""
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ""
    try {
      const d = new Date(dateStr + "Z")
      return d.toLocaleDateString("fa-IR")
    } catch (e) {
      return ""
    }
  }

  // آیا کاربر می‌تونه ویرایش کنه؟ (۱ دقیقه چک)
  const canEdit = (msg) => {
    if (msg.user_id !== currentUser?.id) return false
    const createdAt = new Date(msg.created_at + "Z").getTime()
    const now = Date.now()
    const diffMinutes = (now - createdAt) / 1000 / 60
    return diffMinutes <= 1
  }

  // گروه‌بندی پیام‌ها بر اساس تاریخ
  const groupedMessages = () => {
    const groups = []
    let currentDate = null

    messages.forEach((msg) => {
      const date = formatDate(msg.created_at)
      if (date !== currentDate) {
        currentDate = date
        groups.push({ type: "date", date, key: `date-${msg.id}` })
      }
      groups.push({ type: "message", msg, key: `msg-${msg.id}` })
    })

    return groups
  }

  return (
    <div className="chat-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        {/* هدر */}
        <div className="chat-header">
          <div className="chat-header-title">
            <span className="chat-header-icon">💬</span>
            <div>
              <strong>چت روم</strong>
              <small>گفتگوی تیمی</small>
            </div>
          </div>
          <button className="chat-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* لیست پیام‌ها */}
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <div style={{ fontSize: "48px" }}>💬</div>
              <h3>هنوز پیامی نیست</h3>
              <p>اولین پیام رو تو بفرست!</p>
            </div>
          ) : (
            groupedMessages().map((item) => {
              if (item.type === "date") {
                return (
                  <div key={item.key} className="chat-date-divider">
                    <span>{item.date}</span>
                  </div>
                )
              }

              const msg = item.msg
              const isMine = msg.user_id === currentUser?.id

              return (
                <div
                  key={item.key}
                  className={`chat-message ${isMine ? "mine" : "other"}`}
                >
                 <div className="chat-message-bubble">
  <div className="chat-message-author">
    {msg.user_full_name || msg.user_name}
  </div>

                    {msg.reply_to_id && msg.reply_message && (
                      <div className="chat-reply-preview">
                        <div className="chat-reply-author">
                          ↩ {msg.reply_user_full_name || msg.reply_user_name}
                        </div>
                        <div className="chat-reply-text">
                          {msg.reply_is_deleted ? "پیام حذف شده" : msg.reply_message}
                        </div>
                      </div>
                    )}

                    {msg.image_url && (
                      <div className="chat-message-image">
                        <img
                          src={msg.image_url.startsWith("http") ? msg.image_url : `${window.location.origin}${msg.image_url.startsWith("/") ? "" : "/"}${msg.image_url}`}
                          alt="عکس چت"
                          loading="lazy"
                          onClick={(e) => setViewingImage(e.target.src)}
                        />
                      </div>
                    )}
                    {msg.message && (
                      <div className="chat-message-text">{msg.message}</div>
                    )}

                    <div className="chat-message-meta">
                      <span>{formatTime(msg.created_at)}</span>
                      {msg.is_edited === 1 && (
                        <span className="chat-edited-badge">ویرایش شده</span>
                      )}
                    </div>

                    <div className="chat-message-actions">
                      <button
                        className="chat-action-btn"
                        onClick={() => handleReply(msg)}
                        title="پاسخ"
                      >
                        <Reply size={13} />
                      </button>

                      {isMine && canEdit(msg) && (
                        <button
                          className="chat-action-btn"
                          onClick={() => handleEdit(msg)}
                          title="ویرایش"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}

                      {isMine && (
                        <button
                          className="chat-action-btn danger"
                          onClick={() => handleDelete(msg)}
                          title="حذف"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* پیش‌نمایش ریپلای یا ویرایش */}
        {replyTo && (
          <div className="chat-input-preview reply">
            <div>
              <small>پاسخ به {replyTo.user_full_name || replyTo.user_name}:</small>
              <div className="chat-preview-text">{replyTo.message}</div>
            </div>
            <button onClick={cancelReply}><X size={16} /></button>
          </div>
        )}

        {editingMsg && (
          <div className="chat-input-preview edit">
            <div>
              <small>✏️ در حال ویرایش پیام:</small>
              <div className="chat-preview-text">{editingMsg.message}</div>
            </div>
            <button onClick={cancelEdit}><X size={16} /></button>
          </div>
        )}

        {/* پیش‌نمایش عکس انتخاب شده */}
        {selectedImage && (
          <div className="chat-image-preview">
            <img src={selectedImage.preview} alt="پیش‌نمایش" />
            <button
              type="button"
              className="chat-image-remove"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
          </div>
        )}

        {/* فرم ارسال */}
        <div className="chat-input-row">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageSelect}
          />
          <button
            type="button"
            className="chat-image-btn"
            onClick={() => imageInputRef.current?.click()}
            title="ارسال عکس"
            disabled={loading || !!editingMsg}
          >
            📷
          </button>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="پیامت رو بنویس..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            disabled={loading}
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={loading || (!text.trim() && !selectedImage)}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {deleteTarget && (
        <div className="chat-confirm-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="chat-confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="chat-confirm-icon">🗑️</div>
            <h3>حذف پیام</h3>
            <p>آیا مطمئنی می‌خوای این پیام رو حذف کنی؟</p>
            <div className="chat-confirm-preview">
              {deleteTarget.message}
            </div>
            <div className="chat-confirm-actions">
              <button
                className="chat-confirm-cancel"
                onClick={() => setDeleteTarget(null)}
              >
                انصراف
              </button>
              <button
                className="chat-confirm-delete"
                onClick={confirmDelete}
              >
                🗑️ بله، حذف کن
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingImage && createPortal(
        <div 
          className="chat-image-lightbox" 
          onClick={() => setViewingImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999999,
            background: "rgba(0, 0, 0, 0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            cursor: "zoom-out"
          }}
        >
          <button 
            className="chat-image-lightbox-close"
            onClick={() => setViewingImage(null)}
            style={{
              position: "fixed",
              top: "20px",
              left: "20px",
              zIndex: 100000000,
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              border: "none",
              background: "rgba(255, 255, 255, 0.15)",
              color: "#fff",
              fontSize: "22px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(10px)"
            }}
          >
            ✕
          </button>
          <img 
            src={viewingImage} 
            alt="نمایش عکس" 
            onClick={(e) => e.stopPropagation()}
            onError={(e) => {
              console.error("خطا در لود عکس:", viewingImage)
              e.target.style.display = "none"
            }}
            style={{
              maxWidth: "95vw",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: "12px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6)",
              cursor: "default",
              display: "block"
            }}
          />
        </div>,
        document.body
      )}
    </div>
  )
}
/* =========================
   DELETE REASON MODAL
========================= */

function DeleteReasonModal({ title, itemName, onConfirm, onClose }) {
  const [reason, setReason] = useState("")

  const handleSubmit = () => {
    if (!reason.trim()) {
      return
    }
    onConfirm(reason.trim())
  }

  // قفل کردن اسکرول صفحه پشت مودال
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box delete-reason-modal" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-icon">🗑️</div>
        <h2>{title || "حذف آیتم"}</h2>
        <p>
          آیا مطمئنی می‌خوای <strong>{itemName}</strong> رو حذف کنی؟
          <br />
          <span style={{ color: "#f59e0b", fontWeight: "700", fontSize: "12px" }}>
            این آیتم به آرشیو منتقل میشه و می‌تونی بعداً بازیابیش کنی.
          </span>
        </p>

        <div className="form-group" style={{ textAlign: "right", marginTop: "15px" }}>
          <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>
            دلیل حذف <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="مثلاً: اشتباهی ثبت شده بود..."
            rows={3}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "1.5px solid #e5e7eb",
              fontFamily: "inherit",
              marginTop: "6px",
              fontSize: "13px",
              outline: "none",
              resize: "vertical"
            }}
            autoFocus
          ></textarea>
          {!reason.trim() && (
            <small style={{
              color: "#94a3b8",
              fontSize: "11px",
              marginTop: "4px",
              display: "block"
            }}>
              ⚠️ وارد کردن دلیل حذف اجباری است
            </small>
          )}
        </div>

        <div className="delete-modal-actions" style={{ marginTop: "20px" }}>
          <button className="cancel-btn" onClick={onClose}>
            انصراف
          </button>
          <button
            className="confirm-delete-btn"
            onClick={handleSubmit}
            disabled={!reason.trim()}
            style={!reason.trim() ? { opacity: 0.5, cursor: "not-allowed" } : {}}
          >
            🗑️ بله، حذف کن
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
/* =========================
   DELETE BLOCKED MODAL
========================= */

function DeleteBlockedModal({ title, message, details, onClose }) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box delete-blocked-modal" onClick={(e) => e.stopPropagation()}>
        <div className="delete-blocked-icon">🚫</div>
        <h2>{title || "امکان حذف وجود ندارد"}</h2>
        <p className="delete-blocked-message">{message}</p>

        {details && details.length > 0 && (
          <div className="delete-blocked-details">
            <h4>📋 جزئیات خروجی‌های تأیید شده:</h4>
            <div className="delete-blocked-list">
              {details.map((d, i) => (
                <div key={i} className="delete-blocked-item">
                  <span className="delete-blocked-product">🧱 {d.product_name}</span>
                  <span className="delete-blocked-info">
                    {Number(d.quantity || 0).toLocaleString()} عدد | 📅 {toPersianDate(d.exit_date)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="delete-modal-actions" style={{ marginTop: "20px" }}>
          <button
            className="save-btn"
            onClick={onClose}
            style={{ width: "100%" }}
          >
            متوجه شدم
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
/* =========================
   ARCHIVE PAGE
========================= */

function ArchivePage({ currentUser, showToast, setPage, handleLogout, darkMode, setDarkMode }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterFrom, setFilterFrom] = useState("")
  const [filterTo, setFilterTo] = useState("")
  const [restoreConfirm, setRestoreConfirm] = useState(null)
  const [permanentDeleteConfirm, setPermanentDeleteConfirm] = useState(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const applySearch = () => {
    setSearchTerm(searchInput)
    setCurrentPage(1)
  }

  const loadArchive = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterType) params.append("type", filterType)
    if (searchTerm) params.append("search", searchTerm)
    if (filterFrom) params.append("from_date", filterFrom)
    if (filterTo) params.append("to_date", filterTo)

    authFetch(`/api/archive?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadArchive()
  }, [filterType, searchTerm, filterFrom, filterTo])

  const handleClear = () => {
    setFilterType("")
    setSearchInput("")
    setSearchTerm("")
    setFilterFrom("")
    setFilterTo("")
    setCurrentPage(1)
  }

  const handleRestore = async () => {
    if (!restoreConfirm) return

    try {
      const response = await authFetch(
        `/api/archive/${restoreConfirm.type}/${restoreConfirm.id}/restore`,
        { method: "PUT" }
      )
      const data = await response.json()

      if (data.success) {
        showToast("♻️ آیتم با موفقیت بازیابی شد", "success")
        setRestoreConfirm(null)
        loadArchive()
      } else {
        showToast(data.message || "خطا در بازیابی", "error")
      }
    } catch (error) {
      console.error(error)
      showToast("خطا در ارتباط با سرور", "error")
    }
  }

  const handlePermanentDelete = async () => {
    if (!permanentDeleteConfirm) return

    try {
      const response = await authFetch(
        `/api/archive/${permanentDeleteConfirm.type}/${permanentDeleteConfirm.id}/permanent`,
        { method: "DELETE" }
      )
      const data = await response.json()

      if (data.success) {
        showToast("🗑️ آیتم برای همیشه حذف شد", "success")
        setPermanentDeleteConfirm(null)
        loadArchive()
      } else {
        showToast(data.message || "خطا در حذف", "error")
      }
    } catch (error) {
      console.error(error)
      showToast("خطا در ارتباط با سرور", "error")
    }
  }

  const getTypeBadge = (type) => {
    const map = {
      orders: { text: "📋 سفارش", class: "type-orders" },
      customers: { text: "👥 مشتری", class: "type-customers" },
      production: { text: "🏭 تولید", class: "type-production" },
      exits: { text: "📤 خروجی", class: "type-exits" },
      products: { text: "📦 محصول", class: "type-products" }
    }
    return map[type] || { text: type, class: "" }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "-"
    try {
      const d = new Date(dateStr + "Z")
      return d.toLocaleString("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      })
    } catch (e) {
      return dateStr
    }
  }

  const totalPages = Math.ceil(items.length / perPage)
  const startIndex = (currentPage - 1) * perPage
  const currentItems = items.slice(startIndex, startIndex + perPage)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])

  return (
    <>
      <header className="topbar">
        <div>
          <h1>🗄️ آرشیو حذف‌شده‌ها</h1>
          <p>مشاهده، بازیابی یا حذف کامل آیتم‌های حذف‌شده</p>
        </div>
      </header>

      {/* آمار */}
      <section className="stats">
        <div className="stat-card">
          <div className="stat-icon">🗄️</div>
          <div>
            <span>کل آیتم‌های آرشیو</span>
            <strong>{items.length}</strong>
            <small>آیتم</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div>
            <span>سفارش‌های حذف‌شده</span>
            <strong>{items.filter((i) => i.type === "orders").length}</strong>
            <small>سفارش</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div>
            <span>مشتریان حذف‌شده</span>
            <strong>{items.filter((i) => i.type === "customers").length}</strong>
            <small>مشتری</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📤</div>
          <div>
            <span>خروجی‌های حذف‌شده</span>
            <strong>{items.filter((i) => i.type === "exits").length}</strong>
            <small>خروجی</small>
          </div>
        </div>
      </section>

      {/* فیلترها */}
      <div className="panel" style={{ position: "relative", zIndex: 100 }}>
        <div className="panel-header">
          <h2>🔍 فیلتر آرشیو</h2>
        </div>

        <div className="search-bar-wrapper" style={{ maxWidth: "100%", marginBottom: "15px" }}>
          <input
            type="text"
            placeholder="جستجو در نام، دلیل حذف یا کاربری که حذف کرده..."
            value={searchInput}
            onChange={(e) => {
              const val = e.target.value
              setSearchInput(val)
              if (val === "") {
                setSearchTerm("")
                setCurrentPage(1)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch()
            }}
            className="search-bar-input"
          />
          {searchInput && (
            <button
              className="search-bar-clear"
              onClick={() => {
                setSearchInput("")
                setSearchTerm("")
                setCurrentPage(1)
              }}
            >
              ✕
            </button>
          )}
          <button
            type="button"
            className="search-bar-apply"
            onClick={applySearch}
          >
            اعمال فیلتر
          </button>
        </div>

        <div className="filter-row" style={{ position: "relative", zIndex: 1 }}>
          <div className="filter-item">
            <span className="filter-label">🏷 نوع</span>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value)
                setCurrentPage(1)
              }}
              className="filter-select-pretty"
            >
              <option value="">همه انواع</option>
              <option value="orders">📋 سفارش</option>
              <option value="customers">👥 مشتری</option>
              <option value="production">🏭 تولید</option>
              <option value="exits">📤 خروجی</option>
              <option value="products">📦 محصول</option>
            </select>
          </div>

          <div className="filter-item">
            <span className="filter-label">📅 از تاریخ حذف</span>
            <PersianDateInput
              value={filterFrom}
              onChange={(date) => {
                setFilterFrom(date)
                setCurrentPage(1)
              }}
              placeholder="از تاریخ"
            />
          </div>

          <div className="filter-item">
            <span className="filter-label">📅 تا تاریخ حذف</span>
            <PersianDateInput
              value={filterTo}
              onChange={(date) => {
                setFilterTo(date)
                setCurrentPage(1)
              }}
              placeholder="تا تاریخ"
            />
          </div>

          <button
            type="button"
            className="clear-filter-btn"
            onClick={handleClear}
          >
            🔄 پاک کردن
          </button>
        </div>
      </div>

      {/* لیست */}
      <div className="panel" style={{ position: "relative", zIndex: 1 }}>
        <div className="panel-header">
          <h2>📋 لیست آرشیو</h2>
          <span>{items.length} آیتم</span>
        </div>

        {loading ? (
          <div className="empty-state">
            <div>⏳</div>
            <h3>در حال بارگذاری...</h3>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div>🗄️</div>
            <h3>آرشیو خالیه</h3>
            <p>هیچ آیتم حذف‌شده‌ای برای نمایش وجود نداره.</p>
          </div>
        ) : (
          <>
            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>ردیف</th>
                    <th>نوع</th>
                    <th>نام / عنوان</th>
                    <th>تاریخ حذف</th>
                    <th>حذف‌کننده</th>
                    <th>دلیل حذف</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item, index) => {
                    const badge = getTypeBadge(item.type)
                    return (
                      <tr key={`${item.type}-${item.id}`}>
                        <td>
                          <span className="row-number">{startIndex + index + 1}</span>
                        </td>
                        <td>
                          <span className={`archive-type-badge ${badge.class}`}>
                            {badge.text}
                          </span>
                        </td>
                        <td>
                          <span className="customer-name">{item.name}</span>
                        </td>
                        <td>
                          <span className="date-badge">
                            📅 {formatDate(item.deleted_at)}
                          </span>
                        </td>
                        <td>
                          <span className="notes-text">
                            👤 {item.deleted_by || "-"}
                          </span>
                        </td>
                        <td>
                          <span className="notes-text">
                            {item.delete_reason || "—"}
                          </span>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="archive-restore-btn"
                              onClick={() => setRestoreConfirm(item)}
                              title="بازیابی"
                            >
                              ♻️
                            </button>
                            <button
                              className="row-btn delete-btn"
                              onClick={() => setPermanentDeleteConfirm(item)}
                              title="حذف کامل"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <TableControls
              totalItems={items.length}
              perPage={perPage}
              onPerPageChange={setPerPage}
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* مودال تأیید بازیابی */}
      {restoreConfirm && (
        <div className="modal-overlay" onClick={() => setRestoreConfirm(null)}>
          <div className="modal-box delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">♻️</div>
            <h2>بازیابی آیتم</h2>
            <p>
              آیا می‌خوای <strong>{restoreConfirm.name}</strong> رو بازیابی کنی؟
              <br />
              این آیتم به لیست اصلی برمی‌گرده.
            </p>

            <div className="delete-modal-actions">
              <button className="cancel-btn" onClick={() => setRestoreConfirm(null)}>
                انصراف
              </button>
              <button
                className="confirm-restore-btn"
                onClick={handleRestore}
              >
                ♻️ بله، بازیابی کن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال تأیید حذف کامل */}
      {permanentDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setPermanentDeleteConfirm(null)}>
          <div className="modal-box delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">⚠️</div>
            <h2>حذف کامل</h2>
            <p>
              آیا مطمئنی می‌خوای <strong>{permanentDeleteConfirm.name}</strong> رو برای همیشه حذف کنی؟
              <br />
              <strong style={{ color: "#ef4444" }}>
                این عمل قابل بازگشت نیست!
              </strong>
            </p>

            <div className="delete-modal-actions">
              <button className="cancel-btn" onClick={() => setPermanentDeleteConfirm(null)}>
                انصراف
              </button>
              <button
                className="confirm-delete-btn"
                onClick={handlePermanentDelete}
              >
                🗑️ بله، برای همیشه حذف کن
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


/* =========================
   NOTIFICATION BELL (زنگ نوتیفیکیشن)
========================= */

function NotificationBell({ currentUser, setPage, setShowMobileMenu }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  const loadNotifications = () => {
    authFetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => setNotifications(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err))

    authFetch("/api/notifications/unread-count")
      .then((res) => res.json())
      .then((data) => setUnreadCount(data.count || 0))
      .catch((err) => console.error(err))
  }

  useEffect(() => {
    if (!currentUser) return
    loadNotifications()

    let interval = null

    const startPolling = () => {
      if (interval) return
      interval = setInterval(loadNotifications, 5000)
    }

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
    }

    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        loadNotifications()
        startPolling()
      }
    }

    startPolling()
    document.addEventListener("visibilitychange", handleVisibility)

    // گوش دادن به event آپدیت
    const handleUpdate = () => {
      loadNotifications()
    }
    window.addEventListener("notifications-updated", handleUpdate)

    return () => {
      stopPolling()
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("notifications-updated", handleUpdate)
    }
  }, [currentUser])

  // بستن با کلیک بیرون
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleOpen = () => {
    setIsOpen(!isOpen)
    if (setShowMobileMenu) {
      setShowMobileMenu(false)
    }
    // بستن منوی کاربر اگه بازه
    const userMenu = document.querySelector(".user-dropdown-menu")
    if (userMenu) {
      const event = new MouseEvent("mousedown", { bubbles: true })
      document.dispatchEvent(event)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await authFetch("/api/notifications/read-all", {
        method: "PUT"
      })
      loadNotifications()
      // به NotificationBell بگو آپدیت کنه
      window.dispatchEvent(new Event("notifications-updated"))
    } catch (error) {
      console.error(error)
    }
  }
  // فقط توی NotificationBell - پروپ جدید setPage رو استفاده می‌کنه
  const handleClickNotification = async (notif) => {
    try {
      await authFetch(`/api/notifications/${notif.id}/read`, {
        method: "PUT"
      })

      setIsOpen(false)

      // اگه نوتیفیکیشن مربوط به خروجی بود، ببرش به صفحه مربوطه
      if (notif.exit_id && notif.title && notif.title.includes("خروجی جدید در انتظار تأیید")) {
        if (currentUser?.role === "finance") {
          setPage("shipment-approve")
        } else {
          setPage("shipment-create")
        }
      } else {
        // بقیه نوتیفیکیشن‌ها → صفحه همه نوتیفیکیشن‌ها
        setPage("notifications")
      }

      loadNotifications()
    } catch (error) {
      console.error(error)
    }
  }

  const getIcon = (type) => {
    if (type === "success") return "✅"
    if (type === "error") return "❌"
    if (type === "warning") return "⚠️"
    return "🔔"
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ""
    try {
      const d = new Date(dateStr)
      return d.toLocaleString("fa-IR")
    } catch (e) {
      return ""
    }
  }

  return (
    <div className="notification-bell-wrapper" ref={containerRef} style={isOpen ? { zIndex: 9999999 } : {}}>
      <button
        className="notification-bell-btn"
        onClick={handleOpen}
        title="نوتیفیکیشن‌ها"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <strong>🔔 نوتیفیکیشن‌ها</strong>
            {unreadCount > 0 && (
              <button
                className="notification-mark-read"
                onClick={handleMarkAllRead}
              >
                خواندن همه
              </button>
            )}
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                🔔 نوتیفیکیشنی نداری
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notification-item ${n.is_read ? "" : "unread"}`}
                  onClick={() => handleClickNotification(n)}
                >
                  <div className="notification-icon">{getIcon(n.type)}</div>
                  <div className="notification-content">
                    <div className="notification-title">{n.title}</div>
                    <div className="notification-message">{n.message}</div>
                    <div className="notification-date">{formatDate(n.created_at)}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="notification-footer">
            <button
              className="notification-see-all"
              onClick={() => {
                setPage("notifications")
                setIsOpen(false)
              }}
            >
              📋 مشاهده همه نوتیفیکیشن‌ها
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
/* =========================
   NOTIFICATIONS PAGE
========================= */

function NotificationsPage({ currentUser, setPage, handleLogout, darkMode, setDarkMode }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterType, setFilterType] = useState("")

  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [sortOrder, setSortOrder] = useState("newest")
   const applySearch = () => {
    setSearchTerm(searchInput)
    setCurrentPage(1)
  }

  const loadNotifications = () => {
    setLoading(true)

    const params = new URLSearchParams()
    if (searchTerm) params.append("search", searchTerm)
    if (filterStatus) params.append("status", filterStatus)
    if (filterType) params.append("type", filterType)
    authFetch(`/api/notifications/all?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setNotifications(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch((error) => {
        console.error("خطا در دریافت نوتیفیکیشن‌ها:", error)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadNotifications()
  }, [searchTerm, filterStatus, filterType])

  const sortedNotifications = [...notifications].sort((a, b) => {
    const dateA = a.created_at || ""
    const dateB = b.created_at || ""
    return sortOrder === "newest"
      ? dateB.localeCompare(dateA)
      : dateA.localeCompare(dateB)
  })

  const totalPages = Math.ceil(sortedNotifications.length / perPage)
  const startIndex = (currentPage - 1) * perPage
  const currentNotifications = sortedNotifications.slice(startIndex, startIndex + perPage)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])

  const handleClear = () => {
    setSearchInput("")
    setSearchTerm("")
    setFilterStatus("")
    setFilterType("")
    setCurrentPage(1)
  }

  const handleMarkAllRead = async () => {
    try {
      await authFetch("/api/notifications/read-all", {
        method: "PUT"
      })
      loadNotifications()
    } catch (error) {
      console.error(error)
    }
  }

  const handleMarkRead = async (id) => {
    try {
      await authFetch(`/api/notifications/${id}/read`, {
        method: "PUT"
      })
      loadNotifications()
      // به NotificationBell بگو آپدیت کنه
      window.dispatchEvent(new Event("notifications-updated"))
    } catch (error) {
      console.error(error)
    }
  }

   const handleClickNotification = async (notif) => {
    if (!notif.is_read) {
      await handleMarkRead(notif.id)
    }

    // اگه نوتیفیکیشن مربوط به خروجی بود، ببرش به صفحه مربوطه
    if (notif.exit_id && notif.title && notif.title.includes("خروجی جدید در انتظار تأیید")) {
      if (currentUser?.role === "finance") {
        setPage("shipment-approve")
      } else {
        setPage("shipment-create")
      }
    }
  }

  const getIcon = (type) => {
    if (type === "success") return "✅"
    if (type === "error") return "❌"
    if (type === "warning") return "⚠️"
    return "🔔"
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ""
    try {
      const d = new Date(dateStr)
      return d.toLocaleString("fa-IR")
    } catch (e) {
      return ""
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <>
      <header className="topbar">
        <div>
          <h1>🔔 نوتیفیکیشن‌ها</h1>
          <p>مشاهده و جستجوی همه اعلان‌های سیستم</p>
        </div>
      </header>

      {/* آمار */}
      <section className="stats">
        <div className="stat-card">
          <div className="stat-icon">🔔</div>
          <div>
            <span>کل نوتیفیکیشن‌ها</span>
            <strong>{notifications.length}</strong>
            <small>اعلان</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📬</div>
          <div>
            <span>خوانده‌نشده</span>
            <strong style={{ color: unreadCount > 0 ? "#f59e0b" : "#10b981" }}>
              {unreadCount}
            </strong>
            <small>اعلان</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div>
            <span>خوانده‌شده</span>
            <strong>{notifications.length - unreadCount}</strong>
            <small>اعلان</small>
          </div>
        </div>
      </section>

      {/* فیلترها */}
      <div className="panel">
        <div className="panel-header">
          <h2>🔍 جستجو و فیلتر</h2>
          {unreadCount > 0 && (
            <button
              className="save-btn"
              style={{ padding: "8px 16px", fontSize: "12px" }}
              onClick={handleMarkAllRead}
            >
              ✅ خواندن همه
            </button>
          )}
        </div>

        <div className="search-bar-wrapper" style={{ maxWidth: "100%", marginBottom: "18px" }}>
          
          <input
            type="text"
            placeholder="جستجو در عنوان و متن نوتیفیکیشن..."
            value={searchInput}
            onChange={(e) => {
              const val = e.target.value
              setSearchInput(val)
              if (val === "") {
                setSearchTerm("")
                setCurrentPage(1)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch()
            }}
            className="search-bar-input"
          />
          {searchInput && (
            <button
              className="search-bar-clear"
              onClick={() => {
                setSearchInput("")
                setSearchTerm("")
                setCurrentPage(1)
              }}
            >
              ✕
            </button>
          )}
          <button
            type="button"
            className="search-bar-apply"
            onClick={applySearch}
          >
            اعمال فیلتر
          </button>
        </div>

        <div className="filter-row" style={{ position: "relative", zIndex: 10 }}>
          <div className="filter-item">
            <span className="filter-label">📊 وضعیت</span>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="filter-select-pretty"
            >
              <option value="">همه</option>
              <option value="unread">📬 خوانده‌نشده</option>
              <option value="read">✅ خوانده‌شده</option>
            </select>
          </div>

          <div className="filter-item">
                      <span className="filter-label">🏷 نوع</span>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value)
                setCurrentPage(1)
              }}
              className="filter-select-pretty"
            >
              <option value="">همه انواع</option>
              <option value="success">✅ موفقیت</option>
              <option value="error">❌ خطا</option>
              <option value="warning">⚠️ هشدار</option>
              <option value="info">🔔 اطلاع</option>
            </select>
          </div>

          <button
            type="button"
            className="clear-filter-btn"
            onClick={handleClear}
          >
            🔄 پاک کردن
          </button>
        </div>
      </div>

      {/* لیست */}
      <div className="panel">
        <div className="panel-header">
          <h2>📋 لیست نوتیفیکیشن‌ها</h2>
          <span>{notifications.length} اعلان</span>
        </div>

        {loading ? (
          <div className="empty-state">
            <div>⏳</div>
            <h3>در حال بارگذاری...</h3>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div>🔔</div>
            <h3>نوتیفیکیشنی پیدا نشد</h3>
            <p>با این فیلترها نوتیفیکیشنی وجود نداره.</p>
          </div>
        ) : (
          <>
            <TableControls
              totalItems={notifications.length}
              perPage={perPage}
              onPerPageChange={setPerPage}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
            />

            <div className="notifications-page-list">
              {currentNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`notification-page-card ${n.is_read ? "" : "unread"}`}
                  onClick={() => handleClickNotification(n)}
                >
                  <div className="notification-page-icon">{getIcon(n.type)}</div>
                  <div className="notification-page-content">
                    <div className="notification-page-title">{n.title}</div>
                    <div className="notification-page-message">{n.message}</div>
                    <div className="notification-page-date">📅 {formatDate(n.created_at)}</div>
                  </div>
                  {!n.is_read && (
                    <div className="notification-page-unread-badge">جدید</div>
                  )}
                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </>
  )
}

/* =========================
   USER MENU (منوی کشویی کاربر)
========================= */

function UserMenu({ currentUser, setPage, handleLogout, darkMode, setDarkMode, showToast, setShowMobileMenu, setShowProfileModal, setShowDeveloperInfo }) {
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleOpenMenu = () => {
    setShowUserMenu(!showUserMenu)
    if (setShowMobileMenu) {
      setShowMobileMenu(false)
    }
  }

  // بستن منو با کلیک بیرون
  useEffect(() => {
    function handleClickOutside(e) {
      if (!e.target.closest(".user-dropdown-wrapper")) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="user-dropdown-wrapper">
      <button
        className="user-box"
        onClick={handleOpenMenu}
      >
        <User size={18} />
        <span>{currentUser?.full_name || currentUser?.username || "کاربر"}</span>
        <span className="dropdown-arrow">{showUserMenu ? "▲" : "▼"}</span>
      </button>

      {showUserMenu && (
        <div className="user-dropdown-menu">
          {currentUser?.role === "admin" && (
            <button
              className="dropdown-item"
              onClick={() => { setPage("users"); setShowUserMenu(false) }}
            >
              👤 مدیریت کاربران
            </button>
          )}

          {currentUser?.role === "admin" && (
            <button
              className="dropdown-item"
              onClick={() => { setPage("archive"); setShowUserMenu(false) }}
            >
              🗄️ آرشیو حذف‌شده‌ها
            </button>
          )}

          <button
            className="dropdown-item"
            onClick={() => { setPage("tickets"); setShowUserMenu(false) }}
          >
            {currentUser?.role === "admin" ? "🎫 تیکت‌های کاربران" : "🎫 ارسال تیکت"}
          </button>

          <button
            className="dropdown-item"
            onClick={() => {
              setShowUserMenu(false)
              if (setShowProfileModal) setShowProfileModal(true)
            }}
          >
            👤 پروفایل من
          </button>

          <button
            className="dropdown-item"
            onClick={() => {
              setShowUserMenu(false)
              if (setShowDeveloperInfo) setShowDeveloperInfo(true)
            }}
          >
            💻 اطلاعات توسعه‌دهنده
          </button>

          <button
            className="logout-btn"
            onClick={() => {
              setShowUserMenu(false)
              handleLogout()
            }}
            title="خروج از حساب"
          >
            🚪 خروج از حساب
          </button>
        </div>
      )}
    </div>
  )
}
/* =========================
   PROFILE MODAL (ویرایش پروفایل)
========================= */

function ProfileModal({ currentUser, setCurrentUser, onClose, showToast }) {
  const [form, setForm] = useState({
    full_name: currentUser?.full_name || "",
    username: currentUser?.username || "",
    password: "",
    confirmPassword: ""
  })

  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // اعتبارسنجی
    if (!form.username.trim()) {
      showToast("نام کاربری نمی‌تونه خالی باشه", "warning")
      return
    }

    if (form.password && form.password.length < 4) {
      showToast("رمز عبور باید حداقل ۴ کاراکتر باشه", "warning")
      return
    }

    if (form.password && form.password !== form.confirmPassword) {
      showToast("رمز عبور و تکرارش یکسان نیستن", "warning")
      return
    }

    setSaving(true)

    try {
      const response = await authFetch(
        `/api/users/${currentUser.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: form.username,
            full_name: form.full_name,
            password: form.password || "",
            role: currentUser.role || "admin",
            is_active: currentUser.is_active === 0 ? 0 : 1
          })
        }
      )

      const data = await response.json()

      if (data.success) {
        // ۱. اول توکن جدید رو ذخیره کن
        if (data.newToken) {
          sessionStorage.setItem("elena_token", data.newToken)
        }

        // ۲. اطلاعات کاربر رو آپدیت کن
        const updatedUser = data.user || {
          ...currentUser,
          full_name: form.full_name,
          username: form.username
        }
        sessionStorage.setItem("elena_user", JSON.stringify(updatedUser))
        setCurrentUser(updatedUser)

        showToast("پروفایل با موفقیت ویرایش شد", "success")
        onClose()

        // ۳. فوراً رفرش کن تا همه درخواست‌ها با توکن جدید ارسال بشن
        window.location.reload()
      } else {
        showToast(data.message || "خطا در ویرایش پروفایل", "error")
      }
    } catch (error) {
      console.error(error)
      showToast("خطا در ارتباط با سرور", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box profile-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close"
          onClick={onClose}
          style={{ position: "absolute", top: "15px", left: "15px" }}
        >
          ✕
        </button>

        <div className="profile-modal-avatar">👤</div>

        <h2>👤 پروفایل کاربری</h2>
        <p className="profile-modal-role">{getRoleName(currentUser?.role)}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>نام و نام خانوادگی</label>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="نام و نام خانوادگی"
              />
            </div>

            <div className="form-group full-width">
              <label>نام کاربری</label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="نام کاربری"
                required
              />
            </div>

            <div className="form-group">
              <label>رمز عبور جدید</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="خالی بذار اگه نمی‌خوای عوض کنی"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>تکرار رمز عبور</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="تکرار رمز عبور جدید"
                  disabled={!form.password}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
          </div>

          <div className="form-actions" style={{ justifyContent: "center", marginTop: "25px" }}>
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
            >
              انصراف
            </button>
            <button
              type="submit"
              className="save-btn"
              disabled={saving}
            >
              {saving ? "⏳ در حال ذخیره..." : "💾 ذخیره تغییرات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
function ProductionDashboard({ setPage, productions, currentUser, handleLogout, darkMode, setDarkMode }) {
  const safeProductions = Array.isArray(productions) ? productions : []

  const totalPrimary = safeProductions
    .filter((p) => p.production_type === "primary")
    .reduce((sum, item) => sum + Number(item.quantity || 0), 0)

  const totalFinal = safeProductions
    .filter((p) => p.production_type === "final" || !p.production_type)
    .reduce((sum, item) => sum + Number(item.quantity || 0), 0)

  const todayProduction = (() => {
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

    return safeProductions
      .filter((p) => p.production_date === todayStr)
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  })()

  const yesterdayProduction = (() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(yesterday)
    const y = parts.find(p => p.type === "year")?.value
    const m = parts.find(p => p.type === "month")?.value
    const d = parts.find(p => p.type === "day")?.value
    const yesterdayStr = `${y}/${m}/${d}`

    return safeProductions
      .filter((p) => p.production_date === yesterdayStr)
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  })()
  const weeklyProduction = (() => {
    const days = []
    const today = new Date()

    const toPersianDate = (date) => {
      try {
        const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }).formatToParts(date)
        const year = parts.find(p => p.type === "year")?.value
        const month = parts.find(p => p.type === "month")?.value
        const day = parts.find(p => p.type === "day")?.value
        return `${year}/${month}/${day}`
      } catch (e) {
        return ""
      }
    }

    const getDayName = (date) => {
      try {
        return new Intl.DateTimeFormat("fa-IR", { weekday: "long" }).format(date)
      } catch (e) {
        return ""
      }
    }

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const persianDate = toPersianDate(date)

      const dayProduction = safeProductions
        .filter((p) =>
          p.production_date === persianDate &&
          (p.production_type === "final" || !p.production_type)
        )
        .reduce((sum, p) => sum + Number(p.quantity || 0), 0)

      days.push({
        day: getDayName(date),
        weight: dayProduction,
        date: persianDate
      })
    }
    return days
  })()

  const weeklyPrimary = (() => {
    const days = []
    const today = new Date()

    const toPersianDate = (date) => {
      try {
        const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }).formatToParts(date)
        const year = parts.find(p => p.type === "year")?.value
        const month = parts.find(p => p.type === "month")?.value
        const day = parts.find(p => p.type === "day")?.value
        return `${year}/${month}/${day}`
      } catch (e) {
        return ""
      }
    }

    const getDayName = (date) => {
      try {
        return new Intl.DateTimeFormat("fa-IR", { weekday: "long" }).format(date)
      } catch (e) {
        return ""
      }
    }

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const persianDate = toPersianDate(date)

      const dayProduction = safeProductions
        .filter((p) =>
          p.production_date === persianDate &&
          p.production_type === "primary"
        )
        .reduce((sum, p) => sum + Number(p.quantity || 0), 0)

      days.push({
        day: getDayName(date),
        weight: dayProduction,
        date: persianDate
      })
    }
    return days
  })()

  return (
    <>
      <Topbar
        title="داشبورد تولید"
        subtitle="گزارش وضعیت تولید کارخانه"
        currentUser={currentUser}
        setPage={setPage}
        handleLogout={handleLogout}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <section className="stats">
        <div className="stat-card">
          <div className="stat-icon"><Factory size={24} /></div>
          <div>
            <span>تولید نهایی تجمعی</span>
            <strong>
              <AnimatedNumber value={totalFinal} />
              <small>عدد</small>
            </strong>
            <small>کل تولید نهایی</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><BarChart3 size={24} /></div>
          <div>
            <span>تولید اولیه تجمعی</span>
            <strong>
              <AnimatedNumber value={totalPrimary} />
              <small>عدد</small>
            </strong>
            <small>کل تولید اولیه</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><BarChart3 size={24} /></div>
          <div>
            <span>تولید امروز</span>
            <strong>
              <AnimatedNumber value={todayProduction} />
              <small>عدد</small>
            </strong>
            <small>تولید امروز کارخانه</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><BarChart3 size={24} /></div>
          <div>
            <span>تولید دیروز</span>
            <strong>
              <AnimatedNumber value={yesterdayProduction} />
              <small>عدد</small>
            </strong>
            <small>تولید دیروز کارخانه</small>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <h2>📈 روند هفتگی تولید اولیه</h2>
            <span>۷ روز اخیر</span>
          </div>

          {safeProductions.length === 0 ? (
            <div className="empty-state">
              <div>📊</div>
              <h3>هنوز تولیدی ثبت نشده</h3>
              <p>برای مشاهده نمودار، ابتدا تولید ثبت کنید.</p>
            </div>
          ) : (
            <div style={{ marginTop: "15px", width: "100%", height: "320px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyPrimary} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="prodDashPrimaryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.7} />
                      <stop offset="50%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(226, 232, 240, 0.5)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8", fontFamily: "inherit", fontWeight: 600 }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} dy={8} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8", fontFamily: "inherit", fontWeight: 600 }} axisLine={false} tickLine={false} dx={-5} />
                  <Tooltip
                    cursor={{ stroke: "#8b5cf6", strokeWidth: 1.5, strokeDasharray: "4 4" }}
                    contentStyle={{
                      background: darkMode ? "rgba(30, 41, 59, 0.98)" : "rgba(255, 255, 255, 0.98)",
                      border: darkMode ? "1px solid rgba(71, 85, 105, 0.6)" : "none",
                      borderRadius: "14px",
                      padding: "12px 16px",
                      fontFamily: "inherit",
                      fontSize: "13px",
                      boxShadow: "0 12px 30px rgba(99, 102, 241, 0.25)"
                    }}
                    labelStyle={{ color: "#8b5cf6", fontWeight: 800, fontSize: "13px", marginBottom: "6px", display: "block" }}
                    itemStyle={{ color: darkMode ? "#f1f5f9" : "#1e293b", fontWeight: 700, fontSize: "14px" }}
                    formatter={(value) => [`${value.toLocaleString()} عدد`, "🔥 تولید اولیه"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fill="url(#prodDashPrimaryGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>📈 روند هفتگی تولید نهایی</h2>
            <span>۷ روز اخیر</span>
          </div>

          {safeProductions.length === 0 ? (
            <div className="empty-state">
              <div>📊</div>
              <h3>هنوز تولیدی ثبت نشده</h3>
              <p>برای مشاهده نمودار، ابتدا تولید ثبت کنید.</p>
            </div>
          ) : (
            <div style={{ marginTop: "15px", width: "100%", height: "320px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyProduction} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="prodDashFinalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.7} />
                      <stop offset="50%" stopColor="#059669" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(226, 232, 240, 0.5)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8", fontFamily: "inherit", fontWeight: 600 }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} dy={8} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8", fontFamily: "inherit", fontWeight: 600 }} axisLine={false} tickLine={false} dx={-5} />
                  <Tooltip
                    cursor={{ stroke: "#10b981", strokeWidth: 1.5, strokeDasharray: "4 4" }}
                    contentStyle={{
                      background: darkMode ? "rgba(30, 41, 59, 0.98)" : "rgba(255, 255, 255, 0.98)",
                      border: darkMode ? "1px solid rgba(71, 85, 105, 0.6)" : "none",
                      borderRadius: "14px",
                      padding: "12px 16px",
                      fontFamily: "inherit",
                      fontSize: "13px",
                      boxShadow: "0 12px 30px rgba(16, 185, 129, 0.25)"
                    }}
                    labelStyle={{ color: "#10b981", fontWeight: 800, fontSize: "13px", marginBottom: "6px", display: "block" }}
                    itemStyle={{ color: darkMode ? "#f1f5f9" : "#1e293b", fontWeight: 700, fontSize: "14px" }}
                    formatter={(value) => [`${value.toLocaleString()} عدد`, "🔥 تولید نهایی"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="url(#prodDashFinalGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      <section className="quick-section">
        <h2>⚡ دسترسی سریع</h2>
        <div className="quick-buttons">
          <button
            onClick={() => setPage("production-primary")}
            style={{ background: "linear-gradient(135deg, rgba(96, 165, 250, 0.95) 0%, rgba(59, 130, 246, 0.95) 100%)" }}
          >
            <span style={{ fontSize: "22px" }}>🏭</span>
            <span style={{ fontSize: "15px", fontWeight: "700" }}>ثبت تولید اولیه</span>
          </button>
          <button
            onClick={() => setPage("production-final")}
            style={{ background: "linear-gradient(135deg, rgba(96, 165, 250, 0.95) 0%, rgba(59, 130, 246, 0.95) 100%)" }}
          >
            <span style={{ fontSize: "22px" }}>🏭</span>
            <span style={{ fontSize: "15px", fontWeight: "700" }}>ثبت تولید نهایی</span>
          </button>
          <button
            onClick={() => setPage("production-primary-report")}
            style={{ background: "linear-gradient(135deg, rgba(96, 165, 250, 0.95) 0%, rgba(59, 130, 246, 0.95) 100%)" }}
          >
            <span style={{ fontSize: "22px" }}>📊</span>
            <span style={{ fontSize: "15px", fontWeight: "700" }}>گزارش تولید اولیه</span>
          </button>
          <button
            onClick={() => setPage("production-report")}
            style={{ background: "linear-gradient(135deg, rgba(96, 165, 250, 0.95) 0%, rgba(59, 130, 246, 0.95) 100%)" }}
          >
            <span style={{ fontSize: "22px" }}>📊</span>
            <span style={{ fontSize: "15px", fontWeight: "700" }}>گزارش تولید نهایی</span>
          </button>
        </div>
      </section>
    </>
  )
}
/* =========================
   PRE INVOICES PAGE
========================= */
function PreInvoicesPage({ currentUser, showToast, setPage, handleLogout, darkMode, setDarkMode, customers, products, loadOrders }) {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ customer_name: "", customer_phone: "", issue_date: "", discount_percent: 0, items: [] })
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [convertConfirm, setConvertConfirm] = useState(null)

  const loadInvoices = () => {
    setLoading(true)
    authFetch("/api/pre-invoices")
      .then(res => res.json())
      .then(data => { setInvoices(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(err => { console.error(err); setLoading(false) })
  }

  useEffect(() => { loadInvoices() }, [])

  const handleCustomerSelect = (name) => {
    const customer = customers.find(c => c.name === name)
    setForm({ ...form, customer_name: name, customer_phone: customer ? customer.phone : "" })
  }

  const handleAddItem = () => {
    setForm({ ...form, items: [...form.items, { product_name: "", category: "", quantity: "", unit: "عدد", unit_price: "" }] })
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...form.items]
    newItems[index][field] = value
    if (field === "product_name") {
      const prod = products.find(p => p.name === value)
      if (prod) newItems[index].category = prod.category
    }
    setForm({ ...form, items: newItems })
  }

  const handleRemoveItem = (index) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) })
  }

  const calculateTotals = () => {
    let total = 0
    form.items.forEach(item => {
      total += (Number(item.quantity || 0) * Number(item.unit_price || 0))
    })
    const discountAmount = total * (Number(form.discount_percent || 0) / 100)
    const final = total - discountAmount
    return { total, discountAmount, final }
  }

  const { total, discountAmount, final } = calculateTotals()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.customer_name || !form.issue_date || form.items.length === 0) {
      showToast("لطفاً مشتری، تاریخ و حداقل یک محصول را وارد کنید", "warning")
      return
    }
    if (form.items.some(i => !i.product_name || !i.quantity || !i.unit_price)) {
      showToast("لطفاً اطلاعات همه اقلام را کامل کنید", "warning")
      return
    }

    try {
      const res = await authFetch("/api/pre-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.success) {
        showToast(`پیش‌فاکتور شماره ${data.invoice_number} ثبت شد`, "success")
        setShowForm(false)
        setForm({ customer_name: "", customer_phone: "", issue_date: "", discount_percent: 0, items: [] })
        loadInvoices()
      } else {
        showToast(data.message || "خطا در ثبت", "error")
      }
    } catch (error) {
      showToast("خطا در ارتباط با سرور", "error")
    }
  }

  const handleConvertToOrder = async (id) => {
    try {
      const res = await authFetch(`/api/pre-invoices/${id}/convert`, { method: "POST" })
      const data = await res.json()
      if (data.success) {
        showToast("پیش‌فاکتور با موفقیت به سفارش تبدیل شد", "success")
        setConvertConfirm(null)
        if (loadOrders) loadOrders()
        setPage("orders-list")
      } else {
        showToast(data.message || "خطا در تبدیل", "error")
      }
    } catch (error) {
      showToast("خطا در ارتباط با سرور", "error")
    }
  }

  const numberToPersianWords = (num) => {
    if (!num || num === 0) return "صفر"
    const numStr = String(Math.round(num))
    const parts = []
    const units = ["", "هزار", "میلیون", "میلیارد", "تریلیون"]
    const ones = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"]
    const tens = ["", "ده", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"]
    const hundreds = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"]
    const teens = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"]

    let result = ""
    let groupIndex = 0
    let temp = numStr

    while (temp.length > 0) {
      let group = parseInt(temp.slice(-3))
      temp = temp.slice(0, -3)
      if (group !== 0) {
        let groupStr = ""
        const h = Math.floor(group / 100)
        const t = Math.floor((group % 100) / 10)
        const o = group % 10
        if (h > 0) groupStr += hundreds[h] + " و "
        if (t === 1 && o > 0) groupStr += teens[o] + " و "
        else {
          if (t > 0) groupStr += tens[t] + " و "
          if (o > 0) groupStr += ones[o] + " و "
        }
        groupStr = groupStr.replace(/ و $/, "")
        result = groupStr + " " + units[groupIndex] + " و " + result
      }
      groupIndex++
    }
    return result.replace(/ و $/, "").trim()
  }

  const openPrintModal = (invoice) => {
    setSelectedInvoice(invoice)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>پیش‌فاکتورها</h1>
          <p>مدیریت پیش‌فاکتورها و تبدیل به سفارش</p>
        </div>
      </header>

      <div className="panel">
        <div className="panel-header">
          <h2>لیست پیش‌فاکتورها</h2>
          <button className="save-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? "بستن فرم" : "➕ صدور پیش‌فاکتور جدید"}
          </button>
        </div>

        {showForm && (
          <div className="pre-invoice-form-wrapper" style={{ padding: "20px", background: "#f8fafc", borderRadius: "12px", marginBottom: "20px" }}>
            <form onSubmit={handleSubmit}>
              <div className="form-grid" style={{ marginBottom: "20px" }}>
                <div className="form-group">
                  <label>نام مشتری <span style={{ color: "red" }}>*</span></label>
                  <CustomerSearchSelect customers={customers} value={form.customer_name} onChange={handleCustomerSelect} />
                </div>
                <div className="form-group">
                  <label>شماره تماس</label>
                  <input type="text" value={form.customer_phone} readOnly style={{ background: "#e2e8f0" }} />
                </div>
                <div className="form-group">
                  <label>تاریخ صدور <span style={{ color: "red" }}>*</span></label>
                  <PersianDateInput value={form.issue_date} onChange={(date) => setForm({ ...form, issue_date: date })} />
                </div>
                <div className="form-group">
                  <label>درصد تخفیف</label>
                  <input type="number" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} min="0" max="100" />
                </div>
              </div>

              <h3>اقلام پیش‌فاکتور</h3>
              <table className="orders-table" style={{ marginBottom: "15px" }}>
                <thead>
                  <tr>
                    <th>ردیف</th>
                    <th>دسته‌بندی</th>
                    <th>شرح کالا</th>
                    <th>تعداد</th>
                    <th>واحد</th>
                    <th>مبلغ واحد (ریال)</th>
                    <th>مبلغ کل (ریال)</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, index) => {
                    const itemCategory = item.category || (products.find(p => p.name === item.product_name)?.category || "")
                    const filteredProducts = itemCategory
                      ? products.filter(p => p.category === itemCategory)
                      : products
                    return (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        <select
                          value={itemCategory}
                          onChange={(e) => {
                            const newItems = [...form.items]
                            newItems[index] = { ...newItems[index], category: e.target.value, product_name: "" }
                            setForm({ ...form, items: newItems })
                          }}
                          className="filter-select-pretty"
                        >
                          <option value="">انتخاب دسته</option>
                          {[...new Set(products.map(p => p.category).filter(Boolean))].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          value={item.product_name}
                          onChange={(e) => handleItemChange(index, "product_name", e.target.value)}
                          className="filter-select-pretty"
                          disabled={!itemCategory}
                        >
                          <option value="">{itemCategory ? "انتخاب محصول" : "ابتدا دسته را انتخاب کنید"}</option>
                          {filteredProducts.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                      </td>
                      <td><input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, "quantity", e.target.value)} placeholder="مثلاً ۱۰۰۰" /></td>
                      <td>
                        <select value={item.unit} onChange={(e) => handleItemChange(index, "unit", e.target.value)} className="filter-select-pretty">
                          <option value="عدد">عدد</option>
                          <option value="قالب">قالب</option>
                          <option value="پالت">پالت</option>
                          <option value="کیلوگرم">کیلوگرم</option>
                          <option value="تن">تن</option>
                          <option value="متر مربع">متر مربع</option>
                        </select>
                      </td>
                      <td><input type="number" value={item.unit_price} onChange={(e) => handleItemChange(index, "unit_price", e.target.value)} placeholder="مثلاً ۵۰۰۰" /></td>
                      <td>{(Number(item.quantity || 0) * Number(item.unit_price || 0)).toLocaleString()}</td>
                      <td><button type="button" className="row-btn delete-btn" onClick={() => handleRemoveItem(index)}>🗑️</button></td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
              <button type="button" className="save-btn" onClick={handleAddItem} style={{ marginBottom: "20px" }}>➕ افزودن محصول</button>

              <div style={{ textAlign: "left", background: "#fff", padding: "15px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
                <p>جمع کل: <strong>{total.toLocaleString()} ریال</strong></p>
                <p>تخفیف ({form.discount_percent}%): <strong>{discountAmount.toLocaleString()} ریال</strong></p>
                <p>مبلغ قابل پرداخت: <strong style={{ color: "green", fontSize: "18px" }}>{final.toLocaleString()} ریال</strong></p>
                <p style={{ fontSize: "12px", color: "#64748b" }}>به حروف: {numberToPersianWords(final)} ریال</p>
              </div>

              <div className="form-actions" style={{ justifyContent: "flex-end" }}>
                <button type="submit" className="save-btn">ثبت پیش‌فاکتور</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="empty-state">در حال بارگذاری...</div>
        ) : invoices.length === 0 ? (
          <div className="empty-state">هیچ پیش‌فاکتوری صادر نشده است.</div>
        ) : (
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>شماره</th>
                  <th>تاریخ</th>
                  <th>مشتری</th>
                  <th>مبلغ نهایی</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td><span className="machine-badge">{inv.invoice_number}</span></td>
                    <td>{toPersianDate(inv.issue_date)}</td>
                    <td>{inv.customer_name}</td>
                    <td><strong>{Number(inv.final_amount).toLocaleString()} ریال</strong></td>
                    <td>
                      <div className="row-actions">
                        <button className="row-btn edit-btn" onClick={() => openPrintModal(inv)} title="مشاهده و پرینت">👁️</button>
                        <button className="save-btn" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={() => setConvertConfirm(inv)}>تبدیل به سفارش</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* مودال پرینت */}
      {selectedInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: "900px", maxHeight: "95vh", overflowY: "auto", padding: "20px" }}>
            <div className="modal-header no-print" style={{ marginBottom: "15px" }}>
              <h2>پیش‌نمایش پیش‌فاکتور</h2>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="save-btn" onClick={handlePrint}>🖨️ پرینت / PDF</button>
                <button className="modal-close" onClick={() => setSelectedInvoice(null)}>✕</button>
              </div>
            </div>

            <div className="pre-invoice-print-area">
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, fontSize: "20px" }}>پیش فاکتور کالا و خدمات</h2>
                <h3 style={{ margin: "5px 0", fontSize: "16px" }}>آجرنسوز و نما محراب</h3>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <span style={{ fontWeight: "bold" }}>شماره پیش‌فاکتور: {selectedInvoice.invoice_number}</span>
                <span style={{ fontWeight: "bold" }}>تاریخ صدور: {toPersianDate(selectedInvoice.issue_date)}</span>
              </div>

              <div style={{ border: "1px solid #000", padding: "10px", marginBottom: "15px" }}>
                <p style={{ margin: "0 0 8px 0" }}><strong>نام و نام خانوادگی مشتری:</strong> {selectedInvoice.customer_name}</p>
                <p style={{ margin: "0" }}><strong>شماره تماس:</strong> {selectedInvoice.customer_phone || "-"}</p>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center", marginBottom: "15px" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9" }}>
                    <th style={{ border: "1px solid #000", padding: "8px" }}>ردیف</th>
                    <th style={{ border: "1px solid #000", padding: "8px" }}>شرح کالا</th>
                    <th style={{ border: "1px solid #000", padding: "8px" }}>تعداد/مقدار</th>
                    <th style={{ border: "1px solid #000", padding: "8px" }}>واحد</th>
                    <th style={{ border: "1px solid #000", padding: "8px" }}>مبلغ واحد (ریال)</th>
                    <th style={{ border: "1px solid #000", padding: "8px" }}>مبلغ کل (ریال)</th>
                    <th style={{ border: "1px solid #000", padding: "8px" }}>تخفیف</th>
                    <th style={{ border: "1px solid #000", padding: "8px" }}>مبلغ کل پس از کسر تخفیف</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((item, idx) => {
                    const itemTotal = Number(item.total_price) || 0
                    const invDiscount = Number(selectedInvoice.discount_percent) || 0
                    const itemDiscount = itemTotal * (invDiscount / 100)
                    const finalItemTotal = itemTotal - itemDiscount
                    return (
                      <tr key={idx}>
                        <td style={{ border: "1px solid #000", padding: "8px" }}>{idx + 1}</td>
                        <td style={{ border: "1px solid #000", padding: "8px", textAlign: "right" }}>{item.product_name}</td>
                        <td style={{ border: "1px solid #000", padding: "8px" }}>{Number(item.quantity).toLocaleString()}</td>
                        <td style={{ border: "1px solid #000", padding: "8px" }}>{item.unit}</td>
                        <td style={{ border: "1px solid #000", padding: "8px" }}>{Number(item.unit_price).toLocaleString()}</td>
                        <td style={{ border: "1px solid #000", padding: "8px" }}>{itemTotal.toLocaleString()}</td>
                        <td style={{ border: "1px solid #000", padding: "8px" }}>{itemDiscount.toLocaleString()}</td>
                        <td style={{ border: "1px solid #000", padding: "8px" }}>{finalItemTotal.toLocaleString()}</td>
                      </tr>
                    )
                  })}
                  {Array.from({ length: Math.max(0, 6 - selectedInvoice.items.length) }).map((_, i) => (
                    <tr key={`empty-${i}`}>
                      <td style={{ border: "1px solid #000", padding: "8px" }}>{selectedInvoice.items.length + i + 1}</td>
                      <td style={{ border: "1px solid #000", padding: "8px" }}></td>
                      <td style={{ border: "1px solid #000", padding: "8px" }}></td>
                      <td style={{ border: "1px solid #000", padding: "8px" }}></td>
                      <td style={{ border: "1px solid #000", padding: "8px" }}></td>
                      <td style={{ border: "1px solid #000", padding: "8px" }}></td>
                      <td style={{ border: "1px solid #000", padding: "8px" }}></td>
                      <td style={{ border: "1px solid #000", padding: "8px" }}></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ border: "1px solid #000", padding: "10px" }}>
                <p style={{ margin: 0, fontWeight: "bold" }}>
                  مبلغ به حروف: {numberToPersianWords(selectedInvoice.final_amount)} ریال
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال تبدیل */}
      {convertConfirm && (
        <div className="modal-overlay" onClick={() => setConvertConfirm(null)}>
          <div className="modal-box delete-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-modal-icon">📋</div>
            <h2>تبدیل به سفارش</h2>
            <p>آیا می‌خواهید پیش‌فاکتور شماره <strong>{convertConfirm.invoice_number}</strong> به یک سفارش رسمی تبدیل شود؟</p>
            <div className="delete-modal-actions">
              <button className="cancel-btn" onClick={() => setConvertConfirm(null)}>انصراف</button>
              <button className="confirm-restore-btn" onClick={() => handleConvertToOrder(convertConfirm.id)}>✅ بله، تبدیل کن</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default App
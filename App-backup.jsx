import { useState, useEffect } from "react"

function App() {
  const [page, setPage] = useState("dashboard")
  const [orders, setOrders] = useState([])
  const loadOrders = () => {
  fetch("http://localhost:3001/api/orders")
    .then((response) => response.json())
    .then((data) => {
      setOrders(data)
    })
    .catch((error) => {
      console.error("خطا در دریافت سفارشات:", error)
    })
}
  useEffect(() => {
  fetch("http://localhost:3001/api/orders")
    .then((response) => response.json())
    .then((data) => {
      setOrders(data)
    })
    .catch((error) => {
      console.error("خطا در دریافت سفارشات:", error)
    })
}, [])

  return (
    <div dir="rtl" className="app">

      {/* منوی سمت راست */}
      <aside className="sidebar">

        <div className="brand">
          <img src="/logo.jpg" alt="النا بافت" />
        </div>

        <div className="menu">

          <button
            className={`menu-item ${page === "dashboard" ? "active" : ""}`}
            onClick={() => setPage("dashboard")}
          >
            🏠
            <span>داشبورد</span>
          </button>

          <button
            className={`menu-item ${page === "orders" ? "active" : ""}`}
            onClick={() => setPage("orders")}
          >
            📝
            <span>ثبت سفارش</span>
          </button>

          <button
  className={`menu-item ${page === "orders-list" ? "active" : ""}`}
  onClick={() => setPage("orders-list")}
>
  📋 <span>سفارشات</span>
</button>
<button
  className={`menu-item ${page === "production" ? "active" : ""}`}
  onClick={() => setPage("production")}
>
  🏭 <span>ثبت تولید</span>
</button>

          <button className="menu-item">
            👥
            <span>مشتریان</span>
          </button>

          <button className="menu-item">
            ⚙️
            <span>ماشین‌های گردباف</span>
          </button>

          <button className="menu-item">
            🏭
            <span>ثبت تولید</span>
          </button>

          <button className="menu-item">
            📊
            <span>گزارش‌ها</span>
          </button>

        </div>

        <div className="sidebar-bottom">
          <span>ELENA BAFT</span>
          <small>سیستم مدیریت کارخانه</small>
        </div>

      </aside>


      {/* قسمت اصلی */}
      <main className="main">

        {page === "dashboard" && <Dashboard setPage={setPage} />}
        {page === "orders" && (
  <OrderForm
    setPage={setPage}
    loadOrders={loadOrders}
  />
)}

{page === "orders-list" && <OrdersList orders={orders} />}

        
        {page === "production" && <ProductionForm />}

      </main>

    </div>
  )
}


/* =========================
   DASHBOARD
========================= */

function Dashboard({ setPage }) {

  return (
    <>
      <header className="topbar">

        <div>
          <h1>داشبورد مدیریت</h1>
          <p>سیستم سفارش و تولید النا بافت</p>
        </div>

        <div className="user-box">
          👤
          <span>مدیریت کارخانه</span>
        </div>

      </header>


      <section className="stats">

        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div>
            <span>کل سفارشات</span>
            <strong>0</strong>
            <small>سفارش ثبت شده</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏭</div>
          <div>
            <span>تولید انجام شده</span>
            <strong>0 <small>کیلو</small></strong>
            <small>تولید تجمعی</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚖️</div>
          <div>
            <span>باقی‌مانده سفارش</span>
            <strong>0 <small>کیلو</small></strong>
            <small>در انتظار تولید</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚙️</div>
          <div>
            <span>ماشین‌های فعال</span>
            <strong>0</strong>
            <small>در حال تولید</small>
          </div>
        </div>

      </section>


      <section className="dashboard-grid">

        <div className="panel">

          <div className="panel-header">
            <h2>وضعیت تولید</h2>
            <span>امروز</span>
          </div>

          <div className="empty-state">
            <div>🏭</div>
            <h3>هنوز اطلاعاتی ثبت نشده</h3>
            <p>
              بعد از ثبت سفارش و تولید، اطلاعات این قسمت
              به صورت خودکار نمایش داده می‌شود.
            </p>
          </div>

        </div>


        <div className="panel">

          <div className="panel-header">
            <h2>سفارش‌های فعال</h2>
            <span>0 سفارش</span>
          </div>

          <div className="empty-state">
            <div>📋</div>
            <h3>سفارشی وجود ندارد</h3>
            <p>
              سفارش‌های در حال تولید در این قسمت نمایش داده می‌شوند.
            </p>
          </div>

        </div>

      </section>


      <section className="quick-section">

        <h2>دسترسی سریع</h2>

        <div className="quick-buttons">

          <button onClick={() => setPage("orders")}>
            <span>➕</span>
            ثبت سفارش جدید
          </button>

          <button>
            <span>🏭</span>
            ثبت تولید امروز
          </button>

          <button>
            <span>⚙️</span>
            مدیریت ماشین‌ها
          </button>

          <button>
            <span>📊</span>
            مشاهده گزارش‌ها
          </button>

        </div>

      </section>
    </>
  )
}


/* =========================
   ORDER FORM
========================= */

function OrderForm({ setPage, loadOrders }) {
  const [form, setForm] = useState({
    order_date: "",
    customer_name: "",
    yarn_type: "",
    fabric_type: "",
    weight: "",
    machine: "",
    priority: "عادی",
    notes: ""
  })

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm({
      ...form,
      [name]: value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.order_date || !form.customer_name || !form.weight) {
      alert("لطفاً تاریخ، نام مشتری و وزن سفارش را وارد کنید.")
      return
    }

    try {
      const response = await fetch("http://localhost:3001/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      })

      const data = await response.json()

      if (data.success) {
        alert("سفارش با موفقیت ثبت شد ✅")
        loadOrders()

        setForm({
          order_date: "",
          customer_name: "",
          yarn_type: "",
          fabric_type: "",
          weight: "",
          machine: "",
          priority: "عادی",
          notes: ""
        })
      }
    } catch (error) {
      console.error(error)
      alert("ارتباط با دیتابیس برقرار نشد ❌")
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>ثبت سفارش جدید</h1>
          <p>ثبت اطلاعات سفارش مشتری</p>
        </div>

        <div className="user-box">
          👤
          <span>مدیریت کارخانه</span>
        </div>
      </header>

      <div className="panel order-form">
        <div className="panel-header">
          <h2>اطلاعات سفارش</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">

            <div className="form-group">
              <label>تاریخ سفارش</label>
              <input
                type="text"
                name="order_date"
                value={form.order_date}
                onChange={handleChange}
                placeholder="مثلاً 1405/06/22"
                required
              />
            </div>

            <div className="form-group">
              <label>نام مشتری</label>
              <input
                type="text"
                name="customer_name"
                value={form.customer_name}
                onChange={handleChange}
                placeholder="نام مشتری"
                required
              />
            </div>

            <div className="form-group">
              <label>نوع نخ</label>
              <input
                type="text"
                name="yarn_type"
                value={form.yarn_type}
                onChange={handleChange}
                placeholder="مثلاً اپن یا کارد"
              />
            </div>

            <div className="form-group">
              <label>نوع پارچه</label>
              <input
                type="text"
                name="fabric_type"
                value={form.fabric_type}
                onChange={handleChange}
                placeholder="مثلاً دورس دو نخ"
              />
            </div>

            <div className="form-group">
              <label>وزن سفارش (کیلوگرم)</label>
              <input
                type="number"
                name="weight"
                value={form.weight}
                onChange={handleChange}
                placeholder="مثلاً 1000"
                required
              />
            </div>

            <div className="form-group">
              <label>ماشین</label>
              <select
                name="machine"
                value={form.machine}
                onChange={handleChange}
              >
                <option value="">انتخاب ماشین</option>
                <option value="ماشین 1">ماشین 1</option>
                <option value="ماشین 2">ماشین 2</option>
                <option value="ماشین 3">ماشین 3</option>
              </select>
            </div>

            <div className="form-group">
              <label>اولویت سفارش</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
              >
                <option value="عادی">عادی</option>
                <option value="فوری">فوری</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label>توضیحات</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="توضیحات مربوط به سفارش..."
              ></textarea>
            </div>

          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => setPage("dashboard")}
            >
              بازگشت
            </button>

            <button
              type="submit"
              className="save-btn"
            >
              💾 ثبت سفارش
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
function ProductionForm() {
  const [formData, setFormData] = useState({
    production_date: "",
    machine: "",
    product_name: "",
    weight: "",
    notes: ""
  })

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (
      !formData.production_date ||
      !formData.machine ||
      !formData.product_name ||
      !formData.weight
    ) {
      alert("لطفاً اطلاعات ضروری تولید را وارد کنید.")
      return
    }

    try {
      const response = await fetch("http://localhost:3001/api/production", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        alert("تولید با موفقیت ثبت شد ✅")

        setFormData({
          production_date: "",
          machine: "",
          product_name: "",
          weight: "",
          notes: ""
        })
      }
    } catch (error) {
      console.error("خطا در ثبت تولید:", error)
      alert("خطا در ارتباط با سرور ❌")
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>ثبت تولید</h1>
          <p>ثبت مقدار تولید روزانه کارخانه</p>
        </div>

        <div className="user-box">
          👤
          <span>مدیریت کارخانه</span>
        </div>
      </header>

      <div className="panel order-form">
        <div className="panel-header">
          <h2>ثبت تولید جدید</h2>
          <span>اطلاعات تولید</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">

            <div className="form-group">
              <label>تاریخ تولید</label>
              <input
                type="text"
                name="production_date"
                value={formData.production_date}
                onChange={handleChange}
                placeholder="مثلاً 1405/06/22"
                required
              />
            </div>

            <div className="form-group">
              <label>ماشین</label>
              <select
                name="machine"
                value={formData.machine}
                onChange={handleChange}
                required
              >
                <option value="">انتخاب ماشین</option>
                <option value="ماشین 1">ماشین 1</option>
                <option value="ماشین 2">ماشین 2</option>
                <option value="ماشین 3">ماشین 3</option>
              </select>
            </div>

            <div className="form-group">
              <label>عنوان محصول</label>
              <input
                type="text"
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                placeholder="مثلاً دورس دو نخ"
                required
              />
            </div>

            <div className="form-group">
              <label>مقدار تولید (کیلوگرم)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                placeholder="مثلاً 350"
                required
              />
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
            <button
              type="submit"
              className="save-btn"
            >
              💾 ثبت تولید
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
function OrdersList({ orders }) {
  return (
    <>
      <header className="topbar">
        <div>
          <h1>سفارشات</h1>
          <p>مدیریت و مشاهده سفارش‌های ثبت شده</p>
        </div>

        <div className="user-box">
          👤
          <span>مدیریت کارخانه</span>
        </div>
      </header>

      <div className="panel orders-list">
        <div className="panel-header">
          <h2>لیست سفارشات</h2>
          <span>{orders.length} سفارش</span>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state">
            <div>📋</div>
            <h3>هنوز سفارشی ثبت نشده</h3>
            <p>
              سفارش‌هایی که ثبت می‌کنید در این قسمت نمایش داده می‌شوند.
            </p>
          </div>
        ) : (
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>ردیف</th>
                  <th>تاریخ</th>
                  <th>مشتری</th>
                  <th>نوع نخ</th>
                  <th>نوع پارچه</th>
                  <th>وزن</th>
                  <th>ماشین</th>
                  <th>اولویت</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order, index) => (
                  <tr key={order.id}>
                    <td>{index + 1}</td>
                    <td>{order.order_date}</td>
                    <td>{order.customer_name}</td>
                    <td>{order.yarn_type || "-"}</td>
                    <td>{order.fabric_type || "-"}</td>
                    <td>{order.weight} کیلو</td>
                    <td>{order.machine || "-"}</td>
                    <td>{order.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

export default App
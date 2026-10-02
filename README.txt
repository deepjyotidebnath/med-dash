Sales Dashboard (standalone project)

FILES
  index.html          the dashboard - open this in a browser
  style.css           styling (light and dark mode)
  script.js           all the logic and charts
  sample-orders.csv   60 days of sample orders to try the Import CSV button

WHAT IT SHOWS
  Revenue, orders, average order and customers (with change vs the previous period),
  revenue over time, sales by category, top products, orders by day of week,
  product performance table and recent orders. Periods: 7, 30, 90 days or all time.

GETTING YOUR ORDERS IN
  1. Add order: type an order in by hand.
  2. Import CSV: one row per product in an order. Columns:
       order_id, date, customer, phone, payment, product, category, qty, price, delivery
     Required: order_id, date, product, qty, price. Dates can be 2026-10-01 or 01/10/2026.
     Rows with the same order_id become one order. Use "Download CSV template" for an example.
     Importing adds new orders and skips order IDs that are already saved.
  3. Export CSV gives you a backup in the same format.

DATA
  Orders are saved in this browser only (localStorage). Different browsers or computers do not
  share data, so keep a CSV backup. Phone numbers are partly hidden in the orders table.
  Charts need an internet connection to load the chart library and fonts.

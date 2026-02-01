/*********************************
 * STATE
 *********************************/
let loans = JSON.parse(localStorage.getItem("loans")) || [];
let editId = null;

/*********************************
 * DOM
 *********************************/
const dashboardPage = document.getElementById("dashboardPage");
const loansPage = document.getElementById("loansPage");
const addPage = document.getElementById("addPage");
const form = document.getElementById("loanForm");

const borrowerNameInput = document.getElementById("borrowerName");
const loanAmountInput = document.getElementById("loanAmount");
const interestInput = document.getElementById("monthlyInterest");
const startDateInput = document.getElementById("startDate");

/*********************************
 * NAVIGATION
 *********************************/
function showPage(page) {
  dashboardPage.style.display = "none";
  loansPage.style.display = "none";
  addPage.style.display = "none";

  if (page === "dashboard") renderDashboard();
  if (page === "loans") renderAllLoans();

  document.getElementById(page + "Page").style.display = "block";
}

showPage("dashboard");

/*********************************
 * STORAGE
 *********************************/
function save() {
  localStorage.setItem("loans", JSON.stringify(loans));
  showPage("dashboard");
}

/*********************************
 * FORM SUBMIT
 *********************************/
form.addEventListener("submit", e => {
  e.preventDefault();

  const start = new Date(startDateInput.value);

  const loan = {
    id: editId || Date.now(),
    name: borrowerNameInput.value.trim(),
    amount: Number(loanAmountInput.value),
    interest: Number(interestInput.value),
    startDate: startDateInput.value,
    dueDay: start.getDate(),
    lastCollectedMonth: null
  };

  if (editId) {
    loans = loans.map(l => (l.id === editId ? loan : l));
    editId = null;
  } else {
    loans.push(loan);
  }

  form.reset();
  save();
});

/*********************************
 * DATE HELPERS
 *********************************/
function monthKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

/* 🔥 CRITICAL FIX: SAFE DUE DATE */
function getSafeDueDate(year, month, dueDay) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(dueDay, lastDay);
  return new Date(year, month, safeDay);
}

/*********************************
 * STATUS HELPER
 *********************************/
function getLoanStatus(loan) {
  const today = new Date();
  const currentMonthKey = monthKey(today);

  const dueDate = getSafeDueDate(
    today.getFullYear(),
    today.getMonth(),
    loan.dueDay
  );

  if (loan.lastCollectedMonth === currentMonthKey) {
    return "collected";
  }

  if (today < dueDate) {
    return "upcoming";
  }

  if (today.toDateString() === dueDate.toDateString()) {
    return "pending";
  }

  return "overdue";
}

/*********************************
 * DASHBOARD
 *********************************/
function renderDashboard() {
  dashboardPage.innerHTML = "<h3>Dashboard</h3>";

  let actionLoans = [];
  let upcomingLoans = [];

  loans.forEach(loan => {
    const status = getLoanStatus(loan);
    const dueDate = getSafeDueDate(
      new Date().getFullYear(),
      new Date().getMonth(),
      loan.dueDay
    );

    if (status === "pending" || status === "overdue") {
      actionLoans.push({ loan, status });
    }

    if (status === "upcoming") {
      upcomingLoans.push({ loan, dueDate });
    }
  });

  if (!actionLoans.length && !upcomingLoans.length) {
    dashboardPage.innerHTML += "<p>✅ No reminders</p>";
    return;
  }

  if (actionLoans.length) {
    dashboardPage.innerHTML += "<h4>⚠️ Action Required</h4>";
    actionLoans.forEach(({ loan, status }) => {
      dashboardPage.innerHTML += dashboardCard(loan, status);
    });
  }

  if (upcomingLoans.length) {
    dashboardPage.innerHTML += "<h4>🕒 Upcoming</h4>";
    upcomingLoans.forEach(({ loan, dueDate }) => {
      dashboardPage.innerHTML += `
        <div class="loan-card upcoming">
          <strong>${loan.name}</strong><br>
          ₹${loan.interest}<br>
          Due on ${dueDate.toDateString()}
        </div>
      `;
    });
  }
}

/*********************************
 * DASHBOARD CARD
 *********************************/
function dashboardCard(loan, status) {
  const label =
    status === "overdue" ? "⚠️ Overdue" : "🔴 Pending";

  const cardClass =
    status === "overdue"
      ? "loan-card overdue"
      : "loan-card pending";

return `
  <div class="${cardClass}">
    <strong>${loan.name}</strong>
    <span style="font-size:17px;color:#6b7280;">
      (₹${loan.amount.toLocaleString()})
    </span><br>

    ₹${loan.interest}<br>
    <span>${label}</span><br><br>

    <button onclick="collect(${loan.id})">Collected</button>
  </div>
`;
}

/*********************************
 * ACTIONS
 *********************************/
function collect(id) {
  const m = monthKey(new Date());

  loans = loans.map(l =>
    l.id === id ? { ...l, lastCollectedMonth: m } : l
  );

  save();
}

function editLoan(id) {
  const loan = loans.find(l => l.id === id);
  if (!loan) return;

  borrowerNameInput.value = loan.name;
  loanAmountInput.value = loan.amount;
  interestInput.value = loan.interest;
  startDateInput.value = loan.startDate;

  editId = id;
  showPage("add");
}

function deleteLoan(id) {
  loans = loans.filter(l => l.id !== id);
  save();
}

/*********************************
 * ALL LOANS PAGE
 *********************************/
function renderAllLoans() {
  loansPage.innerHTML = "<h3>All Loans</h3>";

  loans.forEach(l => {
    const status = getLoanStatus(l);

    loansPage.innerHTML += `
      <div class="loan-card ${status}">
        <strong>${l.name}</strong><br>
        Amount: ₹${l.amount}<br>
        Interest: ₹${l.interest}<br>
        Status: ${status}<br><br>
        <button onclick="editLoan(${l.id})">Edit</button>
        <button onclick="deleteLoan(${l.id})">Delete</button>
      </div>
    `;
  });
}

/*********************************
 * BACKUP
 *********************************/
function exportBackup() {
  const data = localStorage.getItem("loans");
  if (!data) {
    alert("No data to backup");
    return;
  }

  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "loan-backup.json";
  a.click();

  URL.revokeObjectURL(url);
}

function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      localStorage.setItem("loans", JSON.stringify(data));
      alert("Backup restored successfully");
      location.reload();
    } catch {
      alert("Invalid backup file");
    }
  };
  reader.readAsText(file);
}

/*********************************
 * SERVICE WORKER
 *********************************/
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js");
}

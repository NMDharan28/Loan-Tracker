let loans = JSON.parse(localStorage.getItem("loans")) || [];
let editId = null;

// DOM
const dashboardPage = document.getElementById("dashboardPage");
const loansPage = document.getElementById("loansPage");
const form = document.getElementById("loanForm");

const borrowerNameInput = document.getElementById("borrowerName");
const loanAmountInput = document.getElementById("loanAmount");
const interestInput = document.getElementById("monthlyInterest");
const startDateInput = document.getElementById("startDate");

// NAVIGATION
function showPage(page) {
  dashboardPage.style.display = "none";
  document.getElementById("addPage").style.display = "none";
  loansPage.style.display = "none";

  if (page === "dashboard") renderDashboard();
  if (page === "loans") renderAllLoans();

  document.getElementById(page + "Page").style.display = "block";
}

showPage("dashboard");

// SAVE
function save() {
  localStorage.setItem("loans", JSON.stringify(loans));
  showPage("dashboard");
}

// FORM SUBMIT
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
    loans = loans.map(l => l.id === editId ? loan : l);
    editId = null;
  } else {
    loans.push(loan);
  }

  form.reset();
  save();
});

// HELPERS
function monthKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function firstDueDate(loan) {
  const d = new Date(loan.startDate);
  d.setMonth(d.getMonth() + 1);
  d.setDate(loan.dueDay);
  return d;
}

// DASHBOARD
function renderDashboard() {
  dashboardPage.innerHTML = "<h3>Dashboard</h3>";
  const today = new Date();
  const currentMonth = monthKey(today);

  let pending = [];
  let upcoming = [];

  loans.forEach(loan => {
    const due = firstDueDate(loan);

    if (today >= due && loan.lastCollectedMonth !== currentMonth) {
      pending.push(loan);
    } else {
      upcoming.push({ loan, due });
    }
  });

  if (!pending.length && !upcoming.length) {
    dashboardPage.innerHTML += "<p>✅ No reminders</p>";
    return;
  }

  if (pending.length) {
    dashboardPage.innerHTML += "<h4>🔴 Pending</h4>";
    pending.forEach(l => dashboardPage.innerHTML += dashboardCard(l, "pending"));
  }

  if (upcoming.length) {
    dashboardPage.innerHTML += "<h4>🕒 Upcoming</h4>";
    upcoming.forEach(({ loan, due }) =>
      dashboardPage.innerHTML += `
        <div class="loan-card upcoming">
          ${loan.name} – ₹${loan.interest}<br>
          Due on ${due.toDateString()}
        </div>`
    );
  }
}

// DASHBOARD CARD
function dashboardCard(loan) {
  return `
    <div class="loan-card pending">
      ${loan.name} – ₹${loan.interest}<br><br>
      <button onclick="collect(${loan.id})">Collected</button>
    </div>
  `;
}

// ACTIONS
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

// ALL LOANS
function renderAllLoans() {
  loansPage.innerHTML = "<h3>All Loans</h3>";

  loans.forEach(l => {
    loansPage.innerHTML += `
      <div class="loan-card">
        <strong>${l.name}</strong><br>
        Amount: ₹${l.amount}<br>
        Interest: ₹${l.interest}<br>
        <button onclick="editLoan(${l.id})">Edit</button>
        <button onclick="deleteLoan(${l.id})">Delete</button>
      </div>
    `;
  });
}



//backup 

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



//import

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



//service layer
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js");
}

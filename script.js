// ✅ GLOBAL FUNCTIONS FOR LOCALSTORAGE
function getAdminPassword() {
  return localStorage.getItem("adminPassword") || "collegeadmin";
}
function setAdminPassword(newPass) {
  localStorage.setItem("adminPassword", newPass);
}
function getEvents() {
  return JSON.parse(localStorage.getItem("events") || "[]");
}
function saveEvents(ev) {
  localStorage.setItem("events", JSON.stringify(ev));
}
function getRegs() {
  return JSON.parse(localStorage.getItem("registrations") || "[]");
}
function saveRegs(r) {
  localStorage.setItem("registrations", JSON.stringify(r));
}

// ✅ PREPOPULATE DEFAULT EVENTS ON FIRST LOAD
if (!localStorage.getItem("events")) {
  saveEvents([
    { name: "TechFest 2025", date: "2025-08-10", location: "Auditorium Hall" },
    { name: "Sports Meet", date: "2025-08-20", location: "College Ground" }
  ]);
}

// ✅ INDEX.HTML - Event Listing & Search
if (document.getElementById("eventList")) {
  const list = document.getElementById("eventList");
  const search = document.getElementById("searchInput");

  function renderList(filter = "") {
    const events = getEvents(); // always fetch fresh list
    list.innerHTML = "";

    const filtered = events.filter(e =>
      e.name.toLowerCase().includes(filter.toLowerCase())
    );

    if (filtered.length === 0) {
      list.innerHTML = "<p>No events found.</p>";
      return;
    }

    filtered.forEach(e => {
      const card = document.createElement("div");
      card.className = "event-card";
      card.innerHTML = `
        <h3>${e.name}</h3>
        <p>Date: ${e.date}</p>
        <p>Location: ${e.location}</p>
        <button onclick="location.href='register.html?event=${encodeURIComponent(e.name)}'">Register</button>`;
      list.appendChild(card);
    });
  }

  renderList();
  search.addEventListener("input", () => renderList(search.value));
}

// ✅ REGISTER.HTML - Register for Event + EmailJS
if (document.getElementById("registrationForm")) {
  const params = new URLSearchParams(window.location.search);
  const evt = params.get("event");
  if (evt) document.getElementById("eventInput").value = evt;

  document.getElementById("registrationForm").addEventListener("submit", e => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const eventName = form.event.value;

    const regs = getRegs();
    if (regs.some(r => r.email === email && r.event === eventName)) {
      document.getElementById("successMessage").innerText = "You have already registered.";
      return;
    }

    regs.push({ name, email, event: eventName });
    saveRegs(regs);
    document.getElementById("successMessage").innerText = "Successfully registered!";
    form.reset();

    // EmailJS integration (uncomment and replace IDs to activate)
    /*
    emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", {
      to_name: name,
      to_email: email,
      event_name: eventName,
    })
    .then(() => console.log("Email sent successfully"))
    .catch((err) => console.error("Email send error:", err));
    */
  });
}

// ✅ ADMIN-LOGIN.HTML - Password Check
if (document.getElementById("loginForm")) {
  document.getElementById("loginForm").addEventListener("submit", e => {
    e.preventDefault();
    const pass = document.getElementById("adminPass").value;
    if (pass === getAdminPassword()) {
      localStorage.setItem("adminAuth", "true");
      window.location.href = "admin-dashboard.html";
    } else {
      document.getElementById("loginError").innerText = "Incorrect password.";
    }
  });
}

// ✅ ADMIN-DASHBOARD.HTML - Dashboard Logic
if (document.getElementById("eventForm")) {
  if (localStorage.getItem("adminAuth") !== "true") {
    alert("Unauthorized! Please login.");
    window.location.href = "admin-login.html";
  }

  const eventForm = document.getElementById("eventForm");
  const eventsListEl = document.getElementById("eventsAdminList");
  const regs = getRegs();

  function renderAdmin() {
    const events = getEvents();
    eventsListEl.innerHTML = "";
    events.forEach((e, i) => {
      const li = document.createElement("li");
      li.innerHTML = `${e.name} (${e.date}, ${e.location}) <button onclick="deleteEvent(${i})">Delete</button>`;
      eventsListEl.appendChild(li);
    });

    const tbody = document.querySelector("#registrationsTable tbody");
    tbody.innerHTML = "";
    regs.forEach((r, idx) => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${r.name}</td><td>${r.email}</td><td>${r.event}</td>
        <td><button onclick="deleteRegistration(${idx})">Delete</button></td>`;
      tbody.appendChild(row);
    });
  }

  window.deleteEvent = function(i) {
    const ev = getEvents();
    const removed = ev.splice(i, 1);
    saveEvents(ev);
    const filtered = regs.filter(r => r.event !== removed[0].name);
    saveRegs(filtered);
    renderAdmin();
  };

  window.deleteRegistration = function(i) {
    regs.splice(i, 1);
    saveRegs(regs);
    renderAdmin();
  };

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("adminAuth");
    window.location.href = "admin-login.html";
  });

  eventForm.addEventListener("submit", e => {
    e.preventDefault();
    const newEv = {
      name: document.getElementById("eventName").value.trim(),
      date: document.getElementById("eventDate").value,
      location: document.getElementById("eventLocation").value.trim(),
    };
    const ev = getEvents();
    ev.push(newEv);
    saveEvents(ev);
    eventForm.reset();
    renderAdmin();
  });

  document.getElementById("exportCsvBtn").addEventListener("click", () => {
    const data = getRegs();
    let csv = "Name,Email,Event\n" + data.map(r => `${r.name},${r.email},${r.event}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "registrations.csv"; a.click();
    URL.revokeObjectURL(url);
  });

  // ✅ Change Password Section
  const passForm = document.getElementById("changePassForm");
  if (passForm) {
    passForm.addEventListener("submit", e => {
      e.preventDefault();
      const current = document.getElementById("currentPass").value;
      const newPass = document.getElementById("newPass").value;
      const msg = document.getElementById("changePassMsg");

      if (current === getAdminPassword()) {
        setAdminPassword(newPass);
        msg.innerText = "Password changed successfully!";
        msg.style.color = "green";
      } else {
        msg.innerText = "Incorrect current password!";
        msg.style.color = "red";
      }
      e.target.reset();
    });
  }

  renderAdmin();
}
const toggleBtn = document.getElementById("themeToggle");

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
  toggleBtn.textContent = "☀️ Light Mode";
}

toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  if (document.body.classList.contains("dark-mode")) {
    toggleBtn.textContent = "☀️ Light Mode";
    localStorage.setItem("theme", "dark");
  } else {
    toggleBtn.textContent = "🌙 Dark Mode";
    localStorage.setItem("theme", "light");
  }
});



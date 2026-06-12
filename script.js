function updateCalendar() {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1; // Months are zero-based
    document.getElementById("day").textContent = day;
    document.getElementById("month").textContent = month;
    const monthnames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthIndex = now.getMonth();
    const monthName = monthnames[monthIndex];
    document.getElementById("month").textContent = monthName;
  }
updateCalendar();
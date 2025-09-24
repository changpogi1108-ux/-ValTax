// Navigation: Show and hide pages
const navLinks = document.querySelectorAll("nav ul li a");
const pages = document.querySelectorAll(".page");

navLinks.forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    const target = link.getAttribute("data-page");

    pages.forEach(page => {
      page.classList.remove("active");
      if (page.id === target) {
        page.classList.add("active");
      }
    });
  });
});

// Compliance Calendar - Add Task
const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");

if (taskForm) {
  taskForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const taskName = document.getElementById("taskName").value;
    const taskDate = document.getElementById("taskDate").value;

    if (taskName && taskDate) {
      const li = document.createElement("li");
      li.textContent = `${taskName} - Due: ${taskDate}`;
      taskList.appendChild(li);

      document.getElementById("taskName").value = "";
      document.getElementById("taskDate").value = "";
    }
  });
}

// Search bar functionality
const searchInput = document.getElementById("search");
if (searchInput) {
  searchInput.addEventListener("keyup", function () {
    const query = searchInput.value.toLowerCase();
    navLinks.forEach(link => {
      const text = link.textContent.toLowerCase();
      if (text.includes(query)) {
        link.style.display = "block";
      } else {
        link.style.display = "none";
      }
    });
  });
}

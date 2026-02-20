const navMount = document.querySelector("[data-nav]");

const fallbackNav = `
  <nav class="nav" aria-label="Main">
    <div class="nav-content">
      <a class="logo-link" href="#top">
        <span class="logo-mark">AA</span>
        <span class="logo-text">Placeholder</span>
      </a>
      <button class="nav-toggle" type="button" data-menu-toggle aria-expanded="false">Menu</button>
      <ul class="nav-links" data-menu>
        <li><a href="#about">Section One</a></li>
        <li><a href="#research">Section Two</a></li>
        <li><a href="#projects">Section Three</a></li>
        <li><a href="#contact">Section Four</a></li>
        <li class="dropdown">
          <button class="dropdown-toggle" type="button" aria-expanded="false">More</button>
          <ul class="dropdown-menu">
            <li><a href="about.html">About Page</a></li>
            <li><a href="secondary.html">Secondary Page</a></li>
            <li><a href="#projects">Extra Link</a></li>
          </ul>
        </li>
      </ul>
    </div>
  </nav>
`;

function attachNavInteractions() {
  const nav = document.querySelector(".nav");
  const toggle = nav?.querySelector("[data-menu-toggle]");
  const menu = nav?.querySelector("[data-menu]");

  if (!nav || !toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  const dropdown = nav.querySelector(".dropdown");
  const dropdownToggle = dropdown?.querySelector(".dropdown-toggle");
  if (dropdown && dropdownToggle) {
    dropdownToggle.addEventListener("click", () => {
      const isOpen = dropdown.classList.toggle("is-open");
      dropdownToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  menu.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.tagName === "A") {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      if (dropdown && dropdownToggle) {
        dropdown.classList.remove("is-open");
        dropdownToggle.setAttribute("aria-expanded", "false");
      }
    }
  });
}

async function loadNav() {
  if (!navMount) return;

  try {
    const res = await fetch("./nav.html", { cache: "no-store" });
    if (!res.ok) throw new Error("Nav fetch failed");
    navMount.innerHTML = await res.text();
  } catch (err) {
    navMount.innerHTML = fallbackNav;
  }

  attachNavInteractions();
}

async function maybeInitThree() {
  const container = document.getElementById("three-container");
  if (!container) return;
  const module = await import("./three-placeholder.js");
  module.initThreePlaceholder();
}

loadNav();
maybeInitThree();

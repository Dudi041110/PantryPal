// =============================
// FILE: script.js
// =============================

function validateEmail() {
  const email = document.getElementById('emailInput').value;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (emailPattern.test(email)) {
    alert('Thank you! Your email has been submitted to PantryPal.');
  } else {
    alert('Please enter a valid email address.');
  }
}

// Smooth scrolling for anchor links

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();

    const target = document.querySelector(this.getAttribute('href'));

    if (target) {
      target.scrollIntoView({
        behavior: 'smooth'
      });
    }
  });
});
// Smooth Reveal Observer
const observerOptions = {
    root: null,
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
};

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            // Optional: stop observing once triggered
            // revealObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-right').forEach((el) => revealObserver.observe(el));

// Magnetic Button Effect
const magneticBtns = document.querySelectorAll('.magnetic-btn');
magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', function (e) {
        const position = btn.getBoundingClientRect();
        const x = (e.clientX - position.left - position.width / 2) * 0.4;
        const y = (e.clientY - position.top - position.height / 2) * 0.4;
        btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener('mouseleave', function () {
        btn.style.transform = 'translate(0px, 0px)';
    });
});

// Back to Top Logic
const backToTopBtn = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
    if (window.scrollY > 600) {
        backToTopBtn.classList.add('visible');
    } else {
        backToTopBtn.classList.remove('visible');
    }
});

backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Advanced Smooth Scrolling for internal links
document.querySelectorAll('a[href*="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        try {
            const url = new URL(this.href);
            if (url.pathname === window.location.pathname && url.hash && url.hash !== '#') {
                e.preventDefault();
                const targetElement = document.querySelector(url.hash);
                if (targetElement) {
                    const navHeight = 80;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        } catch (err) { }
    });
});

// Mobile Menu Logic
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const mobileMenuIcon = document.getElementById('mobile-menu-icon');
const mobileLinks = document.querySelectorAll('.mobile-link');

if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
        mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);

        if (!isExpanded) {
            mobileMenu.classList.remove('translate-x-full');
            mobileMenuIcon.textContent = 'close';
            document.body.style.overflow = 'hidden';
        } else {
            mobileMenu.classList.add('translate-x-full');
            mobileMenuIcon.textContent = 'menu';
            document.body.style.overflow = '';
        }
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('translate-x-full');
            mobileMenuIcon.textContent = 'menu';
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        });
    });
}


// WhatsApp Form Logic
const waForm = document.getElementById('wa-contact-form');
if (waForm) {
    waForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const name = document.getElementById('wa-name').value.trim();
        const company = document.getElementById('wa-company').value.trim() || '-';
        const service = document.getElementById('wa-service').value;
        const message = document.getElementById('wa-message').value.trim();

        const waNumber = '6285155336838'; // Target WhatsApp number

        const waMessage = "Halo Tim AMK,%0A%0A" +
            "Saya ingin berkonsultasi mengenai proyek digital.%0A" +
            "*Nama:* " + name + "%0A" +
            "*Perusahaan:* " + company + "%0A" +
            "*Layanan Diminati:* " + service + "%0A%0A" +
            "*Pesan:*%0A" + message;

        const waUrl = "https://wa.me/" + waNumber + "?text=" + waMessage;
        window.open(waUrl, '_blank');
    });
}

// Page Transition Logic
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('page-transition');
    if (overlay) {
        // Fade in on load
        setTimeout(() => {
            overlay.classList.remove('opacity-100');
            overlay.classList.add('opacity-0');
            // Completely hide after transition
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 700);
        }, 100);

        // Handle internal link clicks to fade out
        document.querySelectorAll('a').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                // Skip if it's an anchor link (#), target blank, or external
                const href = this.getAttribute('href');
                if (!href || href.startsWith('#') || this.getAttribute('target') === '_blank' || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('http')) {
                    // Let default happen (or other JS like smooth scroll)
                    return;
                }

                // For standard internal pages like apps/pages/portfolio.php
                const url = new URL(this.href, window.location.href);
                if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
                    e.preventDefault();
                    overlay.style.display = 'flex';
                    setTimeout(() => {
                        overlay.classList.remove('opacity-0');
                        overlay.classList.add('opacity-100');

                        setTimeout(() => {
                            window.location.href = this.href;
                        }, 500); // Redirect after fade out
                    }, 10);
                }
            });
        });
    }
});

// Mencegah Klik Kanan
document.addEventListener('contextmenu', event => event.preventDefault());

// Mencegah shortcut keyboard tertentu
document.onkeydown = function (e) {
    if (e.keyCode == 123) return false; // F12
    if (e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) return false; // Inspect
    if (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) return false; // View Source
};

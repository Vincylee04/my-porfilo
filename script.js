// ==========================================
// CONFIGURATION
// ==========================================
const SUPABASE_URL = 'https://xpnzszalqjyugegenrjq.supabase.co';
// TODO: PASTE YOUR SUPABASE ANON KEY BELOW
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbnpzemFscWp5dWdlZ2VucmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Mzc3MjAsImV4cCI6MjA4NTIxMzcyMH0.tvNLv_JkwdaIXnLmU3clnZqgwVkpoWEwqwqjyL5xi-Q';

// Initialize Client (Safely)
let supabase = null;
try {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } else {
        console.error('Supabase SDK not loaded.');
    }
} catch (err) {
    console.error('Supabase initialization failed:', err);
}

/* =========================================
   DOM ELEMENTS
   ========================================= */
const projectsGrid = document.getElementById('projects-grid');
const yearSpan = document.getElementById('year');
const contactForm = document.getElementById('contact-form');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section');
const scrollToTopBtn = document.getElementById('scrollToTop');
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.querySelector('.mobile-menu');

/* =========================================
   INIT
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    fetchProjects();
    updateCopyrightYear();
    setupMobileMenu(); // Setup UI listeners immediately
});

/* =========================================
   FUNCTIONS
   ========================================= */

// 1. Fetch & Render Projects
async function fetchProjects() {
    if (!projectsGrid) return; // Guard clause

    if (!supabase) {
        console.warn('Supabase not available. Projects will not load.');
        projectsGrid.innerHTML = '<p style="color:var(--text-secondary)">Failed to connect to database. Please check connection.</p>';
        return;
    }

    const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching projects:', error);
        projectsGrid.innerHTML = '<p>Failed to load projects.</p>';
        return;
    }

    if (!projects || projects.length === 0) {
        projectsGrid.innerHTML = '<p>No projects found. Add one in the Admin Portal!</p>';
        return;
    }

    projectsGrid.innerHTML = projects.map(project => `
        <div class="project-card">
            <div class="project-content">
                <h3 class="project-title">${project.title}</h3>
                <p class="project-desc">${project.description || ''}</p>
                <div class="project-tech-stack">
                    ${(project.tech || []).map(t => `<span class="tech-badge">${t}</span>`).join('')}
                </div>
                <div class="project-links">
                    ${project.demo_url ? `<a href="${project.demo_url}" class="link-btn demo" target="_blank">Live Demo</a>` : ''}
                    ${project.code_url ? `<a href="${project.code_url}" class="link-btn code" target="_blank">Source Code</a>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// 2. Copyright Year
function updateCopyrightYear() {
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
}

// 3. Form Validation & Submission
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!supabase) {
            alert("Database connection unavailable. Please email directly.");
            return;
        }

        const name = document.getElementById('name');
        const email = document.getElementById('email');
        const message = document.getElementById('message');
        const statusDiv = document.getElementById('form-status');
        const btn = contactForm.querySelector('button');

        let isValid = true;

        // Reset errors
        document.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');
        statusDiv.textContent = '';

        // Validate
        if (name.value.trim() === '') { showError('name-error', 'Name is required'); isValid = false; }
        if (!isValidEmail(email.value)) { showError('email-error', 'Please enter a valid email'); isValid = false; }
        if (message.value.trim() === '') { showError('message-error', 'Message cannot be empty'); isValid = false; }

        if (isValid) {
            // Sending...
            const originalText = btn.textContent;
            btn.textContent = 'Sending...';
            btn.disabled = true;

            // Insert into Supabase
            const { error } = await supabase.from('messages').insert([{
                name: name.value,
                email: email.value,
                message: message.value
            }]);

            if (error) {
                statusDiv.className = 'form-status error';
                statusDiv.textContent = 'Error sending message. Please try again.';
                console.error(error);
            } else {
                statusDiv.className = 'form-status success';
                statusDiv.textContent = 'Message sent successfully!';

                // Send Email Notification via EmailJS
                if (window.emailjs) {
                    emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
                        from_name: name.value,
                        from_email: email.value,
                        message: message.value
                    }).then(function () {
                        console.log('Email sent successfully!');
                    }, function (error) {
                        console.log('Email failed to send...', error);
                    });
                }

                contactForm.reset();
            }

            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}

function showError(id, message) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
    }
}

function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// 4. Smooth Scroll & Actions
window.addEventListener('scroll', () => {
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current)) {
            link.classList.add('active');
        }
    });

    if (scrollToTopBtn) {
        if (window.scrollY > 500) {
            scrollToTopBtn.classList.remove('hidden');
        } else {
            scrollToTopBtn.classList.add('hidden');
        }
    }
});

if (scrollToTopBtn) {
    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// 5. Mobile Menu Setup (Robust)
function setupMobileMenu() {
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            hamburger.classList.toggle('active'); // Optional: Added for CSS animation potential
        });

        // Close menu when clicking links
        document.querySelectorAll('.mobile-nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                hamburger.classList.remove('active');
            });
        });
    } else {
        console.warn("Mobile menu elements not found.");
    }
}

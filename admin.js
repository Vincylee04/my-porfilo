(function () {

    // ==========================================
    // CONFIGURATION
    // ==========================================
    const SUPABASE_URL = 'https://xpnzszalqjyugegenrjq.supabase.co';
    // TODO: PASTE YOUR SUPABASE ANON KEY BELOW
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbnpzemFscWp5dWdlZ2VucmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Mzc3MjAsImV4cCI6MjA4NTIxMzcyMH0.tvNLv_JkwdaIXnLmU3clnZqgwVkpoWEwqwqjyL5xi-Q';

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


    // ==========================================
    // AUTHENTICATION
    // ==========================================
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginForm = document.getElementById('login-form');
    const userEmailSpan = document.getElementById('user-email');

    // Check Session on Load
    async function checkSession() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            showDashboard(session.user);
        } else {
            showLogin();
        }
    }

    function showLogin() {
        loginView.style.display = 'block';
        dashboardView.style.display = 'none';
        logoutBtn.style.display = 'none';
    }

    function showDashboard(user) {
        loginView.style.display = 'none';
        dashboardView.style.display = 'block';
        logoutBtn.style.display = 'block';
        userEmailSpan.textContent = user.email;
        loadProjects();
        loadMessages();
    }

    // Login Handler
    // Login/Signup State
    let isLoginMode = true;
    const authToggle = document.getElementById('auth-toggle');
    const authToggleText = document.getElementById('auth-toggle-text');
    const formTitle = document.querySelector('#login-view h2');
    const formBtn = document.querySelector('#login-view button[type="submit"]');

    authToggle.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;

        if (isLoginMode) {
            formTitle.textContent = 'Admin Login';
            formBtn.textContent = 'Sign In';
            authToggleText.textContent = "Don't have an account?";
            authToggle.textContent = "Sign Up";
        } else {
            formTitle.textContent = 'Create Admin Account';
            formBtn.textContent = 'Sign Up';
            authToggleText.textContent = "Already have an account?";
            authToggle.textContent = "Sign In";
        }
    });

    // Auth Handler
    // Auth Handler
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Form submitted. Mode (isLoginMode):", isLoginMode);

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorMsg = document.getElementById('login-error');

        // UI Loading State
        const originalBtnText = formBtn.textContent;
        formBtn.textContent = 'Processing...';
        formBtn.disabled = true;

        errorMsg.style.display = 'none';

        try {
            if (isLoginMode) {
                console.log("Attempting Sign In...");
                // Sign In
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (error) throw error;

                console.log("Sign In Successful:", data);
                showDashboard(data.user);
            } else {
                console.log("Attempting Sign Up...");
                // Sign Up
                const { data, error } = await supabase.auth.signUp({
                    email: email,
                    password: password,
                });

                if (error) throw error;

                console.log("Sign Up Response:", data);

                if (data.user && data.user.identities && data.user.identities.length === 0) {
                    alert("Account already exists. Please Sign In instead.");
                    authToggle.click();
                } else {
                    alert("Account created! Please check your email to confirm your account before logging in.");
                    // Switch back to login mode
                    authToggle.click();
                }
            }
        } catch (error) {
            console.error("Auth Error:", error);
            errorMsg.textContent = error.message;
            errorMsg.style.display = 'block';
        } finally {
            // Reset UI
            formBtn.textContent = originalBtnText;
            formBtn.disabled = false;
        }
    });

    // Logout Handler
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        showLogin();
    });

    // ==========================================
    // PROJECTS MANAGEMENT
    // ==========================================
    const projectsList = document.getElementById('admin-projects-list');
    const addProjectForm = document.getElementById('add-project-form');

    async function loadProjects() {
        projectsList.innerHTML = '<p>Loading...</p>';

        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            projectsList.innerHTML = '<p class="error-msg">Error loading projects</p>';
            return;
        }

        if (data.length === 0) {
            projectsList.innerHTML = '<p>No projects found.</p>';
            return;
        }

        projectsList.innerHTML = '';
        data.forEach(project => {
            const item = document.createElement('div');
            item.className = 'admin-project-item';
            item.innerHTML = `
            <div>
                <strong>${project.title}</strong><br>
                <small>${project.tech.join(', ')}</small>
            </div>
            <button class="btn btn-secondary" onclick="deleteProject(${project.id})" style="padding: 0.5rem 1rem; font-size: 0.8rem; border-color: #ff6b6b; color: #ff6b6b;">Delete</button>
        `;
            projectsList.appendChild(item);
        });
    }

    // Add Project
    addProjectForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('p-title').value;
        const desc = document.getElementById('p-desc').value;
        const tech = document.getElementById('p-tech').value.split(',').map(t => t.trim());
        const demo = document.getElementById('p-demo').value;
        const code = document.getElementById('p-code').value;

        const { error } = await supabase.from('projects').insert([{
            title: title,
            description: desc,
            tech: tech,
            demo_url: demo,
            code_url: code
        }]);

        if (error) {
            alert('Error adding project: ' + error.message);
        } else {
            alert('Project added successfully!');
            addProjectForm.reset();
            loadProjects();
        }
    });

    // Delete Project (Global function to be accessible from HTML onclick)
    window.deleteProject = async function (id) {
        if (!confirm('Are you sure you want to delete this project?')) return;

        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Error deleting: ' + error.message);
        } else {
            loadProjects();
        }
    };

    // ==========================================
    // MESSAGES VIEWING
    // ==========================================
    const messagesList = document.getElementById('messages-list');

    async function loadMessages() {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            return;
        }

        if (data.length === 0) {
            messagesList.innerHTML = '<p>No messages yet.</p>';
            return;
        }

        messagesList.innerHTML = '';
        data.forEach(msg => {
            const item = document.createElement('div');
            item.className = 'message-item';
            const date = new Date(msg.created_at).toLocaleString();
            item.innerHTML = `
            <div class="meta">
                <strong>${msg.name} (${msg.email})</strong>
                <span>${date}</span>
            </div>
            <p>${msg.message}</p>
        `;
            messagesList.appendChild(item);
        });
    }

    // Init
    checkSession();
})();

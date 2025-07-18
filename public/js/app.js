// SRPH-MIS JavaScript Application

// State management
const state = {
    user: null,
    currentView: 'login',
    assets: [],
    users: []
};

// DOM elements
const elements = {
    // Views
    loginView: document.getElementById('login-view'),
    setupView: document.getElementById('setup-view'),
    dashboardView: document.getElementById('dashboard-view'),
    
    // Content views
    dashboardContent: document.getElementById('dashboard-content'),
    assetsContent: document.getElementById('assets-content'),
    usersContent: document.getElementById('users-content'),
    
    // Forms
    loginForm: document.getElementById('login-form'),
    setupForm: document.getElementById('setup-form'),
    addUserForm: document.getElementById('add-user-form'),
    
    // Error messages
    loginError: document.getElementById('login-error'),
    setupError: document.getElementById('setup-error'),
    addUserError: document.getElementById('add-user-error'),
    
    // Navigation
    navItems: document.querySelectorAll('.nav-item a'),
    
    // User info
    userName: document.getElementById('user-name'),
    logoutButton: document.getElementById('logout-button'),
    
    // Modals
    addUserModal: document.getElementById('add-user-modal'),
    closeModal: document.querySelector('.close-modal'),
    
    // Buttons
    addUserBtn: document.getElementById('add-user-btn'),
    
    // Tables
    usersTableBody: document.getElementById('users-table-body'),
    assetsTableBody: document.getElementById('assets-table-body'),
    
    // Stats
    assetCount: document.getElementById('asset-count'),
    assetAvailable: document.getElementById('asset-available'),
    assetAssigned: document.getElementById('asset-assigned'),
    userCount: document.getElementById('user-count'),
    userAdmins: document.getElementById('user-admins'),
    userStaff: document.getElementById('user-staff'),
    
    // Toast
    toast: document.getElementById('toast')
};

// API functions
const api = {
    async login(username, password) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
            }
            
            return await response.json();
        } catch (error) {
            throw error;
        }
    },
    
    async logout() {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST'
            });
            
            if (!response.ok) {
                throw new Error('Logout failed');
            }
            
            return true;
        } catch (error) {
            throw error;
        }
    },
    
    async getCurrentUser() {
        try {
            const response = await fetch('/api/user');
            
            if (response.status === 401) {
                return null;
            }
            
            if (!response.ok) {
                throw new Error('Failed to get current user');
            }
            
            return await response.json();
        } catch (error) {
            throw error;
        }
    },
    
    async checkSetup() {
        try {
            const response = await fetch('/api/setup');
            
            if (!response.ok) {
                throw new Error('Failed to check setup status');
            }
            
            return await response.json();
        } catch (error) {
            throw error;
        }
    },
    
    async completeSetup(userData) {
        try {
            const response = await fetch('/api/setup/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Setup failed');
            }
            
            return await response.json();
        } catch (error) {
            throw error;
        }
    },
    
    async getUsers() {
        try {
            const response = await fetch('/api/users');
            
            if (!response.ok) {
                throw new Error('Failed to get users');
            }
            
            return await response.json();
        } catch (error) {
            throw error;
        }
    },
    
    async createUser(userData) {
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create user');
            }
            
            return await response.json();
        } catch (error) {
            throw error;
        }
    },
    
    async getAssets() {
        try {
            const response = await fetch('/api/assets');
            
            if (!response.ok) {
                throw new Error('Failed to get assets');
            }
            
            return await response.json();
        } catch (error) {
            throw error;
        }
    },
    
    async getStats() {
        try {
            const response = await fetch('/api/stats');
            
            if (!response.ok) {
                throw new Error('Failed to get stats');
            }
            
            return await response.json();
        } catch (error) {
            throw error;
        }
    }
};

// UI functions
const ui = {
    showView(viewName) {
        elements.loginView.style.display = 'none';
        elements.setupView.style.display = 'none';
        elements.dashboardView.style.display = 'none';
        
        switch (viewName) {
            case 'login':
                elements.loginView.style.display = 'flex';
                break;
            case 'setup':
                elements.setupView.style.display = 'flex';
                break;
            case 'dashboard':
                elements.dashboardView.style.display = 'block';
                break;
        }
        
        state.currentView = viewName;
    },
    
    showContentView(contentName) {
        elements.dashboardContent.classList.remove('active');
        elements.assetsContent.classList.remove('active');
        elements.usersContent.classList.remove('active');
        
        elements.navItems.forEach(item => {
            item.parentElement.classList.remove('active');
            
            if (item.dataset.view === contentName) {
                item.parentElement.classList.add('active');
            }
        });
        
        switch (contentName) {
            case 'dashboard':
                elements.dashboardContent.classList.add('active');
                break;
            case 'assets':
                elements.assetsContent.classList.add('active');
                break;
            case 'users':
                elements.usersContent.classList.add('active');
                break;
        }
    },
    
    updateUserInfo(user) {
        if (user) {
            const name = user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user.username;
                
            elements.userName.textContent = name;
        }
    },
    
    updateStats(stats) {
        if (stats) {
            // Asset stats
            elements.assetCount.textContent = stats.assets.total;
            elements.assetAvailable.textContent = `${stats.assets.available} Available`;
            elements.assetAssigned.textContent = `${stats.assets.checkedOut} Assigned`;
            
            // User stats
            elements.userCount.textContent = stats.users.total;
            elements.userAdmins.textContent = `${stats.users.admins} Admins`;
            elements.userStaff.textContent = `${stats.users.staff} Staff`;
        }
    },
    
    updateUserTable(users) {
        elements.usersTableBody.innerHTML = '';
        
        if (users && users.length > 0) {
            users.forEach(user => {
                const row = document.createElement('tr');
                
                const name = user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : '-';
                    
                row.innerHTML = `
                    <td>${user.username}</td>
                    <td>${name}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td>
                        <button class="btn-edit" data-id="${user.id}">Edit</button>
                        <button class="btn-delete" data-id="${user.id}">Delete</button>
                    </td>
                `;
                
                elements.usersTableBody.appendChild(row);
            });
        }
    },
    
    showModal(modalElement) {
        modalElement.style.display = 'flex';
    },
    
    hideModal(modalElement) {
        modalElement.style.display = 'none';
    },
    
    showToast(message, type = 'success') {
        elements.toast.textContent = message;
        elements.toast.className = 'toast';
        elements.toast.classList.add(type);
        elements.toast.classList.add('show');
        
        setTimeout(() => {
            elements.toast.classList.remove('show');
        }, 3000);
    },
    
    clearForm(formElement) {
        formElement.reset();
    }
};

// App functions
const app = {
    async init() {
        try {
            // Check if user is logged in
            const user = await api.getCurrentUser();
            
            if (user) {
                state.user = user;
                ui.updateUserInfo(user);
                
                // Check if setup is complete
                const setupStatus = await api.checkSetup();
                
                if (!setupStatus.setupComplete) {
                    ui.showView('setup');
                } else {
                    await this.loadDashboard();
                }
            } else {
                ui.showView('login');
            }
        } catch (error) {
            console.error('Initialization error:', error);
            ui.showView('login');
        }
        
        this.setupEventListeners();
    },
    
    setupEventListeners() {
        // Login form
        elements.loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = elements.loginForm.username.value;
            const password = elements.loginForm.password.value;
            
            try {
                elements.loginError.textContent = '';
                const user = await api.login(username, password);
                
                state.user = user;
                ui.updateUserInfo(user);
                
                // Check if setup is complete
                const setupStatus = await api.checkSetup();
                
                if (!setupStatus.setupComplete) {
                    ui.showView('setup');
                } else {
                    await this.loadDashboard();
                }
            } catch (error) {
                elements.loginError.textContent = error.message || 'Invalid username or password';
            }
        });
        
        // Setup form
        elements.setupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userData = {
                username: elements.setupForm.username.value,
                password: elements.setupForm.password.value,
                email: elements.setupForm.email.value,
                firstName: elements.setupForm.firstName.value,
                lastName: elements.setupForm.lastName.value
            };
            
            try {
                elements.setupError.textContent = '';
                const user = await api.completeSetup(userData);
                
                state.user = user;
                ui.updateUserInfo(user);
                ui.showToast('Setup completed successfully');
                
                await this.loadDashboard();
            } catch (error) {
                elements.setupError.textContent = error.message || 'Setup failed';
            }
        });
        
        // Navigation
        elements.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                ui.showContentView(item.dataset.view);
            });
        });
        
        // Logout
        elements.logoutButton.addEventListener('click', async () => {
            try {
                await api.logout();
                state.user = null;
                ui.showView('login');
                ui.clearForm(elements.loginForm);
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
        
        // Add user button
        elements.addUserBtn.addEventListener('click', () => {
            ui.clearForm(elements.addUserForm);
            elements.addUserError.textContent = '';
            ui.showModal(elements.addUserModal);
        });
        
        // Close modal
        elements.closeModal.addEventListener('click', () => {
            ui.hideModal(elements.addUserModal);
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === elements.addUserModal) {
                ui.hideModal(elements.addUserModal);
            }
        });
        
        // Add user form
        elements.addUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userData = {
                username: elements.addUserForm.username.value,
                password: elements.addUserForm.password.value,
                email: elements.addUserForm.email.value,
                firstName: elements.addUserForm.firstName.value,
                lastName: elements.addUserForm.lastName.value,
                role: elements.addUserForm.role.value
            };
            
            try {
                elements.addUserError.textContent = '';
                const newUser = await api.createUser(userData);
                
                // Add to state and update UI
                state.users.push(newUser);
                ui.updateUserTable(state.users);
                
                ui.hideModal(elements.addUserModal);
                ui.showToast('User created successfully');
                
                // Refresh stats
                await this.loadStats();
            } catch (error) {
                elements.addUserError.textContent = error.message || 'Failed to create user';
            }
        });
    },
    
    async loadDashboard() {
        ui.showView('dashboard');
        ui.showContentView('dashboard');
        
        try {
            // Load initial data
            await this.loadStats();
            await this.loadUsers();
            await this.loadAssets();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            ui.showToast('Error loading data', 'error');
        }
    },
    
    async loadStats() {
        try {
            const stats = await api.getStats();
            ui.updateStats(stats);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    },
    
    async loadUsers() {
        try {
            const users = await api.getUsers();
            state.users = users;
            ui.updateUserTable(users);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    },
    
    async loadAssets() {
        try {
            const assets = await api.getAssets();
            state.assets = assets;
            // Update asset table here if needed
        } catch (error) {
            console.error('Error loading assets:', error);
        }
    }
};

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
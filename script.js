// DOM Elements
const addProductBtn = document.getElementById('addProductBtn');
const loginBtn = document.getElementById('loginBtn');
const feedbackBtn = document.getElementById('feedbackBtn');
const addProductModal = document.getElementById('addProductModal');
const loginModal = document.getElementById('loginModal');
const feedbackModal = document.getElementById('feedbackModal');
const subscriptionPlansModal = document.getElementById('subscriptionPlansModal');
const paymentInstructionsModal = document.getElementById('paymentInstructionsModal');
const adminDashboardModal = document.getElementById('adminDashboardModal');
const closeButtons = document.getElementsByClassName('close');
const addProductForm = document.getElementById('addProductForm');
const loginForm = document.getElementById('loginForm');
const feedbackForm = document.getElementById('feedbackForm');
const productsContainer = document.getElementById('productsContainer');
const confirmPaymentBtn = document.getElementById('confirmPayment');
const usersList = document.getElementById('usersList');
const adminProductsList = document.getElementById('adminProductsList');
const feedbackList = document.getElementById('feedbackList');
const userSearch = document.getElementById('userSearch');
const productSearch = document.getElementById('productSearch');
const feedbackSearch = document.getElementById('feedbackSearch');
const mainProductSearch = document.getElementById('mainProductSearch');
const tabButtons = document.querySelectorAll('.tab-button');

// Sidebar Navigation
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('closeSidebar');
const overlay = document.getElementById('overlay');
const sidebarLinks = document.querySelectorAll('.sidebar-links a');
const sidebarAddProductBtn = document.getElementById('sidebarAddProductBtn');
const sidebarFeedbackBtn = document.getElementById('sidebarFeedbackBtn');
const sidebarLoginBtn = document.getElementById('sidebarLoginBtn');

// Sample data structure for products
let products = [];
let currentUser = null;
let registeredUsers = [];
let feedbacks = [];
let selectedPlan = null;
let editingProductId = null;

// Admin credentials
const adminCredentials = {
    email: 'mohammedmazeri6@gmail.com',
    password: '2005060hh'
};

// Load saved data from localStorage
function loadSavedData() {
    // Load products
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
        products = JSON.parse(savedProducts);
    }
    
    // Load registered users
    const savedUsers = localStorage.getItem('registeredUsers');
    if (savedUsers) {
        registeredUsers = JSON.parse(savedUsers);
    }
    
    // Load feedbacks
    const savedFeedbacks = localStorage.getItem('feedbacks');
    if (savedFeedbacks) {
        feedbacks = JSON.parse(savedFeedbacks);
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
    localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
}

// Load data when page loads
loadSavedData();

// Event Listeners
addProductBtn.addEventListener('click', () => {
    if (!currentUser) {
        alert('يرجى تسجيل الدخول أولاً');
        loginModal.style.display = 'block';
        return;
    }
    
    if (currentUser.role === 'admin') {
        // Admin can add products directly
        editingProductId = null; // Reset editing mode
        addProductForm.reset(); // Reset form
        document.querySelector('#addProductModal h2').textContent = 'إضافة منتج جديد';
        addProductModal.style.display = 'block';
    } else {
        // Customer needs to select a subscription plan
        updateSubscriptionPlansDisplay(); // Update plans with current product count
        subscriptionPlansModal.style.display = 'block';
    }
});

// Feedback button event listener
feedbackBtn.addEventListener('click', () => {
    if (!currentUser) {
        alert('يرجى تسجيل الدخول أولاً');
        loginModal.style.display = 'block';
        return;
    }
    
    feedbackModal.style.display = 'block';
});

loginBtn.addEventListener('click', () => {
    if (currentUser && currentUser.role === 'admin') {
        // Show admin dashboard
        adminDashboardModal.style.display = 'block';
    } else {
        loginModal.style.display = 'block';
    }
});

// Close modals when clicking the close button
Array.from(closeButtons).forEach(button => {
    button.addEventListener('click', () => {
        addProductModal.style.display = 'none';
        loginModal.style.display = 'none';
        subscriptionPlansModal.style.display = 'none';
        paymentInstructionsModal.style.display = 'none';
        adminDashboardModal.style.display = 'none';
        feedbackModal.style.display = 'none';
    });
});

// Close modals when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === addProductModal) {
        addProductModal.style.display = 'none';
    }
    if (event.target === loginModal) {
        loginModal.style.display = 'none';
    }
    if (event.target === subscriptionPlansModal) {
        subscriptionPlansModal.style.display = 'none';
    }
    if (event.target === paymentInstructionsModal) {
        paymentInstructionsModal.style.display = 'none';
    }
    if (event.target === adminDashboardModal) {
        adminDashboardModal.style.display = 'none';
    }
    if (event.target === feedbackModal) {
        feedbackModal.style.display = 'none';
    }
});

// Handle tab switching in admin dashboard
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all tabs
        tabButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        
        // Add active class to clicked tab
        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        document.getElementById(`${tabId}-tab`).classList.add('active');
        
        // Load content for the selected tab
        if (tabId === 'users') {
            displayUsers();
        } else if (tabId === 'products') {
            displayAdminProducts();
        } else if (tabId === 'feedback') {
            displayFeedbacks();
        }
    });
});

// Handle feedback form submission
feedbackForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const subject = document.getElementById('feedbackSubject').value;
    const message = document.getElementById('feedbackMessage').value;
    
    // Create new feedback object
    const newFeedback = {
        id: Date.now(),
        subject: subject,
        message: message,
        user: currentUser.email,
        date: new Date().toISOString(),
        status: 'pending'
    };
    
    feedbacks.push(newFeedback);
    saveData();
    
    feedbackModal.style.display = 'none';
    feedbackForm.reset();
    
    alert('تم إرسال تعليقك بنجاح. سنقوم بالرد عليك قريباً.');
});

// Handle subscription plan selection
document.querySelectorAll('.select-plan').forEach(button => {
    button.addEventListener('click', (e) => {
        const planElement = e.target.closest('.plan');
        const planType = planElement.dataset.plan;
        
        // Check if user has already used the free plan
        if (planType === 'free') {
            const userIndex = registeredUsers.findIndex(user => user.email === currentUser.email);
            if (userIndex !== -1 && registeredUsers[userIndex].hasUsedFreePlan) {
                alert('لا يمكنك اختيار العرض المجاني مرة أخرى. يرجى اختيار عرض آخر.');
                return;
            }
        }
        
        selectedPlan = {
            name: planElement.querySelector('h3').textContent,
            limit: parseInt(planElement.dataset.limit),
            price: parseInt(planElement.dataset.price),
            plan: planType
        };
        
        // Update payment instructions modal with selected plan info
        document.getElementById('selectedPlanName').textContent = selectedPlan.name;
        document.getElementById('selectedPlanLimit').textContent = selectedPlan.limit === 999999 ? 'غير محدود' : selectedPlan.limit;
        document.getElementById('selectedPlanPrice').textContent = selectedPlan.price;
        
        // Show payment instructions modal
        subscriptionPlansModal.style.display = 'none';
        paymentInstructionsModal.style.display = 'block';
    });
});

// Function to update subscription plans display with current product count
function updateSubscriptionPlansDisplay() {
    if (!currentUser) return;
    
    const userProducts = products.filter(p => p.seller === currentUser.email);
    const currentProductCount = userProducts.length;
    const currentPlan = currentUser.subscriptionPlan || { limit: 2, name: 'العرض المجاني' };
    
    // Update each plan display with current product count
    document.querySelectorAll('.plan').forEach(planElement => {
        const planType = planElement.dataset.plan;
        const planLimit = parseInt(planElement.dataset.limit);
        
        // Add current product count info to each plan
        const planInfo = planElement.querySelector('p');
        if (planInfo) {
            // Check if this is the current plan
            if (planType === currentPlan.plan) {
                planInfo.innerHTML = `عرض من ${currentProductCount} إلى ${planLimit} منتج (خطتك الحالية)`;
            } else {
                planInfo.innerHTML = `عرض من ${currentProductCount} إلى ${planLimit} منتج`;
            }
        }
    });
}

// Handle payment confirmation
confirmPaymentBtn.addEventListener('click', () => {
    if (selectedPlan) {
        // Update user's subscription plan
        const userIndex = registeredUsers.findIndex(user => user.email === currentUser.email);
        if (userIndex !== -1) {
            registeredUsers[userIndex].subscriptionPlan = selectedPlan;
            
            // Mark free plan as used if it's the free plan
            if (selectedPlan.plan === 'free') {
                registeredUsers[userIndex].hasUsedFreePlan = true;
            }
            
            saveData();
        }
        
        // Update current user's subscription plan
        currentUser.subscriptionPlan = selectedPlan;
        
        // Close payment modal and show add product modal
        paymentInstructionsModal.style.display = 'none';
        
        // Calculate remaining product slots
        const userProducts = products.filter(p => p.seller === currentUser.email);
        const remainingSlots = selectedPlan.limit - userProducts.length;
        
        if (remainingSlots > 0) {
            alert(`تم تأكيد الدفع للخطة: ${selectedPlan.name}. يمكنك الآن إضافة ${remainingSlots} منتج${remainingSlots > 1 ? 'ات' : ''}.`);
            addProductModal.style.display = 'block';
        } else {
            alert(`تم تأكيد الدفع للخطة: ${selectedPlan.name}. لقد وصلت بالفعل إلى الحد الأقصى من المنتجات المسموح بها في هذه الخطة.`);
        }
    }
});

// Handle login form submission
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Check if credentials match admin credentials
    if (email === adminCredentials.email && password === adminCredentials.password) {
        currentUser = { role: 'admin', email };
        alert('تم تسجيل الدخول كمشرف بنجاح');
    } else {
        // Check if user is already registered
        const existingUser = registeredUsers.find(user => user.email === email);
        
        if (existingUser) {
            // User exists, check password
            if (existingUser.password === password) {
                currentUser = { 
                    role: existingUser.role || 'customer', 
                    email,
                    subscriptionPlan: existingUser.subscriptionPlan || null,
                    hasUsedFreePlan: existingUser.hasUsedFreePlan || false
                };
                alert('تم تسجيل الدخول بنجاح');
            } else {
                alert('كلمة المرور غير صحيحة');
                return;
            }
        } else {
            // Check if email is valid
            if (!isValidEmail(email)) {
                alert('البريد الإلكتروني غير صالح. يرجى إدخال بريد إلكتروني صحيح.');
                return;
            }
            
            // New user registration
            const newUser = { 
                email, 
                password,
                role: 'customer',
                hasUsedFreePlan: false
            };
            registeredUsers.push(newUser);
            saveData();
            currentUser = { 
                role: 'customer', 
                email,
                hasUsedFreePlan: false
            };
            alert('تم تسجيل حساب جديد بنجاح');
        }
    }

    loginModal.style.display = 'none';
    updateUI();
});

// Function to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Handle add product form submission
addProductForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const productName = document.getElementById('productName').value;
    const productPrice = document.getElementById('productPrice').value;
    const productCategory = document.getElementById('productCategory').value;
    const productDescription = document.getElementById('productDescription').value;
    const productPhone = document.getElementById('productPhone').value;
    const productImage = document.getElementById('productImage').files[0];

    // Check if customer has reached their product limit
    if (currentUser.role === 'customer') {
        const userProducts = products.filter(p => p.seller === currentUser.email);
        const userSubscriptionPlan = currentUser.subscriptionPlan || { limit: 2 }; // Default to free plan
        
        if (userProducts.length >= userSubscriptionPlan.limit) {
            alert(`لقد وصلت إلى الحد الأقصى من المنتجات المسموح بها في خطتك الحالية (${userSubscriptionPlan.limit} منتج). يرجى ترقية خطتك لإضافة المزيد من المنتجات.`);
            subscriptionPlansModal.style.display = 'block';
            return;
        }
    }

    if (editingProductId) {
        // Update existing product
        const productIndex = products.findIndex(p => p.id === editingProductId);
        if (productIndex !== -1) {
            products[productIndex].name = productName;
            products[productIndex].price = productPrice;
            products[productIndex].category = productCategory;
            products[productIndex].description = productDescription;
            products[productIndex].phone = productPhone;
            
            if (productImage) {
                products[productIndex].image = URL.createObjectURL(productImage);
            }
            
            saveData();
            alert('تم تحديث المنتج بنجاح');
        }
    } else {
        // Create new product object
        const newProduct = {
            id: Date.now(),
            name: productName,
            price: productPrice,
            category: productCategory,
            description: productDescription,
            phone: productPhone,
            image: URL.createObjectURL(productImage),
            status: currentUser.role === 'admin' ? 'approved' : 'pending',
            seller: currentUser.email
        };

        products.push(newProduct);
        saveData(); // Save products to localStorage
        
        // Check if user has reached their limit after adding a product
        if (currentUser.role === 'customer') {
            const userProducts = products.filter(p => p.seller === currentUser.email);
            const userSubscriptionPlan = currentUser.subscriptionPlan || { limit: 2 };
            
            if (userProducts.length >= userSubscriptionPlan.limit) {
                alert(`تم إضافة المنتج بنجاح! لقد وصلت إلى الحد الأقصى من المنتجات المسموح بها في خطتك الحالية (${userSubscriptionPlan.limit} منتج). إذا كنت ترغب في إضافة المزيد من المنتجات، يرجى ترقية خطتك.`);
            } else {
                const remainingProducts = userSubscriptionPlan.limit - userProducts.length;
                alert(`تم إضافة المنتج بنجاح! يمكنك إضافة ${remainingProducts} منتج${remainingProducts > 1 ? 'ات' : ''} أخرى في خطتك الحالية.`);
            }
        } else {
            alert('تم إضافة المنتج بنجاح');
        }
    }
    
    addProductModal.style.display = 'none';
    addProductForm.reset();
    editingProductId = null;
    displayProducts();
});

// Function to edit a product
function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        editingProductId = productId;
        
        // Fill the form with product data
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productCategory').value = product.category || '';
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productPhone').value = product.phone;
        
        // Update modal title
        document.querySelector('#addProductModal h2').textContent = 'تعديل المنتج';
        
        // Show the modal
        addProductModal.style.display = 'block';
    }
}

// Function to delete a product
function deleteProduct(productId) {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        const productIndex = products.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
            products.splice(productIndex, 1);
            saveData();
            displayProducts();
            alert('تم حذف المنتج بنجاح');
        }
    }
}

// Add event listener for main product search
mainProductSearch.addEventListener('input', () => {
    displayProducts();
});

// Function to display products
function displayProducts() {
    productsContainer.innerHTML = '';
    
    // Get search query from main product search
    const searchQuery = mainProductSearch.value.toLowerCase();
    
    // Filter products based on search query
    const filteredProducts = products.filter(product => 
        (product.status === 'approved' || currentUser?.role === 'admin') &&
        (product.name.toLowerCase().includes(searchQuery) || 
         product.description.toLowerCase().includes(searchQuery) ||
         (product.category && product.category.toLowerCase().includes(searchQuery)))
    );
    
    filteredProducts.forEach(product => {
        if (product.status === 'approved' || currentUser?.role === 'admin') {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            
            // Get category display name
            let categoryDisplay = '';
            if (product.category) {
                switch(product.category) {
                    case 'electronics': categoryDisplay = 'إلكترونيات'; break;
                    case 'clothing': categoryDisplay = 'ملابس'; break;
                    case 'home': categoryDisplay = 'منتجات منزلية'; break;
                    case 'beauty': categoryDisplay = 'مستحضرات تجميل'; break;
                    case 'sports': categoryDisplay = 'رياضة'; break;
                    case 'books': categoryDisplay = 'كتب'; break;
                    case 'toys': categoryDisplay = 'ألعاب'; break;
                    case 'food': categoryDisplay = 'طعام'; break;
                    case 'other': categoryDisplay = 'أخرى'; break;
                    default: categoryDisplay = product.category;
                }
            }
            
            productCard.innerHTML = `
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">${product.price} دج</p>
                    ${product.category ? `<p class="product-category">الفئة: ${categoryDisplay}</p>` : ''}
                    <p>${product.description}</p>
                    <p class="product-phone">رقم الهاتف: ${product.phone}</p>
                    ${currentUser?.role === 'admin' ? `
                        <p>الحالة: ${product.status === 'approved' ? 'معتمد' : 'قيد الانتظار'}</p>
                        <p>البائع: ${product.seller}</p>
                        <div class="admin-actions">
                            ${product.status === 'pending' ? `
                                <button onclick="approveProduct(${product.id})">اعتماد المنتج</button>
                            ` : ''}
                            <button onclick="editProduct(${product.id})">تعديل</button>
                            <button onclick="deleteProduct(${product.id})">حذف</button>
                        </div>
                    ` : ''}
                </div>
            `;
            
            productsContainer.appendChild(productCard);
        }
    });
    
    // Show message if no products found
    if (filteredProducts.length === 0) {
        const noProductsMessage = document.createElement('div');
        noProductsMessage.className = 'no-products-message';
        noProductsMessage.innerHTML = `
            <p>لم يتم العثور على منتجات تطابق بحثك.</p>
            <p>جرب استخدام كلمات بحث مختلفة.</p>
        `;
        productsContainer.appendChild(noProductsMessage);
    }
}

// Function to approve products (admin only)
function approveProduct(productId) {
    if (currentUser?.role === 'admin') {
        const product = products.find(p => p.id === productId);
        if (product) {
            product.status = 'approved';
            saveData(); // Save changes to localStorage
            displayProducts();
            alert('تم اعتماد المنتج بنجاح');
        }
    }
}

// Function to display users in admin dashboard
function displayUsers() {
    usersList.innerHTML = '';
    
    // Filter users based on search query
    const searchQuery = userSearch.value.toLowerCase();
    const filteredUsers = registeredUsers.filter(user => 
        user.email.toLowerCase().includes(searchQuery)
    );
    
    filteredUsers.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        
        // Get user's products
        const userProducts = products.filter(p => p.seller === user.email);
        
        userCard.innerHTML = `
            <h3>${user.email}</h3>
            <div class="user-info">
                <p>الدور: ${user.role === 'admin' ? 'مشرف' : 'زبون'}</p>
                <p>الحالة: ${user.status === 'suspended' ? 'موقوف' : 'نشط'}</p>
                <p>عدد المنتجات: ${userProducts.length}</p>
                ${user.subscriptionPlan ? `
                    <p>خطة الاشتراك: ${user.subscriptionPlan.name}</p>
                    <p>حد المنتجات: ${user.subscriptionPlan.limit}</p>
                ` : '<p>لا يوجد خطة اشتراك</p>'}
            </div>
            <div class="user-actions">
                ${user.role !== 'admin' ? `
                    <button onclick="makeAdmin('${user.email}')">تعيين كمشرف</button>
                ` : ''}
                ${user.status !== 'suspended' ? `
                    <button onclick="suspendUser('${user.email}')">إيقاف المستخدم</button>
                ` : `
                    <button onclick="activateUser('${user.email}')">تفعيل المستخدم</button>
                `}
                <button onclick="deleteUser('${user.email}')">حذف المستخدم</button>
                <button onclick="viewUserProducts('${user.email}')">عرض المنتجات</button>
            </div>
            <div class="user-products" id="user-products-${user.email.replace('@', '-').replace('.', '-')}" style="display: none;">
                <h4>منتجات المستخدم</h4>
                <div class="user-products-list">
                    ${userProducts.length > 0 ? userProducts.map(product => `
                        <div class="user-product-item">
                            <p><strong>${product.name}</strong> - ${product.price} دج</p>
                            <p>الحالة: ${product.status === 'approved' ? 'معتمد' : 'قيد الانتظار'}</p>
                            <div class="product-actions">
                                ${product.status === 'pending' ? `
                                    <button onclick="approveProduct(${product.id})">اعتماد</button>
                                ` : ''}
                                <button onclick="editProduct(${product.id})">تعديل</button>
                                <button onclick="deleteProduct(${product.id})">حذف</button>
                            </div>
                        </div>
                    `).join('') : '<p>لا توجد منتجات</p>'}
                </div>
            </div>
        `;
        
        usersList.appendChild(userCard);
    });
}

// Function to display all products in admin dashboard
function displayAdminProducts() {
    adminProductsList.innerHTML = '';
    
    // Filter products based on search query
    const searchQuery = productSearch.value.toLowerCase();
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchQuery) || 
        product.description.toLowerCase().includes(searchQuery) ||
        product.seller.toLowerCase().includes(searchQuery) ||
        (product.category && product.category.toLowerCase().includes(searchQuery))
    );
    
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'admin-product-card';
        
        // Get category display name
        let categoryDisplay = '';
        if (product.category) {
            switch(product.category) {
                case 'electronics': categoryDisplay = 'إلكترونيات'; break;
                case 'clothing': categoryDisplay = 'ملابس'; break;
                case 'home': categoryDisplay = 'منتجات منزلية'; break;
                case 'beauty': categoryDisplay = 'مستحضرات تجميل'; break;
                case 'sports': categoryDisplay = 'رياضة'; break;
                case 'books': categoryDisplay = 'كتب'; break;
                case 'toys': categoryDisplay = 'ألعاب'; break;
                case 'food': categoryDisplay = 'طعام'; break;
                case 'other': categoryDisplay = 'أخرى'; break;
                default: categoryDisplay = product.category;
            }
        }
        
        productCard.innerHTML = `
            <h3>${product.name}</h3>
            <div class="product-info">
                <p>السعر: ${product.price} دج</p>
                ${product.category ? `<p>الفئة: ${categoryDisplay}</p>` : ''}
                <p>الوصف: ${product.description}</p>
                <p>رقم الهاتف: ${product.phone}</p>
                <p>البائع: ${product.seller}</p>
                <p>الحالة: ${product.status === 'approved' ? 'معتمد' : 'قيد الانتظار'}</p>
            </div>
            <div class="product-actions">
                ${product.status === 'pending' ? `
                    <button onclick="approveProduct(${product.id})">اعتماد</button>
                ` : ''}
                <button onclick="editProduct(${product.id})">تعديل</button>
                <button onclick="deleteProduct(${product.id})">حذف</button>
            </div>
        `;
        
        adminProductsList.appendChild(productCard);
    });
}

// Function to display feedbacks in admin dashboard
function displayFeedbacks() {
    feedbackList.innerHTML = '';
    
    // Filter feedbacks based on search query
    const searchQuery = feedbackSearch.value.toLowerCase();
    const filteredFeedbacks = feedbacks.filter(feedback => 
        feedback.subject.toLowerCase().includes(searchQuery) || 
        feedback.message.toLowerCase().includes(searchQuery) ||
        feedback.user.toLowerCase().includes(searchQuery)
    );
    
    // Sort feedbacks by date (newest first)
    filteredFeedbacks.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    filteredFeedbacks.forEach(feedback => {
        const feedbackCard = document.createElement('div');
        feedbackCard.className = 'feedback-card';
        
        // Format date
        const feedbackDate = new Date(feedback.date);
        const formattedDate = `${feedbackDate.getFullYear()}-${(feedbackDate.getMonth() + 1).toString().padStart(2, '0')}-${feedbackDate.getDate().toString().padStart(2, '0')} ${feedbackDate.getHours().toString().padStart(2, '0')}:${feedbackDate.getMinutes().toString().padStart(2, '0')}`;
        
        feedbackCard.innerHTML = `
            <h3>${feedback.subject} <span class="feedback-status ${feedback.status}">${getStatusText(feedback.status)}</span></h3>
            <div class="feedback-info">
                <p>من: ${feedback.user}</p>
                <p>التاريخ: ${formattedDate}</p>
            </div>
            <div class="feedback-message">
                ${feedback.message}
            </div>
            <div class="feedback-actions">
                ${feedback.status === 'pending' ? `
                    <button onclick="resolveFeedback(${feedback.id})">حل المشكلة</button>
                    <button onclick="rejectFeedback(${feedback.id})">رفض التعليق</button>
                ` : ''}
                <button onclick="deleteFeedback(${feedback.id})">حذف التعليق</button>
            </div>
        `;
        
        feedbackList.appendChild(feedbackCard);
    });
}

// Function to get status text in Arabic
function getStatusText(status) {
    switch(status) {
        case 'pending':
            return 'قيد الانتظار';
        case 'resolved':
            return 'تم الحل';
        case 'rejected':
            return 'مرفوض';
        default:
            return status;
    }
}

// Function to resolve feedback
function resolveFeedback(feedbackId) {
    if (confirm('هل أنت متأكد من حل هذه المشكلة؟')) {
        const feedbackIndex = feedbacks.findIndex(f => f.id === feedbackId);
        if (feedbackIndex !== -1) {
            feedbacks[feedbackIndex].status = 'resolved';
            saveData();
            displayFeedbacks();
            alert('تم تحديث حالة التعليق بنجاح');
        }
    }
}

// Function to reject feedback
function rejectFeedback(feedbackId) {
    if (confirm('هل أنت متأكد من رفض هذا التعليق؟')) {
        const feedbackIndex = feedbacks.findIndex(f => f.id === feedbackId);
        if (feedbackIndex !== -1) {
            feedbacks[feedbackIndex].status = 'rejected';
            saveData();
            displayFeedbacks();
            alert('تم تحديث حالة التعليق بنجاح');
        }
    }
}

// Function to delete feedback
function deleteFeedback(feedbackId) {
    if (confirm('هل أنت متأكد من حذف هذا التعليق؟')) {
        const feedbackIndex = feedbacks.findIndex(f => f.id === feedbackId);
        if (feedbackIndex !== -1) {
            feedbacks.splice(feedbackIndex, 1);
            saveData();
            displayFeedbacks();
            alert('تم حذف التعليق بنجاح');
        }
    }
}

// Function to make a user an admin
function makeAdmin(email) {
    if (confirm(`هل أنت متأكد من تعيين ${email} كمشرف؟`)) {
        const userIndex = registeredUsers.findIndex(user => user.email === email);
        if (userIndex !== -1) {
            registeredUsers[userIndex].role = 'admin';
            saveData();
            displayUsers();
            alert(`تم تعيين ${email} كمشرف بنجاح`);
        }
    }
}

// Function to suspend a user
function suspendUser(email) {
    if (confirm(`هل أنت متأكد من إيقاف المستخدم ${email}؟`)) {
        const userIndex = registeredUsers.findIndex(user => user.email === email);
        if (userIndex !== -1) {
            registeredUsers[userIndex].status = 'suspended';
            saveData();
            displayUsers();
            alert(`تم إيقاف المستخدم ${email} بنجاح`);
        }
    }
}

// Function to activate a suspended user
function activateUser(email) {
    if (confirm(`هل أنت متأكد من تفعيل المستخدم ${email}؟`)) {
        const userIndex = registeredUsers.findIndex(user => user.email === email);
        if (userIndex !== -1) {
            registeredUsers[userIndex].status = 'active';
            saveData();
            displayUsers();
            alert(`تم تفعيل المستخدم ${email} بنجاح`);
        }
    }
}

// Function to delete a user
function deleteUser(email) {
    if (confirm(`هل أنت متأكد من حذف المستخدم ${email}؟ سيتم حذف جميع منتجاته أيضاً.`)) {
        // Remove user from registered users
        const userIndex = registeredUsers.findIndex(user => user.email === email);
        if (userIndex !== -1) {
            registeredUsers.splice(userIndex, 1);
        }
        
        // Remove all products by this user
        products = products.filter(product => product.seller !== email);
        
        saveData();
        displayUsers();
        alert(`تم حذف المستخدم ${email} وجميع منتجاته بنجاح`);
    }
}

// Function to view user products
function viewUserProducts(email) {
    const productsContainer = document.getElementById(`user-products-${email.replace('@', '-').replace('.', '-')}`);
    if (productsContainer.style.display === 'none') {
        productsContainer.style.display = 'block';
    } else {
        productsContainer.style.display = 'none';
    }
}

// Add event listeners for search functionality
userSearch.addEventListener('input', displayUsers);
productSearch.addEventListener('input', displayAdminProducts);
feedbackSearch.addEventListener('input', displayFeedbacks);

// Function to update UI based on user role
function updateUI() {
    if (currentUser) {
        if (currentUser.role === 'admin') {
            loginBtn.textContent = 'لوحة التحكم';
            loginBtn.onclick = () => {
                adminDashboardModal.style.display = 'block';
                displayUsers(); // Load users when dashboard opens
            };
        } else {
            loginBtn.textContent = 'تسجيل الخروج';
            loginBtn.onclick = () => {
                currentUser = null;
                updateUI();
            };
            
            // Display subscription status for customers
            displaySubscriptionStatus();
        }
    } else {
        loginBtn.textContent = 'تسجيل الدخول';
        loginBtn.onclick = () => {
            loginModal.style.display = 'block';
        };
    }
    displayProducts();
}

// Function to display subscription status for customers
function displaySubscriptionStatus() {
    if (!currentUser || currentUser.role === 'admin') return;
    
    // Get user's products count
    const userProducts = products.filter(p => p.seller === currentUser.email);
    const productCount = userProducts.length;
    
    // Get subscription plan
    const subscriptionPlan = currentUser.subscriptionPlan || { limit: 2, name: 'العرض المجاني' };
    const remainingSlots = subscriptionPlan.limit - productCount;
    
    // Create or update subscription status element
    let statusElement = document.getElementById('subscriptionStatus');
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = 'subscriptionStatus';
        statusElement.className = 'subscription-status';
        
        // Insert after the hero section
        const heroSection = document.querySelector('.hero');
        heroSection.parentNode.insertBefore(statusElement, heroSection.nextSibling);
    }
    
    // Update status content
    statusElement.innerHTML = `
        <div class="subscription-info">
            <h3>حالة اشتراكك</h3>
            <p>الخطة الحالية: <strong>${subscriptionPlan.name}</strong></p>
            <p>المنتجات المضافة: <strong>${productCount}</strong> من <strong>${subscriptionPlan.limit}</strong></p>
            <p>المنتجات المتبقية: <strong>${remainingSlots}</strong></p>
            ${remainingSlots <= 0 ? `
                <button id="upgradePlanBtn" class="upgrade-plan-btn">ترقية الخطة</button>
            ` : ''}
        </div>
    `;
    
    // Add event listener to upgrade button if it exists
    const upgradeBtn = document.getElementById('upgradePlanBtn');
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', () => {
            updateSubscriptionPlansDisplay();
            subscriptionPlansModal.style.display = 'block';
        });
    }
}

// Toggle sidebar
menuToggle.addEventListener('click', () => {
    sidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.classList.add('sidebar-open');
    document.body.style.overflow = 'hidden';
});

// Close sidebar
function closeSidebarMenu() {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.classList.remove('sidebar-open');
    document.body.style.overflow = '';
}

closeSidebar.addEventListener('click', closeSidebarMenu);
overlay.addEventListener('click', closeSidebarMenu);

// Handle sidebar links
sidebarLinks.forEach(link => {
    link.addEventListener('click', () => {
        // Remove active class from all links
        sidebarLinks.forEach(l => l.classList.remove('active'));
        // Add active class to clicked link
        link.classList.add('active');
        // Close sidebar after clicking a link
        closeSidebarMenu();
    });
});

// Connect sidebar buttons to main buttons
sidebarAddProductBtn.addEventListener('click', () => {
    document.getElementById('addProductBtn').click();
});

sidebarFeedbackBtn.addEventListener('click', () => {
    document.getElementById('feedbackBtn').click();
});

sidebarLoginBtn.addEventListener('click', () => {
    document.getElementById('loginBtn').click();
});

// Update active link based on current page
function updateActiveLink() {
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    
    sidebarLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPath || (linkHref === '#' && currentPath === '/') || 
            (linkHref === currentHash && currentHash !== '')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Call updateActiveLink on page load and when hash changes
updateActiveLink();
window.addEventListener('hashchange', updateActiveLink);

// Initial UI update
updateUI();

// تحديث وظيفة حفظ المنتجات
function saveProducts() {
    const productsRef = dbRef(db, 'products');
    dbSet(productsRef, products);
}

// تحديث وظيفة تحميل المنتجات
function loadProducts() {
    const productsRef = dbRef(db, 'products');
    dbOnValue(productsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            products = data;
            displayProducts();
            displayAdminProducts();
        }
    });
}

// تحديث وظيفة حفظ المستخدمين
function saveUsers() {
    const usersRef = dbRef(db, 'users');
    dbSet(usersRef, users);
}

// تحديث وظيفة تحميل المستخدمين
function loadUsers() {
    const usersRef = dbRef(db, 'users');
    dbOnValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            users = data;
            displayUsers();
        }
    });
}

// تحديث وظيفة حفظ التعليقات
function saveFeedback() {
    const feedbackRef = dbRef(db, 'feedback');
    dbSet(feedbackRef, feedback);
}

// تحديث وظيفة تحميل التعليقات
function loadFeedback() {
    const feedbackRef = dbRef(db, 'feedback');
    dbOnValue(feedbackRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            feedback = data;
            displayFeedback();
        }
    });
}

// تحديث وظيفة إضافة منتج جديد
document.getElementById('addProductForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const productName = document.getElementById('productName').value;
    const productPrice = document.getElementById('productPrice').value;
    const productCategory = document.getElementById('productCategory').value;
    const productDescription = document.getElementById('productDescription').value;
    const productPhone = document.getElementById('productPhone').value;
    const productImage = document.getElementById('productImage').files[0];

    // إنشاء معرف فريد للمنتج
    const newProductRef = dbPush(dbRef(db, 'products'));
    const productId = newProductRef.key;

    // إنشاء كائن المنتج
    const newProduct = {
        id: productId,
        name: productName,
        price: productPrice,
        category: productCategory,
        description: productDescription,
        phone: productPhone,
        image: productImage ? URL.createObjectURL(productImage) : 'default-product.jpg',
        date: new Date().toISOString()
    };

    // حفظ المنتج في Firebase
    dbSet(newProductRef, newProduct);

    // إغلاق النافذة المنبثقة وإعادة تعيين النموذج
    document.getElementById('addProductModal').style.display = 'none';
    this.reset();
});

// تحديث وظيفة إرسال التعليق
document.getElementById('feedbackForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const subject = document.getElementById('feedbackSubject').value;
    const message = document.getElementById('feedbackMessage').value;

    // إنشاء معرف فريد للتعليق
    const newFeedbackRef = dbPush(dbRef(db, 'feedback'));
    const feedbackId = newFeedbackRef.key;

    // إنشاء كائن التعليق
    const newFeedback = {
        id: feedbackId,
        subject: subject,
        message: message,
        date: new Date().toISOString(),
        status: 'pending'
    };

    // حفظ التعليق في Firebase
    dbSet(newFeedbackRef, newFeedback);

    // إغلاق النافذة المنبثقة وإعادة تعيين النموذج
    document.getElementById('feedbackModal').style.display = 'none';
    this.reset();
});

// تحديث وظيفة تسجيل الدخول
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // إنشاء معرف فريد للمستخدم
    const newUserRef = dbPush(dbRef(db, 'users'));
    const userId = newUserRef.key;

    // إنشاء كائن المستخدم
    const newUser = {
        id: userId,
        email: email,
        password: password, // في التطبيق الحقيقي، يجب تشفير كلمة المرور
        date: new Date().toISOString(),
        role: 'user'
    };

    // حفظ المستخدم في Firebase
    dbSet(newUserRef, newUser);

    // إغلاق النافذة المنبثقة وإعادة تعيين النموذج
    document.getElementById('loginModal').style.display = 'none';
    this.reset();
}); 
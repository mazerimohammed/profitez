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
const tabButtons = document.querySelectorAll('.tab-button');

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
        
        // Close payment modal and show add product modal
        paymentInstructionsModal.style.display = 'none';
        addProductModal.style.display = 'block';
        
        alert(`تم تأكيد الدفع للخطة: ${selectedPlan.name}. يمكنك الآن إضافة منتجاتك.`);
    }
});

// Function to verify email using Abstract API
async function verifyEmail(email) {
    const apiKey = 'YOUR_API_KEY'; // Replace with your Abstract API key
    const url = `https://emailverification.abstractapi.com/v1/?api_key=${apiKey}&email=${email}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // Check if email is deliverable and not disposable
        return {
            isValid: data.deliverability === 'DELIVERABLE' && !data.is_disposable_email,
            message: getEmailValidationMessage(data)
        };
    } catch (error) {
        console.error('Error verifying email:', error);
        return {
            isValid: false,
            message: 'حدث خطأ أثناء التحقق من البريد الإلكتروني. يرجى المحاولة مرة أخرى.'
        };
    }
}

// Function to get validation message in Arabic
function getEmailValidationMessage(data) {
    if (data.deliverability !== 'DELIVERABLE') {
        return 'هذا البريد الإلكتروني غير صالح أو غير موجود.';
    }
    if (data.is_disposable_email) {
        return 'لا يمكن استخدام بريد إلكتروني مؤقت. يرجى استخدام بريد إلكتروني حقيقي.';
    }
    return 'البريد الإلكتروني صالح.';
}

// Update login form submission to include email verification
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Check if credentials match admin credentials
    if (email === adminCredentials.email && password === adminCredentials.password) {
        currentUser = { role: 'admin', email };
        alert('تم تسجيل الدخول كمشرف بنجاح');
        loginModal.style.display = 'none';
        updateUI();
        return;
    }

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
            loginModal.style.display = 'none';
            updateUI();
        } else {
            alert('كلمة المرور غير صحيحة');
        }
    } else {
        // New user registration - verify email first
        if (!isValidEmail(email)) {
            alert('صيغة البريد الإلكتروني غير صحيحة. يرجى إدخال بريد إلكتروني صحيح.');
            return;
        }

        // Show loading message
        alert('جاري التحقق من البريد الإلكتروني...');
        
        // Verify email
        const verification = await verifyEmail(email);
        if (!verification.isValid) {
            alert(verification.message);
            return;
        }

        // Email is valid, proceed with registration
        const newUser = { 
            email, 
            password,
            role: 'customer',
            hasUsedFreePlan: false,
            status: 'active'
        };
        registeredUsers.push(newUser);
        saveData();
        currentUser = { 
            role: 'customer', 
            email,
            hasUsedFreePlan: false
        };
        alert('تم التحقق من البريد الإلكتروني وتسجيل الحساب بنجاح');
        loginModal.style.display = 'none';
        updateUI();
    }
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
            description: productDescription,
            phone: productPhone,
            image: URL.createObjectURL(productImage),
            status: currentUser.role === 'admin' ? 'approved' : 'pending',
            seller: currentUser.email
        };

        products.push(newProduct);
        saveData(); // Save products to localStorage
        alert('تم إضافة المنتج بنجاح');
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

// Function to display products
function displayProducts() {
    productsContainer.innerHTML = '';
    
    products.forEach(product => {
        if (product.status === 'approved' || currentUser?.role === 'admin') {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            
            productCard.innerHTML = `
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">${product.price} دج</p>
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
        product.seller.toLowerCase().includes(searchQuery)
    );
    
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'admin-product-card';
        
        productCard.innerHTML = `
            <h3>${product.name}</h3>
            <div class="product-info">
                <p>السعر: ${product.price} دج</p>
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
        }
    } else {
        loginBtn.textContent = 'تسجيل الدخول';
        loginBtn.onclick = () => {
            loginModal.style.display = 'block';
        };
    }
    displayProducts();
}

// Initial UI update
updateUI(); 
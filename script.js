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

// Load saved data from Firebase
async function loadSavedData() {
    try {
        // Load products from Firestore
        const productsSnapshot = await firebaseDb.collection('products').get();
        products = [];
        productsSnapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        
        // Load registered users from Firestore
        const usersSnapshot = await firebaseDb.collection('users').get();
        registeredUsers = [];
        usersSnapshot.forEach(doc => {
            registeredUsers.push({ id: doc.id, ...doc.data() });
        });
        
        // Load feedbacks from Firestore
        const feedbacksSnapshot = await firebaseDb.collection('feedbacks').get();
        feedbacks = [];
        feedbacksSnapshot.forEach(doc => {
            feedbacks.push({ id: doc.id, ...doc.data() });
        });
        
        console.log("Data loaded from Firebase successfully");
    } catch (error) {
        console.error("Error loading data from Firebase:", error);
        // Fallback to localStorage if Firebase fails
        loadFromLocalStorage();
    }
}

// Fallback to localStorage
function loadFromLocalStorage() {
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

// Save data to Firebase
async function saveData() {
    try {
        // Save products to Firestore
        for (const product of products) {
            const { id, ...productData } = product;
            if (id) {
                await firebaseDb.collection('products').doc(id).set(productData);
            } else {
                const newProductRef = await firebaseDb.collection('products').add(productData);
                product.id = newProductRef.id;
            }
        }
        
        // Save users to Firestore
        for (const user of registeredUsers) {
            const { id, ...userData } = user;
            if (id) {
                await firebaseDb.collection('users').doc(id).set(userData);
            } else {
                const newUserRef = await firebaseDb.collection('users').add(userData);
                user.id = newUserRef.id;
            }
        }
        
        // Save feedbacks to Firestore
        for (const feedback of feedbacks) {
            const { id, ...feedbackData } = feedback;
            if (id) {
                await firebaseDb.collection('feedbacks').doc(id).set(feedbackData);
            } else {
                const newFeedbackRef = await firebaseDb.collection('feedbacks').add(feedbackData);
                feedback.id = newFeedbackRef.id;
            }
        }
        
        console.log("Data saved to Firebase successfully");
    } catch (error) {
        console.error("Error saving data to Firebase:", error);
        // Fallback to localStorage if Firebase fails
        saveToLocalStorage();
    }
}

// Fallback to localStorage
function saveToLocalStorage() {
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
    localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
}

// Load data when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Check if Firebase is initialized
    if (window.firebaseApp) {
        loadSavedData();
    } else {
        loadFromLocalStorage();
    }
});

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
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        // Check if it's admin login
        if (email === adminCredentials.email && password === adminCredentials.password) {
            currentUser = { email, isAdmin: true };
            loginModal.style.display = 'none';
            adminDashboardModal.style.display = 'block';
            displayUsers();
            displayAdminProducts();
            displayFeedbacks();
            return;
        }
        
        // Try to sign in with Firebase
        const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Get user data from Firestore
        const userDoc = await firebaseDb.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        
        currentUser = {
            id: user.uid,
            email: user.email,
            isAdmin: false,
            ...userData
        };
        
        loginModal.style.display = 'none';
        alert('تم تسجيل الدخول بنجاح');
    } catch (error) {
        console.error("Login error:", error);
        if (error.code === 'auth/user-not-found') {
            alert('البريد الإلكتروني غير مسجل');
        } else if (error.code === 'auth/wrong-password') {
            alert('كلمة المرور غير صحيحة');
        } else {
            alert('حدث خطأ أثناء تسجيل الدخول');
        }
    }
});

// Handle registration
async function registerUser(email, password) {
    try {
        // Check if email already exists
        const existingUser = registeredUsers.find(user => user.email === email);
        if (existingUser) {
            alert('البريد الإلكتروني مسجل بالفعل');
            return false;
        }
        
        // Create user in Firebase Auth
        const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Create user document in Firestore
        const newUser = {
            email: email,
            isAdmin: false,
            createdAt: new Date().toISOString()
        };
        
        await firebaseDb.collection('users').doc(user.uid).set(newUser);
        
        // Add to local array
        registeredUsers.push({
            id: user.uid,
            ...newUser
        });
        
        // Save to Firebase
        await saveData();
        
        alert('تم تسجيل حساب جديد بنجاح');
        return true;
    } catch (error) {
        console.error("Registration error:", error);
        if (error.code === 'auth/email-already-in-use') {
            alert('البريد الإلكتروني مسجل بالفعل');
        } else if (error.code === 'auth/invalid-email') {
            alert('البريد الإلكتروني غير صالح');
        } else if (error.code === 'auth/weak-password') {
            alert('كلمة المرور ضعيفة جداً');
        } else {
            alert('حدث خطأ أثناء التسجيل');
        }
        return false;
    }
}

// Handle logout
async function logout() {
    try {
        await firebaseAuth.signOut();
        currentUser = null;
        adminDashboardModal.style.display = 'none';
        alert('تم تسجيل الخروج بنجاح');
    } catch (error) {
        console.error("Logout error:", error);
        alert('حدث خطأ أثناء تسجيل الخروج');
    }
}

// Handle product form submission
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const productName = document.getElementById('productName').value;
    const productDescription = document.getElementById('productDescription').value;
    const productPrice = document.getElementById('productPrice').value;
    const productCategory = document.getElementById('productCategory').value;
    const productImage = document.getElementById('productImage').value;
    
    try {
        if (editingProductId) {
            // Update existing product
            const productRef = firebaseDb.collection('products').doc(editingProductId);
            await productRef.update({
                name: productName,
                description: productDescription,
                price: parseFloat(productPrice),
                category: productCategory,
                image: productImage,
                updatedAt: new Date().toISOString()
            });
            
            // Update local array
            const productIndex = products.findIndex(p => p.id === editingProductId);
            if (productIndex !== -1) {
                products[productIndex] = {
                    ...products[productIndex],
                    name: productName,
                    description: productDescription,
                    price: parseFloat(productPrice),
                    category: productCategory,
                    image: productImage
                };
            }
            
            alert('تم تحديث المنتج بنجاح');
        } else {
            // Create new product
            const newProduct = {
                name: productName,
                description: productDescription,
                price: parseFloat(productPrice),
                category: productCategory,
                image: productImage,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Add to Firestore
            const docRef = await firebaseDb.collection('products').add(newProduct);
            
            // Add to local array
            products.push({
                id: docRef.id,
                ...newProduct
            });
            
            alert('تم إضافة المنتج بنجاح');
        }
        
        // Reset form and close modal
        addProductForm.reset();
        addProductModal.style.display = 'none';
        editingProductId = null;
        
        // Update displays
        displayProducts();
        if (currentUser?.isAdmin) {
            displayAdminProducts();
        }
    } catch (error) {
        console.error("Product submission error:", error);
        alert('حدث خطأ أثناء حفظ المنتج');
    }
});

// Delete product
async function deleteProduct(productId) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        return;
    }
    
    try {
        // Delete from Firestore
        await firebaseDb.collection('products').doc(productId).delete();
        
        // Delete from local array
        products = products.filter(p => p.id !== productId);
        
        alert('تم حذف المنتج بنجاح');
        displayProducts();
        displayAdminProducts();
    } catch (error) {
        console.error("Product deletion error:", error);
        alert('حدث خطأ أثناء حذف المنتج');
    }
}

// Edit product
function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    editingProductId = productId;
    document.getElementById('productName').value = product.name;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productImage').value = product.image;
    
    addProductModal.style.display = 'block';
}

// Add event listener for main product search
mainProductSearch.addEventListener('input', () => {
    displayProducts();
});

// Display products in the main page
async function displayProducts() {
    try {
        // Get products from Firestore
        const productsSnapshot = await firebaseDb.collection('products').get();
        products = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        const productsContainer = document.getElementById('productsContainer');
        productsContainer.innerHTML = '';
        
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p class="price">${product.price} ريال</p>
                <p class="category">${getCategoryInArabic(product.category)}</p>
                ${currentUser ? `
                    <button onclick="addToCart('${product.id}')" class="add-to-cart-btn">
                        إضافة إلى السلة
                    </button>
                ` : ''}
            `;
            productsContainer.appendChild(productCard);
        });
    } catch (error) {
        console.error("Error displaying products:", error);
        alert('حدث خطأ أثناء عرض المنتجات');
    }
}

// Display products in admin dashboard
async function displayAdminProducts() {
    try {
        const adminProductsContainer = document.getElementById('adminProductsContainer');
        adminProductsContainer.innerHTML = '';
        
        const searchQuery = document.getElementById('adminProductSearch').value.toLowerCase();
        const filteredProducts = products.filter(product => 
            product.name.toLowerCase().includes(searchQuery) ||
            product.description.toLowerCase().includes(searchQuery) ||
            getCategoryInArabic(product.category).toLowerCase().includes(searchQuery)
        );
        
        filteredProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card admin-product-card';
            productCard.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p class="price">${product.price} ريال</p>
                <p class="category">${getCategoryInArabic(product.category)}</p>
                <div class="product-actions">
                    <button onclick="editProduct('${product.id}')" class="edit-btn">
                        تعديل
                    </button>
                    <button onclick="deleteProduct('${product.id}')" class="delete-btn">
                        حذف
                    </button>
                </div>
            `;
            adminProductsContainer.appendChild(productCard);
        });
    } catch (error) {
        console.error("Error displaying admin products:", error);
        alert('حدث خطأ أثناء عرض المنتجات في لوحة التحكم');
    }
}

// Helper function to get category name in Arabic
function getCategoryInArabic(category) {
    const categories = {
        'Electronics': 'إلكترونيات',
        'Clothing': 'ملابس',
        'Home': 'المنزل',
        'Beauty': 'الجمال',
        'Sports': 'الرياضة',
        'Books': 'الكتب',
        'Toys': 'الألعاب',
        'Food': 'الطعام',
        'Other': 'أخرى'
    };
    return categories[category] || category;
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
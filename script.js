// DOM Elements (Keep existing ones)
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

// Sidebar Navigation Elements (Keep existing ones)
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('closeSidebar');
const overlay = document.getElementById('overlay');
const sidebarLinks = document.querySelectorAll('.sidebar-links a');
const sidebarAddProductBtn = document.getElementById('sidebarAddProductBtn');
const sidebarFeedbackBtn = document.getElementById('sidebarFeedbackBtn');
const sidebarLoginBtn = document.getElementById('sidebarLoginBtn');
const sidebarAdminBtn = document.getElementById('sidebarAdminBtn');

// State Variables
let currentUser = null; // Will be populated by Firebase Auth
let selectedPlan = null;
let editingProductId = null;
let pendingProductsCount = 0; // Keep for admin notification

// Remove adminCredentials and registeredUsers
// let products = []; // Product data will now primarily live in Firebase DB
// let feedbacks = []; // Feedback data will now primarily live in Firebase DB

// Create Notification Element (Keep existing)
const notificationElement = document.createElement('div');
notificationElement.id = 'adminNotification';
notificationElement.className = 'admin-notification';
document.body.appendChild(notificationElement);

// --- REMOVE LOCALSTORAGE SAVING/LOADING FOR USERS ---
// function loadSavedData() { ... remove user loading ... }
// function saveData() { ... remove user saving ... }
// loadSavedData(); // Remove this call or modify it

// --- HELPER FUNCTIONS ---

// Map Firebase Auth error codes to user-friendly messages
function mapAuthError(errorCode) {
    switch (errorCode) {
        case 'auth/invalid-email': return 'البريد الإلكتروني غير صالح.';
        case 'auth/user-disabled': return 'تم تعطيل هذا الحساب.';
        case 'auth/user-not-found': return 'لم يتم العثور على حساب بهذا البريد الإلكتروني.';
        case 'auth/wrong-password': return 'كلمة المرور غير صحيحة.';
        case 'auth/email-already-in-use': return 'هذا البريد الإلكتروني مستخدم بالفعل.';
        case 'auth/weak-password': return 'كلمة المرور ضعيفة جداً (يجب أن تكون 6 أحرف على الأقل).';
        case 'auth/operation-not-allowed': return 'تسجيل الدخول بكلمة المرور غير مفعل.';
        case 'auth/requires-recent-login': return 'تتطلب هذه العملية إعادة تسجيل الدخول مؤخراً.';
        default: return 'حدث خطأ غير متوقع. (' + errorCode + ')';
    }
}

// Function to validate email format (Keep existing)
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Function to get category name (Keep existing)
function getCategoryName(category) {
    const categories = {
        'electronics': 'إلكترونيات', 'clothing': 'ملابس', 'home': 'منتجات منزلية',
        'beauty': 'مستحضرات تجميل', 'sports': 'رياضة', 'books': 'كتب',
        'toys': 'ألعاب', 'food': 'طعام', 'other': 'أخرى'
    };
    return categories[category] || category;
}

// Function to get status text (Keep existing)
function getStatusText(status) {
    switch(status) {
        case 'pending': return 'قيد الانتظار';
        case 'resolved': return 'تم الحل'; // For feedback
        case 'rejected': return 'مرفوض'; // For feedback
        case 'approved': return 'معتمد'; // For products
        default: return status;
    }
}

// --- AUTHENTICATION LOGIC ---

// Listener for Authentication State Changes
window.initializeAuthListener = () => {
    if (typeof onAuthStateChanged !== 'function') {
        console.error("Firebase Auth 'onAuthStateChanged' not available yet.");
        // Retry initialization slightly later if needed
        setTimeout(window.initializeAuthListener, 500);
        return;
    }

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is signed in
            console.log("Auth State Changed: User signed in:", user.uid, user.email);
            const userRef = dbRef(db, `users/${user.uid}`);
            try {
                const snapshot = await dbGet(userRef);
                let userRole = 'customer'; // Default role
                let userSubscription = null; // Default subscription
                let userHasUsedFreePlan = false; // Default free plan status

                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    userRole = userData.role || 'customer';
                    userSubscription = userData.subscriptionPlan || null;
                    userHasUsedFreePlan = userData.hasUsedFreePlan || false;
                    console.log("User data from DB:", userData);
                } else {
                    // User exists in Auth but not DB (e.g., first login after signup)
                    // Create their profile in the database
                    console.log("User profile not found in DB, creating...");
                    await dbSet(userRef, {
                        email: user.email,
                        role: 'customer',
                        date: new Date().toISOString(),
                        hasUsedFreePlan: false // Initialize free plan status
                    });
                    console.log("Created user profile in DB for:", user.email);
                }

                currentUser = {
                    uid: user.uid,
                    email: user.email,
                    role: userRole,
                    subscriptionPlan: userSubscription,
                    hasUsedFreePlan: userHasUsedFreePlan
                };
                console.log("Current user set:", currentUser);

                // Admin specific actions
                if (currentUser.role === 'admin') {
                   updateAdminNotification(); // Check for pending items
                   // Ensure admin tab is accessible in sidebar
                   if (sidebarAdminBtn) sidebarAdminBtn.style.display = 'block';
                } else {
                   if (sidebarAdminBtn) sidebarAdminBtn.style.display = 'none';
                }
                displaySubscriptionStatus(); // Show subscription status for customer

            } catch (error) {
                console.error("Error fetching/creating user data:", error);
                // Fallback: Sign the user out or assign a default basic profile
                currentUser = { // Basic fallback
                    uid: user.uid,
                    email: user.email,
                    role: 'customer',
                    subscriptionPlan: null,
                    hasUsedFreePlan: false
                };
                alert("حدث خطأ في تحميل بيانات المستخدم. قد تكون بعض الميزات غير متاحة.");
            }

        } else {
            // User is signed out
            console.log("Auth State Changed: User signed out");
            currentUser = null;
            if (sidebarAdminBtn) sidebarAdminBtn.style.display = 'none'; // Hide admin button
             if (document.getElementById('subscriptionStatus')) {
                 document.getElementById('subscriptionStatus').innerHTML = ''; // Clear subscription status
             }
        }
        updateUI(); // Update general UI elements based on login state
        displayProducts(); // Refresh product list (might show different actions based on login)
    });
};

// Call initializer function when the script loads
if (window.auth) {
    window.initializeAuthListener();
} // else it will be called from index.html after Firebase is loaded

// Login Form Submission Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitButton = loginForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'جاري الدخول...';

    try {
        // Try to sign in
        console.log(`Attempting login for: ${email}`);
        await signInWithEmailAndPassword(auth, email, password);
        console.log(`Login successful for: ${email}`);
        // onAuthStateChanged will handle UI updates and role fetching
        loginModal.style.display = 'none';
        loginForm.reset();

    } catch (error) {
        console.error("Login Error:", error.code, error.message);
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            // Handle both user-not-found and generic invalid-credential (which often means user not found or wrong password)
            // Ask to register only if it's likely a new user
            if (confirm('الحساب غير موجود أو كلمة المرور خاطئة. هل تريد إنشاء حساب جديد بهذا البريد وكلمة المرور؟ (إذا كان الحساب موجوداً، تجاهل وأعد المحاولة بكلمة المرور الصحيحة)')) {
                 try {
                     console.log(`Attempting registration for: ${email}`);
                     const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                     console.log(`Registration successful for: ${email}, UID: ${userCredential.user.uid}`);

                     // Set default role and data in Realtime Database immediately after creation
                     const userRef = dbRef(db, `users/${userCredential.user.uid}`);
                     await dbSet(userRef, {
                         email: email,
                         role: 'customer', // Default role
                         date: new Date().toISOString(),
                         hasUsedFreePlan: false // Initialize free plan status
                     });
                     console.log(`User profile created in DB for UID: ${userCredential.user.uid}`);

                     alert('تم إنشاء الحساب وتسجيل الدخول بنجاح!');
                     loginModal.style.display = 'none';
                     loginForm.reset();
                     // onAuthStateChanged will handle the rest (setting currentUser, UI update)
                 } catch (signupError) {
                     console.error("Signup Error:", signupError.code, signupError.message);
                     alert('فشل إنشاء الحساب: ' + mapAuthError(signupError.code));
                 }
            } else {
                 alert('تسجيل الدخول فشل. يرجى التحقق من البريد الإلكتروني وكلمة المرور أو إنشاء حساب جديد.');
            }
        // } else if (error.code === 'auth/wrong-password') { // Covered by invalid-credential often
        //     alert('كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.');
        } else if (error.code === 'auth/invalid-email') {
            alert('البريد الإلكتروني غير صالح.');
        } else {
            alert('فشل تسجيل الدخول: ' + mapAuthError(error.code));
        }
    } finally {
         submitButton.disabled = false;
         submitButton.textContent = 'تسجيل الدخول';
    }
});

// --- UI UPDATE LOGIC ---

// Update UI based on user login status and role
function updateUI() {
    const loginBtn = document.getElementById('loginBtn');
    const addProductBtn = document.getElementById('addProductBtn');
    const feedbackBtn = document.getElementById('feedbackBtn');
    const sidebarLoginBtn = document.getElementById('sidebarLoginBtn');
    const sidebarAddProductBtn = document.getElementById('sidebarAddProductBtn');
    const sidebarFeedbackBtn = document.getElementById('sidebarFeedbackBtn');
    const sidebarAdminBtn = document.getElementById('sidebarAdminBtn');

    if (currentUser) {
        // User is logged in
        addProductBtn.style.display = ''; // Show add product button
        feedbackBtn.style.display = ''; // Show feedback button
        sidebarAddProductBtn.style.display = '';
        sidebarFeedbackBtn.style.display = '';

        if (currentUser.role === 'admin') {
            loginBtn.textContent = 'لوحة التحكم';
            sidebarLoginBtn.style.display = 'none'; // Hide sidebar login
            sidebarAdminBtn.style.display = 'block'; // Show sidebar admin
            loginBtn.onclick = () => {
                adminDashboardModal.style.display = 'block';
                displayUsers(); // Load initial tab
            };
            sidebarAdminBtn.onclick = () => { // Make sidebar admin button work
                loginBtn.click();
                closeSidebarMenu(); // Close sidebar after clicking
            };
        } else {
            // Customer logged in
            loginBtn.textContent = 'تسجيل الخروج';
            sidebarLoginBtn.textContent = 'تسجيل الخروج';
            sidebarAdminBtn.style.display = 'none'; // Hide admin button
            sidebarLoginBtn.style.display = 'block'; // Show sidebar logout
            loginBtn.onclick = () => {
                signOut(auth).catch((error) => {
                    console.error("Sign out error", error);
                    alert('حدث خطأ أثناء تسجيل الخروج.');
                });
            };
             sidebarLoginBtn.onclick = () => { loginBtn.click(); closeSidebarMenu();}; // Reuse main button logic
        }
    } else {
        // User is logged out
        loginBtn.textContent = 'تسجيل الدخول';
        sidebarLoginBtn.textContent = 'تسجيل الدخول';
        sidebarAdminBtn.style.display = 'none';
        sidebarLoginBtn.style.display = 'block';

        loginBtn.onclick = () => { loginModal.style.display = 'block'; };
        sidebarLoginBtn.onclick = () => { loginBtn.click(); closeSidebarMenu(); };

        // Optionally hide buttons requiring login
        // addProductBtn.style.display = 'none';
        // feedbackBtn.style.display = 'none';
        // sidebarAddProductBtn.style.display = 'none';
        // sidebarFeedbackBtn.style.display = 'none';
    }
    // Refresh product display as buttons might change
    displayProducts();
}


// --- MODAL HANDLING (Keep existing close/outside click logic) ---
Array.from(closeButtons).forEach(button => {
    button.addEventListener('click', (e) => {
        e.target.closest('.modal').style.display = 'none';
    });
});

window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

// --- SIDEBAR LOGIC (Keep existing toggle/close/link logic) ---
menuToggle.addEventListener('click', () => {
    sidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.classList.add('sidebar-open');
   // document.body.style.overflow = 'hidden'; // Re-evaluate if needed
});

function closeSidebarMenu() {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.classList.remove('sidebar-open');
    // document.body.style.overflow = ''; // Re-evaluate if needed
}

closeSidebar.addEventListener('click', closeSidebarMenu);
overlay.addEventListener('click', closeSidebarMenu);

sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        // Basic navigation or scrolling
        const targetId = link.getAttribute('href');
        if (targetId && targetId.startsWith('#') && targetId.length > 1) {
             // Smooth scroll for internal links
             const targetElement = document.getElementById(targetId.substring(1));
             if (targetElement) {
                 e.preventDefault(); // Prevent default jump
                 targetElement.scrollIntoView({ behavior: 'smooth' });
             }
        } else if (link.id && link.id.includes('Btn')) {
            // Handle button-like links (already handled below)
        } else {
             // Handle other links (e.g., 'الرئيسية')
             if (targetId === '#') { // Assuming '#' is home
                 e.preventDefault();
                 window.scrollTo({ top: 0, behavior: 'smooth' });
             }
        }

        // Close sidebar regardless
        closeSidebarMenu();

         // Update active state (simple version based on href)
         sidebarLinks.forEach(l => l.classList.remove('active'));
         link.classList.add('active');
         // Also update main nav active state if possible
         const mainNavLink = document.querySelector(`.nav-links a[href="${targetId}"]`);
         if(mainNavLink) {
            document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
            mainNavLink.classList.add('active');
         }
    });
});


// Connect sidebar buttons to main button actions (Keep existing)
sidebarAddProductBtn.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent default link behavior
    document.getElementById('addProductBtn').click();
    closeSidebarMenu();
});

sidebarFeedbackBtn.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('feedbackBtn').click();
    closeSidebarMenu();
});

// Note: sidebarLoginBtn and sidebarAdminBtn logic is handled within updateUI()

// --- PRODUCT LOGIC ---

// Display Products (Main View) - Modified to fetch from Firebase
function displayProducts() {
    if (!productsContainer) return;
    productsContainer.innerHTML = '<div class="loading-message">جاري تحميل المنتجات...</div>';

    const productsRef = dbRef(db, 'products');
    dbOnValue(productsRef, (snapshot) => {
        productsContainer.innerHTML = ''; // Clear previous content or loading message
        const data = snapshot.val();
        let approvedProductsFound = false;

        if (data) {
            const productsArray = Object.entries(data)
                .map(([id, product]) => ({ id, ...product }))
                .filter(product => product.status === 'approved') // Show only approved products
                .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date desc

            if (productsArray.length > 0) {
                approvedProductsFound = true;
                productsArray.forEach(product => {
                    const productCard = createProductCard(product); // Use helper function
                    productsContainer.appendChild(productCard);
                });
            }
        }

        if (!approvedProductsFound) {
            productsContainer.innerHTML = `
                <div class="no-products-message">
                    <i class="fas fa-info-circle"></i>
                    <p>لا توجد منتجات معتمدة متاحة حالياً</p>
                </div>`;
        }
    }, (error) => {
        console.error("Error fetching products:", error);
        productsContainer.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i><p>خطأ في تحميل المنتجات.</p></div>`;
    });
}

// Helper function to create a product card element
function createProductCard(product) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.dataset.productId = product.id; // Add product ID for potential future interactions

    let imageUrl = product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image';
    // Basic URL validation (can be improved)
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        imageUrl = 'https://via.placeholder.com/300x200?text=Invalid+URL';
    }

    // Sanitize potentially unsafe values (basic example)
    const safeName = product.name ? String(product.name).replace(/</g, "<") : 'بدون اسم';
    const safeDescription = product.description ? String(product.description).replace(/</g, "<") : 'لا يوجد وصف';
    const safePrice = product.price ? Number(product.price).toFixed(2) : '0.00';
    const safePhone = product.phone ? String(product.phone).replace(/</g, "<") : 'غير متوفر';
    const safeCategory = product.category ? getCategoryName(String(product.category).replace(/</g, "<")) : 'غير محدد';
    const safeDate = product.date ? new Date(product.date).toLocaleDateString('ar-EG') : 'غير محدد';

    const cardContent = `
        <div class="product-image-container">
            <img src="${imageUrl}"
                 alt="${safeName}"
                 class="product-image"
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=Image+Error';">
        </div>
        <div class="product-details">
            <div class="product-header">
                <h3 class="product-name">${safeName}</h3>
                <div class="product-price">${safePrice} دج</div>
            </div>
            <div class="product-category">
                <i class="fas fa-tag"></i>
                <span>${safeCategory}</span>
            </div>
            <div class="product-description">${safeDescription}</div>
            <div class="product-footer">
                <div class="product-contact">
                    <i class="fas fa-phone"></i>
                    <span>${safePhone}</span>
                </div>
                <div class="product-date">
                    <i class="far fa-calendar-alt"></i>
                    <span>${safeDate}</span>
                </div>
                 ${currentUser && currentUser.role === 'admin' ? `
                    <div class="admin-product-actions">
                        <button class="delete-btn-inline" onclick="deleteProduct('${product.id}')" title="حذف المنتج"><i class="fas fa-trash"></i></button>
                    </div>
                 ` : ''}
                 ${currentUser && currentUser.email === product.seller && product.status !== 'approved' ? `
                    <div class="seller-product-actions">
                        <span>(منتجك - ${getStatusText(product.status)})</span>
                         <button class="delete-btn-inline" onclick="deleteOwnProduct('${product.id}')" title="حذف منتجي"><i class="fas fa-trash"></i></button>
                    </div>
                 ` : ''}
                 ${currentUser && currentUser.email === product.seller && product.status === 'approved' ? `
                    <div class="seller-product-actions">
                         <button class="delete-btn-inline" onclick="deleteOwnProduct('${product.id}')" title="حذف منتجي"><i class="fas fa-trash"></i></button>
                    </div>
                 ` : ''}
            </div>
        </div>
    `;
    productCard.innerHTML = cardContent;
    return productCard;
}

// Handle Add Product Button Click
addProductBtn.addEventListener('click', () => {
    if (!currentUser) {
        alert('يرجى تسجيل الدخول أولاً لإضافة منتج.');
        loginModal.style.display = 'block';
        return;
    }

    if (currentUser.role === 'admin') {
        // Admin can add directly, no subscription needed
        editingProductId = null;
        addProductForm.reset();
        document.getElementById('imagePreview').innerHTML = '';
        document.querySelector('#addProductModal h2').textContent = 'إضافة منتج جديد (كمشرف)';
        // Remove any leftover subscription info from form if needed
        const remainingInput = document.getElementById('remainingProducts');
        if (remainingInput) remainingInput.remove();
         const submitBtn = document.getElementById('submitProductBtn');
         submitBtn.textContent = 'إضافة المنتج';
         submitBtn.disabled = false;
        addProductModal.style.display = 'block';
    } else {
        // Customer needs subscription check/selection
        // Check current plan vs product count
        const userProductsRef = dbRef(db, 'products');
        dbOnValue(userProductsRef, (snapshot) => {
             const allProducts = snapshot.val() || {};
             const userProducts = Object.values(allProducts).filter(p => p.seller === currentUser.email);
             const currentProductCount = userProducts.length;
             const currentPlan = currentUser.subscriptionPlan || { type: 'free', limit: 2, price: 0 }; // Default to free

             console.log("Current products:", currentProductCount, "Plan limit:", currentPlan.limit);

             if (currentProductCount >= currentPlan.limit) {
                 alert(`لقد وصلت للحد الأقصى لعدد المنتجات (${currentPlan.limit}) في خطتك الحالية (${currentPlan.type}). يرجى الترقية لإضافة المزيد.`);
                 updateSubscriptionPlansDisplay(currentProductCount); // Show plans for upgrade
                 subscriptionPlansModal.style.display = 'block';
             } else {
                 // User has slots available in current plan
                 editingProductId = null;
                 addProductForm.reset();
                 document.getElementById('imagePreview').innerHTML = '';
                 document.querySelector('#addProductModal h2').textContent = `إضافة منتج (الخطة: ${currentPlan.type})`;

                 // Add hidden input for remaining slots (calculated dynamically now)
                 let remainingSlots = currentPlan.limit - currentProductCount;
                 const remainingInput = document.createElement('input');
                 remainingInput.type = 'hidden';
                 remainingInput.id = 'remainingProducts';
                 remainingInput.value = remainingSlots; // Set initial remaining
                 // Remove old one if exists, then add new one
                 const oldInput = document.getElementById('remainingProducts');
                 if (oldInput) oldInput.remove();
                 addProductForm.appendChild(remainingInput);


                 const submitBtn = document.getElementById('submitProductBtn');
                 submitBtn.textContent = `إضافة المنتج (${remainingSlots} متبقي)`;
                 submitBtn.disabled = false;
                 addProductModal.style.display = 'block';
             }
        }, { onlyOnce: true }); // Fetch product count once
    }
});

// Handle Add Product Form Submission
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) {
        alert("خطأ: المستخدم غير مسجل الدخول.");
        return;
    }

    const submitButton = document.getElementById('submitProductBtn');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإضافة...';

    try {
        const productName = document.getElementById('productName').value.trim();
        const productPrice = document.getElementById('productPrice').value.trim();
        const productCategory = document.getElementById('productCategory').value;
        const productDescription = document.getElementById('productDescription').value.trim();
        const productPhone = document.getElementById('productPhone').value.trim();
        const imageFile = document.getElementById('productImage').files[0];
        const remainingProductsInput = document.getElementById('remainingProducts');
        // Check if user has remaining slots (relevant for non-admins)
        if (currentUser.role !== 'admin') {
             if (!remainingProductsInput || parseInt(remainingProductsInput.value, 10) <= 0) {
                 // Double check against DB count just in case
                 const userProductsRef = dbRef(db, 'products');
                 const snapshot = await dbGet(userProductsRef);
                 const allProducts = snapshot.val() || {};
                 const userProducts = Object.values(allProducts).filter(p => p.seller === currentUser.email);
                 const currentPlan = currentUser.subscriptionPlan || { type: 'free', limit: 2 };

                 if (userProducts.length >= currentPlan.limit) {
                     throw new Error('لقد وصلت إلى الحد الأقصى من المنتجات المسموح بها في خطتك الحالية. يرجى الترقية.');
                 }
                 // If DB check passes but input was wrong, update input value (though ideally it should be correct)
                 if(remainingProductsInput) remainingProductsInput.value = currentPlan.limit - userProducts.length;

             }
        }


        // Basic validation
        if (!productName || !productPrice || !productCategory || !productDescription || !productPhone) {
            throw new Error('يرجى ملء جميع الحقول النصية المطلوبة.');
        }
        if (!imageFile && !editingProductId) { // Image required for new products
            throw new Error('يرجى اختيار صورة للمنتج.');
        }
        if (isNaN(parseFloat(productPrice)) || parseFloat(productPrice) < 0) {
             throw new Error('يرجى إدخال سعر صحيح.');
        }

        let imageUrl = ''; // Initialize imageUrl

        // Handle image upload only if a new image is selected
        if (imageFile) {
            // Validate image file (optional but recommended)
             if (imageFile.size > 5 * 1024 * 1024) throw new Error('حجم الصورة كبير جداً (الحد الأقصى 5MB).');
             const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
             if (!validTypes.includes(imageFile.type)) throw new Error('نوع الملف غير مدعوم (JPG, PNG, GIF, WebP).');

            // Using Cloudinary (ensure your cloud_name and upload_preset are correct)
            const formData = new FormData();
            formData.append('file', imageFile);
            formData.append('upload_preset', 'dkvrbc30'); // Replace with your Cloudinary upload preset
            formData.append('cloud_name', 'dlrmoc6nq'); // Replace with your Cloudinary cloud name

            console.log("Uploading image to Cloudinary...");
            const uploadResponse = await fetch('https://api.cloudinary.com/v1_1/dlrmoc6nq/image/upload', { // Replace cloud name here too
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(`فشل تحميل الصورة: ${errorData.error?.message || 'خطأ غير معروف'}`);
            }
            const uploadResult = await uploadResponse.json();
            if (!uploadResult.secure_url) {
                throw new Error('لم يتم الحصول على رابط الصورة من Cloudinary.');
            }
            imageUrl = uploadResult.secure_url;
            console.log("Image uploaded successfully:", imageUrl);
        } else if (editingProductId) {
            // If editing and no new image, keep the old image URL (fetch it first)
            // This part needs modification if you implement editing
             console.warn("Editing not fully implemented - Image handling requires fetching old URL.");
             // For now, assume adding new product if no image file provided without editing context
             if(!editingProductId) throw new Error('يرجى اختيار صورة للمنتج.');
        }


        // Prepare product data
        const productData = {
            name: productName,
            price: parseFloat(productPrice), // Store as number
            category: productCategory,
            description: productDescription,
            phone: productPhone,
            imageUrl: imageUrl, // Will be empty if editing without new image and old URL not fetched
            date: new Date().toISOString(),
            status: currentUser.role === 'admin' ? 'approved' : 'pending', // Admins approve instantly
            seller: currentUser.email, // Use email as identifier
            sellerUid: currentUser.uid // Store UID as well for easier querying later
        };

        // Save to Firebase Realtime Database
        const newProductRef = dbPush(dbRef(db, 'products')); // Generate unique key
        await dbSet(newProductRef, { id: newProductRef.key, ...productData }); // Save with ID inside
        console.log("Product saved to Firebase with ID:", newProductRef.key);


        // Update remaining product count for non-admins
        if (currentUser.role !== 'admin' && remainingProductsInput) {
            const currentRemaining = parseInt(remainingProductsInput.value, 10);
            if (currentRemaining > 0) {
                 const newRemaining = currentRemaining - 1;
                 remainingProductsInput.value = newRemaining;
                 submitButton.textContent = `إضافة المنتج (${newRemaining} متبقي)`;
                  if (newRemaining <= 0) {
                     submitButton.disabled = true; // Disable if limit reached
                     submitButton.textContent = 'تم الوصول للحد الأقصى';
                 }
            }
        }


        // Reset form and close modal
        addProductForm.reset();
        document.getElementById('imagePreview').innerHTML = '';
        addProductModal.style.display = 'none';

        if (currentUser.role === 'admin') {
            alert('تم إضافة المنتج بنجاح وعرضه مباشرة.');
            displayProducts(); // Refresh main list
            displayAdminProducts(); // Refresh admin list
        } else {
            alert('تم إضافة منتجك بنجاح. سيتم مراجعته من قبل المشرف قريباً.');
             displaySubscriptionStatus(); // Update count shown
             updateAdminNotification(); // Alert admin if needed
        }

    } catch (error) {
        console.error("Error adding product:", error);
        alert(`فشل إضافة المنتج: ${error.message}`);
    } finally {
        // Re-enable button unless limit was reached for non-admin
        const remainingVal = document.getElementById('remainingProducts')?.value;
        if (currentUser?.role === 'admin' || (remainingVal && parseInt(remainingVal, 10) > 0) ) {
             submitButton.disabled = false;
             if(currentUser?.role !== 'admin' && remainingVal) {
                  submitButton.textContent = `إضافة المنتج (${remainingVal} متبقي)`;
             } else {
                  submitButton.textContent = 'إضافة المنتج';
             }
        } else if (currentUser?.role !== 'admin') {
             submitButton.textContent = 'تم الوصول للحد الأقصى';
             submitButton.disabled = true;
        }
    }
});

// Handle image preview (Keep existing)
document.getElementById('productImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = ''; // Clear previous preview
    if (file) {
        // Basic validation (optional)
        if (file.size > 5 * 1024 * 1024) {
            alert('حجم الصورة كبير جداً (الحد الأقصى 5MB).');
            this.value = ''; return;
        }
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
             alert('نوع الملف غير مدعوم (JPG, PNG, GIF, WebP).');
             this.value = ''; return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = document.createElement('img');
            img.src = event.target.result;
            img.alt = "معاينة الصورة";
            preview.appendChild(img);
        }
        reader.readAsDataURL(file);
    }
});


// --- SUBSCRIPTION LOGIC ---

// Update subscription plans display
function updateSubscriptionPlansDisplay(currentProductCount = 0) {
    if (!currentUser || currentUser.role === 'admin') {
        // Hide or disable plans modal for admin or logged out users
        subscriptionPlansModal.style.display = 'none';
        return;
    }

     // Fetch current count if not provided
     const fetchCountIfNeeded = async () => {
         if (currentProductCount === 0) {
             const userProductsRef = dbRef(db, 'products');
             const snapshot = await dbGet(userProductsRef); // Use get for one-time fetch
             const allProducts = snapshot.val() || {};
             const userProducts = Object.values(allProducts).filter(p => p.seller === currentUser.email);
             return userProducts.length;
         }
         return currentProductCount;
     };

     fetchCountIfNeeded().then(count => {
         const currentPlan = currentUser.subscriptionPlan || { type: 'free', limit: 2 }; // Default to free

         document.querySelectorAll('.plan').forEach(planElement => {
             const planType = planElement.dataset.plan;
             const planLimit = parseInt(planElement.dataset.limit, 10);
             const planPrice = parseInt(planElement.dataset.price, 10);
             const planName = planElement.querySelector('h3').textContent; // Get plan name

             const pElements = planElement.querySelectorAll('p');
             const descriptionP = pElements[0]; // Assuming first <p> is description
             const priceP = pElements[1]; // Assuming second <p> is price display

             // Update description (You might want a more dynamic description generator)
             descriptionP.textContent = `عرض من ${planType === 'free' ? 0 : 'المستوى السابق'} إلى ${planLimit} منتج`; // Example description update

             // Highlight current plan (optional)
             planElement.classList.remove('current-plan');
             if (planType === currentPlan.type) {
                 planElement.classList.add('current-plan');
                 descriptionP.textContent += " (خطتك الحالية)";
             }

             // Handle plan selection button
             const button = planElement.querySelector('.select-plan');
             button.onclick = () => {
                 // Cannot select a plan lower than or equal to current product count unless it's the current plan
                 if (planLimit < count && planType !== currentPlan.type) {
                     alert(`لا يمكنك اختيار خطة (${planName}) بحد أقل من عدد منتجاتك الحالية (${count}).`);
                     return;
                 }
                 // Cannot select the free plan if already used
                 if (planType === 'free' && currentUser.hasUsedFreePlan && currentPlan.type !== 'free') {
                     alert('لقد استخدمت العرض المجاني بالفعل.');
                     return;
                 }


                 selectedPlan = {
                     type: planType,
                     limit: planLimit,
                     price: planPrice,
                     name: planName // Store the name too
                 };

                 subscriptionPlansModal.style.display = 'none';

                 // If price > 0, show payment instructions, else update plan directly (for free)
                 if (selectedPlan.price > 0) {
                     document.getElementById('selectedPlanName').textContent = selectedPlan.name;
                     document.getElementById('selectedPlanLimit').textContent = selectedPlan.limit;
                     document.getElementById('selectedPlanPrice').textContent = selectedPlan.price;
                     paymentInstructionsModal.style.display = 'block';
                 } else {
                     // Handle free plan selection (or re-selection)
                     updateUserSubscription(selectedPlan);
                 }
             };
         });
     }).catch(error => {
          console.error("Error updating subscription plans display:", error);
          alert("حدث خطأ في تحديث عرض خطط الاشتراك.");
     });
}

// Handle Payment Confirmation (Simulated)
confirmPaymentBtn.addEventListener('click', () => {
    if (selectedPlan && currentUser) {
        console.log(`Simulating payment confirmation for plan: ${selectedPlan.name} by user: ${currentUser.email}`);
        // In a real app, verify payment here BEFORE updating the database.
        // For this simulation, we proceed directly.
        updateUserSubscription(selectedPlan);
        paymentInstructionsModal.style.display = 'none';
    } else {
        alert("خطأ: لم يتم تحديد خطة أو المستخدم غير مسجل الدخول.");
    }
});

// Update user's subscription plan in Firebase
async function updateUserSubscription(plan) {
     if (!currentUser || !plan) return;

     const userRef = dbRef(db, `users/${currentUser.uid}`);
     try {
         const updates = {
             subscriptionPlan: plan,
             // Mark free plan as used if it's the free plan being selected
             hasUsedFreePlan: currentUser.hasUsedFreePlan || (plan.type === 'free')
         };
         await dbUpdate(userRef, updates); // Use update to modify specific fields

         // Update local currentUser state
         currentUser.subscriptionPlan = plan;
         currentUser.hasUsedFreePlan = updates.hasUsedFreePlan;

         console.log(`User ${currentUser.email} subscription updated to:`, plan);
         alert(`تم تحديث اشتراكك بنجاح إلى خطة: ${plan.name}.`);

         // Update UI elements reflecting subscription
         displaySubscriptionStatus();
         updateUI(); // General UI update

         // Optionally, open add product modal if they upgraded to add more
         // Check product count again vs new limit
         const userProductsRef = dbRef(db, 'products');
         const snapshot = await dbGet(userProductsRef);
         const allProducts = snapshot.val() || {};
         const userProducts = Object.values(allProducts).filter(p => p.seller === currentUser.email);
         if (userProducts.length < plan.limit) {
             // Consider opening add product modal automatically or just inform user
             console.log("User has slots available after upgrade.");
             // addProductBtn.click(); // Uncomment to open modal automatically
         }

     } catch (error) {
         console.error("Error updating user subscription:", error);
         alert("حدث خطأ أثناء تحديث خطة الاشتراك.");
     }
}

// Display Subscription Status for Customer
function displaySubscriptionStatus() {
    const statusContainer = document.getElementById('subscriptionStatus'); // Find or create this element
    if (!statusContainer) {
        // Create element if it doesn't exist (e.g., insert after hero)
        const heroSection = document.querySelector('.hero');
        if(heroSection) {
            const newStatusContainer = document.createElement('div');
            newStatusContainer.id = 'subscriptionStatus';
            newStatusContainer.className = 'subscription-status';
            heroSection.parentNode.insertBefore(newStatusContainer, heroSection.nextSibling);
            // Now call the function again to populate it
            setTimeout(displaySubscriptionStatus, 0); // Re-call in next tick
        }
        return;
    }

    statusContainer.innerHTML = ''; // Clear previous status

    if (!currentUser || currentUser.role === 'admin') {
        statusContainer.style.display = 'none'; // Hide for admin/logged out
        return;
    }

    // Fetch current product count for the user
    const userProductsRef = dbRef(db, 'products');
    dbGet(userProductsRef).then(snapshot => { // Use get for one-time fetch
        const allProducts = snapshot.val() || {};
        const userProducts = Object.values(allProducts).filter(p => p.seller === currentUser.email);
        const productCount = userProducts.length;

        const subscriptionPlan = currentUser.subscriptionPlan || { type: 'free', limit: 2, name: 'العرض المجاني' }; // Default to free
        const remainingSlots = Math.max(0, subscriptionPlan.limit - productCount); // Ensure non-negative

        statusContainer.innerHTML = `
            <div class="subscription-info">
                <h3>حالة اشتراكك</h3>
                <p>الخطة الحالية: <strong>${subscriptionPlan.name}</strong></p>
                <p>المنتجات المضافة: <strong>${productCount}</strong> / <strong>${subscriptionPlan.limit}</strong></p>
                <p>المنتجات المتبقية: <strong>${remainingSlots}</strong></p>
                <button id="upgradePlanBtn" class="upgrade-plan-btn">تغيير / ترقية الخطة</button>
            </div>
        `;
        statusContainer.style.display = 'block'; // Make sure it's visible

        // Add event listener to the upgrade button
        document.getElementById('upgradePlanBtn').addEventListener('click', () => {
            updateSubscriptionPlansDisplay(productCount); // Pass current count
            subscriptionPlansModal.style.display = 'block';
        });

    }).catch(error => {
        console.error("Error fetching product count for subscription status:", error);
        statusContainer.innerHTML = '<p style="color: red;">خطأ في تحميل حالة الاشتراك.</p>';
        statusContainer.style.display = 'block';
    });
}


// --- FEEDBACK LOGIC ---

// Handle Feedback Button Click
feedbackBtn.addEventListener('click', () => {
    if (!currentUser) {
        alert('يرجى تسجيل الدخول أولاً لإرسال تعليق.');
        loginModal.style.display = 'block';
        return;
    }
    feedbackForm.reset();
    feedbackModal.style.display = 'block';
});

// Handle Feedback Form Submission
feedbackForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) {
        alert("خطأ: المستخدم غير مسجل الدخول.");
        return;
    }

    const subject = document.getElementById('feedbackSubject').value.trim();
    const message = document.getElementById('feedbackMessage').value.trim();

    if (!subject || !message) {
        alert("يرجى ملء موضوع ورسالة التعليق.");
        return;
    }

    const submitButton = feedbackForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'جاري الإرسال...';

    const newFeedbackRef = dbPush(dbRef(db, 'feedback')); // Generate unique key

    const feedbackData = {
        id: newFeedbackRef.key,
        subject: subject,
        message: message,
        userEmail: currentUser.email, // Store user email
        userId: currentUser.uid,     // Store user ID
        date: new Date().toISOString(),
        status: 'pending' // Initial status
    };

    try {
        await dbSet(newFeedbackRef, feedbackData);
        console.log("Feedback submitted:", feedbackData.id);
        alert('تم إرسال تعليقك بنجاح.');
        feedbackModal.style.display = 'none';
        feedbackForm.reset();
        // Optionally notify admin
        updateAdminNotification();

    } catch (error) {
        console.error("Error submitting feedback:", error);
        alert("حدث خطأ أثناء إرسال التعليق.");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'إرسال التعليق';
    }
});

// --- ADMIN DASHBOARD LOGIC ---

// Handle Tab Switching (Keep existing)
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        document.getElementById(`${tabId}-tab`).classList.add('active');

        // Load content for the selected tab
        if (tabId === 'users') displayUsers();
        else if (tabId === 'products') displayAdminProducts();
        else if (tabId === 'feedback') displayFeedbacks();
    });
});

// Display Users in Admin Dashboard - Modified for Firebase
function displayUsers(searchTerm = '') {
    if (!usersList) return;
    usersList.innerHTML = '<div class="loading-message">جاري تحميل المستخدمين...</div>';

    const usersRef = dbRef(db, 'users');
    dbGet(usersRef).then(snapshot => { // Use get for one-time fetch
        usersList.innerHTML = ''; // Clear loading/previous
        if (!snapshot.exists()) {
            usersList.innerHTML = '<p>لا يوجد مستخدمون مسجلون.</p>';
            return;
        }

        const data = snapshot.val();
        let usersFound = false;
        Object.entries(data).forEach(([uid, user]) => {
            // Filter based on search term (email or UID)
            const lowerSearchTerm = searchTerm.toLowerCase();
             if (!searchTerm ||
                 (user.email && user.email.toLowerCase().includes(lowerSearchTerm)) ||
                 uid.toLowerCase().includes(lowerSearchTerm))
             {
                 usersFound = true;
                 const userCard = document.createElement('div');
                 userCard.className = 'user-card';
                 userCard.dataset.userId = uid;

                 const userPlan = user.subscriptionPlan || { name: 'مجاني', limit: '2' };
                 const registrationDate = user.date ? new Date(user.date).toLocaleDateString('ar-EG') : 'غير معروف';

                 userCard.innerHTML = `
                     <h3>${user.email || 'لا يوجد بريد'} <span style="font-size: 0.7em; color: #666;">(${uid})</span></h3>
                     <div class="user-info">
                         <p>الدور: ${user.role === 'admin' ? 'مشرف' : 'زبون'}</p>
                         <p>تاريخ التسجيل: ${registrationDate}</p>
                         <p>خطة الاشتراك: ${userPlan.name} (حد: ${userPlan.limit})</p>
                         <p>استخدم المجاني: ${user.hasUsedFreePlan ? 'نعم' : 'لا'}</p>
                     </div>
                     <div class="user-actions">
                         ${user.role !== 'admin' ? `
                             <button onclick="makeAdmin('${uid}')" class="action-btn promote-admin"><i class="fas fa-user-shield"></i> ترقية لمشرف</button>
                         ` : `
                             <button onclick="makeCustomer('${uid}')" class="action-btn demote-admin"><i class="fas fa-user"></i> إزالة صلاحية المشرف</button>
                         `}
                         <button onclick="deleteUser('${uid}')" class="action-btn delete-user"><i class="fas fa-trash"></i> حذف بيانات المستخدم</button>
                     </div>
                 `;
                 usersList.appendChild(userCard);
             }
        });

        if (!usersFound) {
            usersList.innerHTML = '<p>لم يتم العثور على مستخدمين يطابقون البحث.</p>';
        }

    }).catch(error => {
        console.error("Error fetching users:", error);
        usersList.innerHTML = `<p style="color:red;">خطأ في تحميل المستخدمين.</p>`;
    });
}

// Display Products in Admin Dashboard - Modified for Firebase
function displayAdminProducts(searchTerm = '') {
    if (!adminProductsList) return;
    adminProductsList.innerHTML = '<div class="loading-message">جاري تحميل المنتجات...</div>';
    pendingProductsCount = 0; // Reset pending count

    const productsRef = dbRef(db, 'products');
    dbGet(productsRef).then(snapshot => { // Use get for one-time fetch
        adminProductsList.innerHTML = ''; // Clear loading/previous
        if (!snapshot.exists()) {
            adminProductsList.innerHTML = '<p>لا توجد منتجات مضافة.</p>';
             updateAdminNotification(); // Update notification (will show 0)
            return;
        }

        const data = snapshot.val();
        let productsFound = false;
        const productsArray = Object.entries(data)
             .map(([id, product]) => ({ id, ...product }))
             .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort newest first

        productsArray.forEach(product => {
             if (product.status === 'pending') {
                 pendingProductsCount++;
             }

             // Filter based on search term (name, description, category, seller email)
             const lowerSearchTerm = searchTerm.toLowerCase();
             const productName = product.name ? product.name.toLowerCase() : '';
             const productDesc = product.description ? product.description.toLowerCase() : '';
             const productCat = product.category ? getCategoryName(product.category).toLowerCase() : '';
             const productSeller = product.seller ? product.seller.toLowerCase() : '';

             if (!searchTerm ||
                 productName.includes(lowerSearchTerm) ||
                 productDesc.includes(lowerSearchTerm) ||
                 productCat.includes(lowerSearchTerm) ||
                 productSeller.includes(lowerSearchTerm) ||
                 product.id.toLowerCase().includes(lowerSearchTerm)
                 )
             {
                 productsFound = true;
                 const productCard = document.createElement('div');
                 productCard.className = 'admin-product-card';
                 productCard.dataset.productId = product.id;

                 let imageUrl = product.imageUrl || 'https://via.placeholder.com/150x100?text=No+Image';
                 if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
                     imageUrl = 'https://via.placeholder.com/150x100?text=Invalid+URL';
                 }
                 const safeName = product.name ? String(product.name).replace(/</g, "<") : 'بدون اسم';
                 const safeDescription = product.description ? String(product.description).substring(0, 100).replace(/</g, "<") + '...' : 'لا يوجد وصف'; // Truncate desc
                 const safePrice = product.price ? Number(product.price).toFixed(2) : '0.00';
                 const safePhone = product.phone ? String(product.phone).replace(/</g, "<") : 'غير متوفر';
                 const safeCategory = product.category ? getCategoryName(String(product.category).replace(/</g, "<")) : 'غير محدد';
                 const safeDate = product.date ? new Date(product.date).toLocaleDateString('ar-EG') : 'غير محدد';
                 const safeSeller = product.seller ? String(product.seller).replace(/</g, "<") : 'غير معروف';
                 const statusText = getStatusText(product.status);

                 const cardContent = `
                     <div class="product-image-container" style="flex-basis: 150px; height: 100px;">
                         <img src="${imageUrl}"
                              alt="${safeName}"
                              class="product-image"
                              onerror="this.onerror=null; this.src='https://via.placeholder.com/150x100?text=Error';"
                              style="width: 100%; height: 100%; object-fit: cover;">
                     </div>
                     <div class="product-details" style="flex-grow: 1; padding-left: 15px;">
                         <div class="product-header">
                             <h3 class="product-name" style="font-size: 1.1rem;">${safeName}</h3>
                             <div class="product-price">${safePrice} دج</div>
                         </div>
                         <div style="font-size: 0.85rem; color: #555; margin-bottom: 5px;">
                              <span class="product-category"><i class="fas fa-tag"></i> ${safeCategory}</span> |
                              <span class="product-seller"><i class="fas fa-user"></i> ${safeSeller}</span> |
                              <span class="product-date"><i class="far fa-calendar-alt"></i> ${safeDate}</span>
                         </div>
                         <div class="product-description" style="font-size: 0.9rem; margin-bottom: 10px;">${safeDescription}</div>
                         <div class="product-status">
                             الحالة: <span class="status-${product.status}" style="font-weight: bold;">${statusText}</span>
                              | هاتف: <span class="product-contact">${safePhone}</span>
                         </div>
                         <div class="admin-actions">
                             ${product.status === 'pending' ? `
                                 <button onclick="updateProductStatus('${product.id}', 'approved')" class="action-btn approve-btn">
                                     <i class="fas fa-check"></i> اعتماد
                                 </button>
                                 <button onclick="updateProductStatus('${product.id}', 'rejected')" class="action-btn reject-btn">
                                     <i class="fas fa-times"></i> رفض
                                 </button>
                             ` : ''}
                              ${product.status === 'rejected' ? `
                                 <button onclick="updateProductStatus('${product.id}', 'approved')" class="action-btn approve-btn">
                                     <i class="fas fa-check"></i> اعتماد (بعد الرفض)
                                 </button>
                             ` : ''}
                             <button onclick="deleteProduct('${product.id}')" class="action-btn delete-btn">
                                 <i class="fas fa-trash"></i> حذف نهائي
                             </button>
                         </div>
                     </div>
                 `;
                 productCard.innerHTML = cardContent;
                 productCard.style.display = 'flex'; // Use flex for better layout
                 adminProductsList.appendChild(productCard);
             }
        });

         if (!productsFound) {
            adminProductsList.innerHTML = '<p>لم يتم العثور على منتجات تطابق البحث.</p>';
        }

        updateAdminNotification(); // Update notification count

    }).catch(error => {
        console.error("Error fetching admin products:", error);
        adminProductsList.innerHTML = `<p style="color:red;">خطأ في تحميل المنتجات.</p>`;
        updateAdminNotification();
    });
}

// Display Feedbacks in Admin Dashboard - Modified for Firebase
function displayFeedbacks(searchTerm = '') {
    if (!feedbackList) return;
    feedbackList.innerHTML = '<div class="loading-message">جاري تحميل التعليقات...</div>';

    const feedbackRef = dbRef(db, 'feedback');
    dbGet(feedbackRef).then(snapshot => { // Use get for one-time fetch
        feedbackList.innerHTML = ''; // Clear loading/previous
        if (!snapshot.exists()) {
            feedbackList.innerHTML = '<p>لا توجد تعليقات.</p>';
            return;
        }

        const data = snapshot.val();
         let feedbackFound = false;
        const feedbackArray = Object.entries(data)
             .map(([id, feedback]) => ({ id, ...feedback }))
             .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort newest first

        feedbackArray.forEach(feedback => {
             // Filter based on search term (subject, message, user email)
             const lowerSearchTerm = searchTerm.toLowerCase();
             const subject = feedback.subject ? feedback.subject.toLowerCase() : '';
             const message = feedback.message ? feedback.message.toLowerCase() : '';
             const userEmail = feedback.userEmail ? feedback.userEmail.toLowerCase() : '';

             if (!searchTerm ||
                 subject.includes(lowerSearchTerm) ||
                 message.includes(lowerSearchTerm) ||
                 userEmail.includes(lowerSearchTerm) ||
                 feedback.id.toLowerCase().includes(lowerSearchTerm)
                 )
             {
                 feedbackFound = true;
                 const feedbackCard = document.createElement('div');
                 feedbackCard.className = 'feedback-card';
                 feedbackCard.dataset.feedbackId = feedback.id;

                 const safeSubject = feedback.subject ? String(feedback.subject).replace(/</g, "<") : 'بدون موضوع';
                 const safeMessage = feedback.message ? String(feedback.message).replace(/</g, "<").replace(/\n/g, '<br>') : 'لا يوجد محتوى';
                 const safeUserEmail = feedback.userEmail ? String(feedback.userEmail).replace(/</g, "<") : 'غير معروف';
                 const safeDate = feedback.date ? new Date(feedback.date).toLocaleString('ar-EG') : 'غير محدد';
                 const statusText = getStatusText(feedback.status);

                 feedbackCard.innerHTML = `
                     <h3>${safeSubject}</h3>
                     <div class="feedback-info">
                         <span>من: ${safeUserEmail}</span>
                         <span>التاريخ: ${safeDate}</span>
                         <span>الحالة: <strong class="status-${feedback.status}">${statusText}</strong></span>
                     </div>
                     <div class="feedback-message">
                         ${safeMessage}
                     </div>
                     <div class="feedback-actions">
                         ${feedback.status === 'pending' ? `
                             <button onclick="updateFeedbackStatus('${feedback.id}', 'resolved')" class="action-btn resolve-feedback"><i class="fas fa-check-circle"></i> تم الحل</button>
                             <button onclick="updateFeedbackStatus('${feedback.id}', 'rejected')" class="action-btn reject-feedback"><i class="fas fa-times-circle"></i> رفض</button>
                         ` : ''}
                         ${feedback.status !== 'pending' ? `
                             <button onclick="updateFeedbackStatus('${feedback.id}', 'pending')" class="action-btn reopen-feedback"><i class="fas fa-undo"></i> إعادة فتح (تعيين كـ قيد الانتظار)</button>
                         ` : ''}
                         <button onclick="deleteFeedback('${feedback.id}')" class="action-btn delete-feedback"><i class="fas fa-trash"></i> حذف التعليق</button>
                     </div>
                 `;
                 feedbackList.appendChild(feedbackCard);
             }
        });
         if (!feedbackFound) {
            feedbackList.innerHTML = '<p>لم يتم العثور على تعليقات تطابق البحث.</p>';
        }

    }).catch(error => {
        console.error("Error fetching feedback:", error);
        feedbackList.innerHTML = `<p style="color:red;">خطأ في تحميل التعليقات.</p>`;
    });
}

// --- ADMIN ACTIONS ---

// Function to make a user an admin
async function makeAdmin(userId) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert("ليس لديك الصلاحية للقيام بهذا الإجراء.");
        return;
    }
    // Prevent admin from demoting themselves accidentally via UI (though roles can be managed in DB)
    if (currentUser.uid === userId) {
         alert("لا يمكنك تغيير صلاحيات حسابك الخاص من هنا.");
         return;
    }

    const userRef = dbRef(db, `users/${userId}`);
    let userEmail = `المستخدم ${userId}`;
    try {
        const snapshot = await dbGet(userRef);
        if (snapshot.exists()) userEmail = snapshot.val().email || userEmail;
    } catch { /* Ignore error fetching email */ }

    if (confirm(`هل أنت متأكد من ترقية ${userEmail} إلى مشرف؟`)) {
        try {
            await dbUpdate(userRef, { role: 'admin' }); // Use update
            alert(`تم ترقية ${userEmail} إلى مشرف بنجاح.`);
            displayUsers(userSearch.value); // Refresh list with current search term
        } catch (error) {
            console.error("Error promoting user:", error);
            alert("فشل ترقية المستخدم.");
        }
    }
}
// Function to make an admin a customer
async function makeCustomer(userId) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert("ليس لديك الصلاحية للقيام بهذا الإجراء.");
        return;
    }
     if (currentUser.uid === userId) {
         alert("لا يمكنك تغيير صلاحيات حسابك الخاص من هنا.");
         return;
     }

    const userRef = dbRef(db, `users/${userId}`);
    let userEmail = `المستخدم ${userId}`;
     try {
        const snapshot = await dbGet(userRef);
        if (snapshot.exists()) userEmail = snapshot.val().email || userEmail;
    } catch { /* Ignore error fetching email */ }

    if (confirm(`هل أنت متأكد من إزالة صلاحيات المشرف من ${userEmail}؟ سيصبح زبوناً عادياً.`)) {
        try {
            await dbUpdate(userRef, { role: 'customer' }); // Use update
            alert(`تم تغيير دور ${userEmail} إلى زبون بنجاح.`);
            displayUsers(userSearch.value); // Refresh list
        } catch (error) {
            console.error("Error demoting user:", error);
            alert("فشل تغيير دور المستخدم.");
        }
    }
}


// Function to delete a user's data (Auth account deletion requires Admin SDK/server-side)
async function deleteUser(userId) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert("ليس لديك الصلاحية للقيام بهذا الإجراء.");
        return;
    }
    if (currentUser.uid === userId) {
         alert("لا يمكنك حذف حسابك الخاص من هنا.");
         return;
     }

    const userRef = dbRef(db, `users/${userId}`);
    let userEmail = `المستخدم ${userId}`;
    try {
        const snapshot = await dbGet(userRef);
        if (snapshot.exists()) userEmail = snapshot.val().email || userEmail;
    } catch { /* Ignore error */ }

    if (confirm(`تحذير: هل أنت متأكد من حذف جميع بيانات المستخدم ${userEmail} (UID: ${userId})؟\nسيتم حذف ملفه الشخصي، جميع منتجاته، وجميع تعليقاته من قاعدة البيانات.\nلا يمكن التراجع عن هذا الإجراء.\n(لن يتم حذف حساب المصادقة الخاص به تلقائيًا من هنا).`)) {
        console.log(`Attempting to delete data for user: ${userId}`);
        try {
            // 1. Delete user profile from DB
            await dbRemove(userRef);
            console.log(`Deleted user profile: users/${userId}`);

            // 2. Delete user's products (query by sellerUid)
            const productsRef = dbRef(db, 'products');
            const productsQuery = await dbGet(productsRef); // Consider query(productsRef, orderByChild('sellerUid'), equalTo(userId)) if indexed
            if (productsQuery.exists()) {
                const productUpdates = {};
                productsQuery.forEach(childSnapshot => {
                    if (childSnapshot.val().sellerUid === userId) {
                        productUpdates[childSnapshot.key] = null; // Mark for deletion
                        console.log(`Marked product for deletion: products/${childSnapshot.key}`);
                    }
                });
                if (Object.keys(productUpdates).length > 0) {
                    await dbUpdate(productsRef, productUpdates);
                     console.log("Deleted user's products.");
                } else {
                    console.log("No products found for user to delete.");
                }
            }

            // 3. Delete user's feedback (query by userId)
            const feedbackRef = dbRef(db, 'feedback');
            const feedbackQuery = await dbGet(feedbackRef); // Consider query(feedbackRef, orderByChild('userId'), equalTo(userId)) if indexed
             if (feedbackQuery.exists()) {
                const feedbackUpdates = {};
                feedbackQuery.forEach(childSnapshot => {
                    if (childSnapshot.val().userId === userId) {
                        feedbackUpdates[childSnapshot.key] = null; // Mark for deletion
                        console.log(`Marked feedback for deletion: feedback/${childSnapshot.key}`);
                    }
                });
                 if (Object.keys(feedbackUpdates).length > 0) {
                    await dbUpdate(feedbackRef, feedbackUpdates);
                    console.log("Deleted user's feedback.");
                } else {
                     console.log("No feedback found for user to delete.");
                 }
            }


            alert(`تم حذف جميع بيانات المستخدم ${userEmail} من قاعدة البيانات بنجاح.`);
            displayUsers(userSearch.value); // Refresh user list
            displayAdminProducts(productSearch.value); // Refresh admin product list potentially
            displayProducts(); // Refresh main product list

        } catch (error) {
            console.error("Error deleting user data:", error);
            alert("فشل حذف بيانات المستخدم.");
        }
    }
}

// Function to update product status (Approve/Reject)
async function updateProductStatus(productId, newStatus) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert("ليس لديك الصلاحية للقيام بهذا الإجراء.");
        return;
    }
    if (!productId || !newStatus) return;

    const productRef = dbRef(db, `products/${productId}`);
    const statusUpdate = {
        status: newStatus,
        // Optionally add timestamp/admin who changed status
        lastStatusUpdateBy: currentUser.email,
        lastStatusUpdateAt: new Date().toISOString()
    };

     // If rejecting, directly update. If approving, confirm.
     let proceed = (newStatus === 'rejected') || confirm(`هل أنت متأكد من ${newStatus === 'approved' ? 'اعتماد' : 'رفض'} هذا المنتج؟`);

     if (proceed) {
        try {
            await dbUpdate(productRef, statusUpdate);
            console.log(`Product ${productId} status updated to ${newStatus}`);
            alert(`تم ${newStatus === 'approved' ? 'اعتماد' : 'رفض'} المنتج بنجاح.`);
            displayAdminProducts(productSearch.value); // Refresh admin list
            displayProducts(); // Refresh main list (if approved/unapproved)
            updateAdminNotification(); // Update pending count
        } catch (error) {
            console.error(`Error updating product ${productId} status:`, error);
            alert("فشل تحديث حالة المنتج.");
        }
     }
}

// Function to delete a product entirely (Admin only)
async function deleteProduct(productId) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert("ليس لديك الصلاحية للقيام بهذا الإجراء.");
        return;
    }
    if (!productId) return;

    if (confirm('هل أنت متأكد من حذف هذا المنتج نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) {
        const productRef = dbRef(db, `products/${productId}`);
        try {
            await dbRemove(productRef);
            console.log(`Product ${productId} deleted successfully.`);
            alert('تم حذف المنتج بنجاح.');
            displayAdminProducts(productSearch.value); // Refresh admin list
            displayProducts(); // Refresh main list
             updateAdminNotification(); // Update pending count if it was pending
        } catch (error) {
            console.error(`Error deleting product ${productId}:`, error);
            alert("فشل حذف المنتج.");
        }
    }
}

// Function for user to delete their OWN product
async function deleteOwnProduct(productId) {
    if (!currentUser) {
        alert("يرجى تسجيل الدخول أولاً.");
        return;
    }
     if (!productId) return;

     const productRef = dbRef(db, `products/${productId}`);
     try {
         const snapshot = await dbGet(productRef);
         if (!snapshot.exists()) {
             alert("المنتج غير موجود.");
             return;
         }
         const productData = snapshot.val();
         // Verify ownership
         if (productData.seller !== currentUser.email && productData.sellerUid !== currentUser.uid) {
             alert("ليس لديك الصلاحية لحذف هذا المنتج.");
             return;
         }

         // Confirmation
         if (confirm('هل أنت متأكد من حذف منتجك هذا؟')) {
             await dbRemove(productRef);
             console.log(`User ${currentUser.email} deleted own product ${productId}.`);
             alert('تم حذف منتجك بنجاح.');
             displayProducts(); // Refresh main list
             displaySubscriptionStatus(); // Update counts
             if(currentUser.role === 'admin') displayAdminProducts(productSearch.value); // Refresh admin list too if admin
             updateAdminNotification(); // Update admin notification if it was pending
         }

     } catch (error) {
         console.error(`Error deleting own product ${productId}:`, error);
         alert("فشل حذف المنتج.");
     }
}


// Function to update feedback status
async function updateFeedbackStatus(feedbackId, newStatus) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert("ليس لديك الصلاحية للقيام بهذا الإجراء.");
        return;
    }
    if (!feedbackId || !newStatus) return;

    const feedbackRef = dbRef(db, `feedback/${feedbackId}`);
     const statusUpdate = {
        status: newStatus,
        lastStatusUpdateBy: currentUser.email,
        lastStatusUpdateAt: new Date().toISOString()
    };

     let confirmMsg = `هل أنت متأكد من تغيير حالة التعليق إلى "${getStatusText(newStatus)}"?`;
     if (confirm(confirmMsg)) {
         try {
            await dbUpdate(feedbackRef, statusUpdate);
            console.log(`Feedback ${feedbackId} status updated to ${newStatus}`);
            alert('تم تحديث حالة التعليق بنجاح.');
            displayFeedbacks(feedbackSearch.value); // Refresh feedback list
         } catch (error) {
            console.error(`Error updating feedback ${feedbackId} status:`, error);
            alert("فشل تحديث حالة التعليق.");
         }
     }
}

// Function to delete feedback entirely (Admin only)
async function deleteFeedback(feedbackId) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert("ليس لديك الصلاحية للقيام بهذا الإجراء.");
        return;
    }
    if (!feedbackId) return;

    if (confirm('هل أنت متأكد من حذف هذا التعليق نهائياً؟')) {
        const feedbackRef = dbRef(db, `feedback/${feedbackId}`);
        try {
            await dbRemove(feedbackRef);
            console.log(`Feedback ${feedbackId} deleted successfully.`);
            alert('تم حذف التعليق بنجاح.');
            displayFeedbacks(feedbackSearch.value); // Refresh feedback list
        } catch (error) {
            console.error(`Error deleting feedback ${feedbackId}:`, error);
            alert("فشل حذف التعليق.");
        }
    }
}

// Function to update admin notification for pending items
function updateAdminNotification() {
    // This relies on pendingProductsCount being updated during displayAdminProducts
    // Or we can fetch counts directly if needed
    const fetchPendingCounts = async () => {
         try {
             const productsRef = dbRef(db, 'products');
             const productSnapshot = await dbGet(productsRef);
             let pCount = 0;
             if (productSnapshot.exists()) {
                 Object.values(productSnapshot.val()).forEach(p => {
                     if (p.status === 'pending') pCount++;
                 });
             }

             const feedbackRef = dbRef(db, 'feedback');
             const feedbackSnapshot = await dbGet(feedbackRef);
             let fCount = 0;
              if (feedbackSnapshot.exists()) {
                 Object.values(feedbackSnapshot.val()).forEach(f => {
                     if (f.status === 'pending') fCount++;
                 });
             }
             return { pendingProducts: pCount, pendingFeedback: fCount };

         } catch (error) {
              console.error("Error fetching pending counts:", error);
              return { pendingProducts: 0, pendingFeedback: 0 }; // Return 0 on error
         }
    };


    fetchPendingCounts().then(counts => {
        const notification = document.getElementById('adminNotification');
        if (!notification || !(currentUser && currentUser.role === 'admin')) {
            if(notification) notification.style.display = 'none'; // Hide if not admin
            return;
        }

        let message = '';
        if (counts.pendingProducts > 0) {
            message += `<span>${counts.pendingProducts} منتج بانتظار المراجعة</span>`;
        }
        if (counts.pendingFeedback > 0) {
            if (message) message += '<br>'; // Add separator if both exist
            message += `<span>${counts.pendingFeedback} تعليق بانتظار المراجعة</span>`;
        }


        if (message) {
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-bell fa-lg"></i>
                    <div>${message}</div>
                </div>`;
            notification.style.display = 'block';
            notification.classList.remove('shake'); // Remove previous shake if any
            void notification.offsetWidth; // Trigger reflow to restart animation
            notification.classList.add('shake');

             // Auto-hide after some time (e.g., 10 seconds)
             setTimeout(() => {
                  if (notification.classList.contains('shake')) { // Check if it wasn't hidden manually
                     notification.style.display = 'none';
                     notification.classList.remove('shake');
                  }
             }, 10000);
             // Allow manual dismissal
             notification.onclick = () => {
                 notification.style.display = 'none';
                 notification.classList.remove('shake');
             };

        } else {
            notification.style.display = 'none';
        }
    });
}

// --- SEARCH FUNCTIONALITY ---

// Main product search
mainProductSearch.addEventListener('input', (e) => {
    const searchQuery = e.target.value.toLowerCase().trim();
    const productCards = productsContainer.querySelectorAll('.product-card');
    let visibleCount = 0;

    productCards.forEach(card => {
        const name = card.querySelector('.product-name')?.textContent.toLowerCase() || '';
        const description = card.querySelector('.product-description')?.textContent.toLowerCase() || '';
        const category = card.querySelector('.product-category span')?.textContent.toLowerCase() || '';
        const seller = card.querySelector('.product-seller span')?.textContent.toLowerCase() || ''; // If seller is displayed

        const isVisible = name.includes(searchQuery) ||
                        description.includes(searchQuery) ||
                        category.includes(searchQuery) ||
                        seller.includes(searchQuery);

        card.style.display = isVisible ? '' : 'none';
        if (isVisible) visibleCount++;
    });

    // Handle no results message
    let noResultsMessage = productsContainer.querySelector('.no-products-message');
    if (visibleCount === 0 && productCards.length > 0) { // Only show if cards existed but none match
        if (!noResultsMessage) {
            noResultsMessage = document.createElement('div');
            noResultsMessage.className = 'no-products-message';
            noResultsMessage.innerHTML = `<i class="fas fa-search"></i><p>لم يتم العثور على منتجات تطابق البحث "${searchQuery}".</p>`;
            productsContainer.appendChild(noResultsMessage);
        } else {
             noResultsMessage.innerHTML = `<i class="fas fa-search"></i><p>لم يتم العثور على منتجات تطابق البحث "${searchQuery}".</p>`;
             noResultsMessage.style.display = 'block'; // Ensure it's visible
        }
    } else if (noResultsMessage) {
        noResultsMessage.style.display = 'none'; // Hide if results found or initial state
    }
});


// Admin search listeners - trigger display functions with search term
userSearch.addEventListener('input', (e) => displayUsers(e.target.value.trim()));
productSearch.addEventListener('input', (e) => displayAdminProducts(e.target.value.trim()));
feedbackSearch.addEventListener('input', (e) => displayFeedbacks(e.target.value.trim()));


// --- INITIAL LOAD ---
document.addEventListener('DOMContentLoaded', () => {
    // Initial display calls are now mostly handled by onAuthStateChanged
    // But we can call displayProducts initially to show something while auth loads
     displayProducts();
    // Update active link might be needed here or after auth loads
    // updateActiveLink();
});
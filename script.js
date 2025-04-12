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
    email: 'Profitezshopping@gmail.com',
    password: 'assia20080'
};

// إضافة متغير لتتبع عدد المنتجات في حالة الانتظار
let pendingProductsCount = 0;

// إضافة عنصر الإشعار في HTML
const notificationElement = document.createElement('div');
notificationElement.id = 'adminNotification';
notificationElement.className = 'admin-notification';
document.body.appendChild(notificationElement);

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
        const planLimit = parseInt(planElement.dataset.limit);
        const planPrice = parseInt(planElement.dataset.price);
        
        // حفظ معلومات الخطة المختارة
        selectedPlan = {
            type: planType,
            limit: planLimit,
            price: planPrice
        };
        
        // إخفاء نافذة الخطط
        document.getElementById('subscriptionPlansModal').style.display = 'none';
        
        // إظهار نافذة إدخال المنتجات
        const addProductModal = document.getElementById('addProductModal');
        addProductModal.style.display = 'block';
        
        // تحديث عنوان النافذة
        document.querySelector('#addProductModal h2').textContent = `إضافة منتجات (${planLimit} منتج متاح)`;
        
        // إضافة حقل مخفي لتخزين عدد المنتجات المتبقية
        const remainingProductsInput = document.createElement('input');
        remainingProductsInput.type = 'hidden';
        remainingProductsInput.id = 'remainingProducts';
        remainingProductsInput.value = planLimit;
        addProductModal.querySelector('form').appendChild(remainingProductsInput);
        
        // تحديث زر الإضافة
        const submitButton = addProductModal.querySelector('button[type="submit"]');
        submitButton.textContent = `إضافة المنتج (${planLimit} متبقي)`;
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

// تحديث نموذج إضافة المنتج
document.getElementById('addProductForm').innerHTML = `
    <input type="text" id="productName" placeholder="اسم المنتج" required>
    <input type="number" id="productPrice" placeholder="السعر" required>
    <label for="productCategory">فئة المنتج</label>
    <select id="productCategory" aria-label="فئة المنتج" required>
        <option value="" disabled selected>اختر فئة المنتج</option>
        <option value="electronics">إلكترونيات</option>
        <option value="clothing">ملابس</option>
        <option value="home">منتجات منزلية</option>
        <option value="beauty">مستحضرات تجميل</option>
        <option value="sports">رياضة</option>
        <option value="books">كتب</option>
        <option value="toys">ألعاب</option>
        <option value="food">طعام</option>
        <option value="other">أخرى</option>
    </select>
    <textarea id="productDescription" placeholder="وصف المنتج" required></textarea>
    <input type="tel" id="productPhone" placeholder="رقم الهاتف" required>
    <div class="image-upload-container">
        <label for="productImage" class="image-upload-label">
            <i class="fas fa-cloud-upload-alt"></i>
            <span>اختر صورة المنتج</span>
        </label>
        <input type="file" id="productImage" accept="image/*" required>
        <div id="imagePreview" class="image-preview"></div>
    </div>
    <button type="submit" id="submitProductBtn">إضافة المنتج</button>
`;

// إضافة معالجة تحميل الصورة
document.getElementById('productImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        // التحقق من حجم الصورة (أقصى 5 ميجابايت)
        if (file.size > 5 * 1024 * 1024) {
            alert('حجم الصورة كبير جداً. الحد الأقصى هو 5 ميجابايت');
            this.value = '';
            return;
        }

        // التحقق من نوع الملف
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('نوع الملف غير مدعوم. يرجى اختيار صورة بصيغة JPG, PNG, GIF أو WebP');
            this.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = `<img src="${e.target.result}" alt="معاينة الصورة">`;
        };
        reader.readAsDataURL(file);
    }
});

// تحديث وظيفة إضافة المنتج
document.getElementById('addProductForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitButton = document.getElementById('submitProductBtn');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإضافة...';
    
    try {
        // التحقق من صحة البيانات
        const productName = document.getElementById('productName').value.trim();
        const productPrice = document.getElementById('productPrice').value.trim();
        const productCategory = document.getElementById('productCategory').value;
        const productDescription = document.getElementById('productDescription').value.trim();
        const productPhone = document.getElementById('productPhone').value.trim();
        const imageFile = document.getElementById('productImage').files[0];
        const remainingProducts = parseInt(document.getElementById('remainingProducts').value);

        if (!productName || !productPrice || !productCategory || !productDescription || !productPhone) {
            throw new Error('يرجى ملء جميع الحقول المطلوبة');
        }

        if (!imageFile) {
            throw new Error('يرجى اختيار صورة للمنتج');
        }

        if (remainingProducts <= 0) {
            throw new Error('لقد وصلت إلى الحد الأقصى من المنتجات المسموح بها في هذه الخطة');
        }

        // تحميل الصورة إلى Cloudinary
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('upload_preset', 'dkvrbc30');
        formData.append('cloud_name', 'dlrmoc6nq');

        const uploadResponse = await fetch('https://api.cloudinary.com/v1_1/dlrmoc6nq/image/upload', {
            method: 'POST',
            body: formData
        });

        if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(`فشل في تحميل الصورة: ${errorData.error?.message || 'حدث خطأ غير معروف'}`);
        }

        const uploadResult = await uploadResponse.json();
        
        if (!uploadResult.secure_url) {
            throw new Error('لم يتم الحصول على رابط الصورة من الخادم');
        }

        const imageUrl = uploadResult.secure_url;

        // إنشاء كائن المنتج
        const productData = {
            id: dbPush(dbRef(db, 'products')).key,
            name: productName,
            price: productPrice,
            category: productCategory,
            description: productDescription,
            phone: productPhone,
            imageUrl: imageUrl,
            date: new Date().toISOString(),
            status: currentUser?.role === 'admin' ? 'approved' : 'pending',
            seller: currentUser?.email || 'غير معروف'
        };

        // حفظ المنتج في Firebase
        await dbSet(dbRef(db, `products/${productData.id}`), productData);

        // تحديث عدد المنتجات المتبقية
        const newRemainingProducts = remainingProducts - 1;
        document.getElementById('remainingProducts').value = newRemainingProducts;
        
        // تحديث زر الإضافة
        const submitButton = document.getElementById('submitProductBtn');
        if (newRemainingProducts > 0) {
            submitButton.textContent = `إضافة المنتج (${newRemainingProducts} متبقي)`;
            submitButton.disabled = false;
        } else {
            submitButton.textContent = 'تم الوصول إلى الحد الأقصى';
            submitButton.disabled = true;
        }

        // إعادة تعيين النموذج
        this.reset();
        document.getElementById('imagePreview').innerHTML = '';
        
        // عرض رسالة مناسبة بناءً على دور المستخدم
        if (currentUser?.role === 'admin') {
            alert('تم إضافة المنتج بنجاح وتم عرضه مباشرة في القائمة الرئيسية');
            displayProducts(); // تحديث عرض المنتجات مباشرة
        } else {
            alert('تم إضافة المنتج بنجاح وسيتم مراجعته من قبل المشرف قريباً');
        }
    } catch (error) {
        console.error('خطأ في حفظ المنتج:', error);
        alert(error.message || 'حدث خطأ أثناء حفظ المنتج. يرجى المحاولة مرة أخرى.');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'إضافة المنتج';
    }
});

// تحديث وظيفة عرض المنتجات
function displayProducts() {
    const productsContainer = document.getElementById('productsContainer');
    if (!productsContainer) {
        console.error('عنصر productsContainer غير موجود');
        return;
    }

    // إظهار رسالة التحميل
    productsContainer.innerHTML = '<div class="loading-message">جاري تحميل المنتجات...</div>';

    try {
        const productsRef = dbRef(db, 'products');
        
        dbOnValue(productsRef, (snapshot) => {
            try {
                productsContainer.innerHTML = '';
                
                const data = snapshot.val();
                console.log('بيانات المنتجات المستوردة:', data);

                if (data) {
                    const productsArray = Object.entries(data).map(([id, product]) => ({
                        id,
                        ...product
                    }));
                    
                    // ترتيب المنتجات حسب التاريخ (الأحدث أولاً)
                    productsArray.sort((a, b) => new Date(b.date) - new Date(a.date));
                    
                    // تصفية المنتجات المعتمدة فقط
                    const approvedProducts = productsArray.filter(product => product.status === 'approved');
                    
                    if (approvedProducts.length > 0) {
                        approvedProducts.forEach(product => {
                            try {
                                const productCard = document.createElement('div');
                                productCard.className = 'product-card';
                                
                                // التحقق من صحة رابط الصورة
                                let imageUrl = product.imageUrl;
                                if (!imageUrl || !isValidImageUrl(imageUrl)) {
                                    imageUrl = 'https://via.placeholder.com/300x200?text=صورة+غير+متوفرة';
                                }
                                
                                const cardContent = `
                                    <div class="product-image-container">
                                        <img src="${imageUrl}" 
                                             alt="${product.name || 'منتج بدون اسم'}" 
                                             class="product-image" 
                                             onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=صورة+غير+متوفرة'">
                                    </div>
                                    <div class="product-details">
                                        <div class="product-header">
                                            <h3 class="product-name">${product.name || 'بدون اسم'}</h3>
                                            <div class="product-price">${product.price || 0} دج</div>
                                        </div>
                                        <div class="product-category">
                                            <i class="fas fa-tag"></i>
                                            <span>${getCategoryName(product.category)}</span>
                                        </div>
                                        <div class="product-description">${product.description || 'لا يوجد وصف'}</div>
                                        <div class="product-footer">
                                            <div class="product-contact">
                                                <i class="fas fa-phone"></i>
                                                <span>${product.phone || 'غير متوفر'}</span>
                                            </div>
                                            <div class="product-date">
                                                <i class="far fa-calendar-alt"></i>
                                                <span>${new Date(product.date).toLocaleDateString('ar-EG')}</span>
                                            </div>
                                        </div>
                                    </div>
                                `;
                                
                                productCard.innerHTML = cardContent;
                                productsContainer.appendChild(productCard);
                            } catch (error) {
                                console.error('خطأ في إنشاء بطاقة المنتج:', error);
                            }
                        });
                    } else {
                        productsContainer.innerHTML = `
                            <div class="no-products-message">
                                <i class="fas fa-info-circle"></i>
                                <p>لا توجد منتجات معتمدة متاحة حالياً</p>
                            </div>
                        `;
                    }
                } else {
                    productsContainer.innerHTML = `
                        <div class="no-products-message">
                            <i class="fas fa-info-circle"></i>
                            <p>لا توجد منتجات متاحة حالياً</p>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('خطأ في معالجة البيانات:', error);
                productsContainer.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>حدث خطأ في تحميل المنتجات. يرجى المحاولة مرة أخرى.</p>
                    </div>
                `;
            }
        }, (error) => {
            console.error('خطأ في استيراد البيانات:', error);
            productsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>حدث خطأ في استيراد المنتجات. يرجى المحاولة مرة أخرى.</p>
                </div>
            `;
        });
    } catch (error) {
        console.error('خطأ في تهيئة استيراد البيانات:', error);
        productsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>حدث خطأ في تهيئة استيراد المنتجات. يرجى المحاولة مرة أخرى.</p>
            </div>
        `;
    }
}

// دالة للتحقق من صحة رابط الصورة
function isValidImageUrl(url) {
    if (!url) return false;
    
    // التحقق من أن الرابط يبدأ بـ http أو https
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return false;
    }
    
    // التحقق من أن الرابط ينتهي بامتداد صورة معروف
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
}

// دالة مساعدة لتحويل رمز الفئة إلى اسمها بالعربية
function getCategoryName(category) {
    const categories = {
        'electronics': 'إلكترونيات',
        'clothing': 'ملابس',
        'home': 'منتجات منزلية',
        'beauty': 'مستحضرات تجميل',
        'sports': 'رياضة',
        'books': 'كتب',
        'toys': 'ألعاب',
        'food': 'طعام',
        'other': 'أخرى'
    };
    return categories[category] || category;
}

// وظيفة اعتماد المنتج
function approveProduct(productId) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('ليس لديك صلاحية اعتماد المنتجات');
        return;
    }

    if (!productId) {
        alert('معرف المنتج غير صالح');
        return;
    }

    try {
        const productRef = dbRef(db, `products/${productId}`);
        
        // جلب بيانات المنتج الحالية
        dbOnValue(productRef, (snapshot) => {
            if (!snapshot.exists()) {
                throw new Error('المنتج غير موجود');
            }

            const productData = snapshot.val();
            if (!productData) {
                throw new Error('بيانات المنتج غير صالحة');
            }

            // تحديث حالة المنتج فقط مع الحفاظ على باقي البيانات
            const updatedProduct = {
                ...productData,
                status: 'approved',
                approvedAt: new Date().toISOString(),
                approvedBy: currentUser.email
            };

            // حفظ البيانات المحدثة
            dbSet(productRef, updatedProduct)
                .then(() => {
                    console.log('تم تحديث حالة المنتج بنجاح');
                    
                    // تحديث عرض المنتجات في لوحة التحكم
                    displayAdminProducts();
                    
                    // تحديث عرض المنتجات في الصفحة الرئيسية
                    displayProducts();
                    
                    alert('تم اعتماد المنتج بنجاح');
                })
                .catch(error => {
                    console.error('خطأ في تحديث حالة المنتج:', error);
                    alert(`حدث خطأ أثناء اعتماد المنتج: ${error.message || 'خطأ غير معروف'}`);
                });
        }, (error) => {
            console.error('خطأ في جلب بيانات المنتج:', error);
            alert(`حدث خطأ أثناء جلب بيانات المنتج: ${error.message || 'خطأ غير معروف'}`);
        });
    } catch (error) {
        console.error('خطأ في اعتماد المنتج:', error);
        alert(`حدث خطأ أثناء اعتماد المنتج: ${error.message || 'خطأ غير معروف'}`);
    }
}

// وظيفة رفض المنتج
function rejectProduct(productId) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('ليس لديك صلاحية رفض المنتجات');
        return;
    }

    if (confirm('هل أنت متأكد من رفض هذا المنتج؟ سيتم حذفه نهائياً.')) {
        try {
            const productRef = dbRef(db, `products/${productId}`);
            
            // حذف المنتج من قاعدة البيانات
            dbRemove(productRef)
                .then(() => {
                    console.log('تم حذف المنتج بنجاح');
                    
                    // تحديث عرض المنتجات في لوحة التحكم
                    displayAdminProducts();
                    
                    // تحديث عرض المنتجات في الصفحة الرئيسية
                    displayProducts();
                    
                    alert('تم رفض وحذف المنتج بنجاح');
                })
                .catch(error => {
                    console.error('خطأ في حذف المنتج:', error);
                    alert('حدث خطأ أثناء رفض المنتج');
                });
        } catch (error) {
            console.error('خطأ في رفض المنتج:', error);
            alert('حدث خطأ أثناء رفض المنتج');
        }
    }
}

// Function to display users in admin dashboard
function displayUsers() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;

    const usersRef = dbRef(db, 'users');
    dbOnValue(usersRef, (snapshot) => {
        usersList.innerHTML = '';
        
        const data = snapshot.val();
        if (data) {
            const usersArray = Object.entries(data).map(([id, user]) => ({
                id,
                ...user
            }));
            
            usersArray.forEach(user => {
                const userCard = document.createElement('div');
                userCard.className = 'user-card';
                userCard.innerHTML = `
                    <h3>${user.email}</h3>
                    <div class="user-info">
                        <p>الدور: ${user.role === 'admin' ? 'مشرف' : 'زبون'}</p>
                        <p>تاريخ التسجيل: ${new Date(user.date).toLocaleDateString('ar-EG')}</p>
                        ${user.subscriptionPlan ? `
                            <p>خطة الاشتراك: ${user.subscriptionPlan}</p>
                        ` : ''}
                    </div>
                    <div class="user-actions">
                        ${user.role !== 'admin' ? `
                            <button onclick="makeAdmin('${user.id}')">تعيين كمشرف</button>
                        ` : ''}
                        <button onclick="deleteUser('${user.id}')">حذف المستخدم</button>
                    </div>
                `;
                usersList.appendChild(userCard);
            });
        }
    });
}

// وظيفة حذف المنتج
function deleteProduct(productId) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('ليس لديك صلاحية حذف المنتجات');
        return;
    }

    if (!productId) {
        alert('معرف المنتج غير صالح');
        return;
    }

    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        try {
            const productRef = dbRef(db, `products/${productId}`);
            
            // حذف المنتج من قاعدة البيانات
            dbRemove(productRef)
                .then(() => {
                    console.log('تم حذف المنتج بنجاح');
                    
                    // تحديث عرض المنتجات في لوحة التحكم
                    displayAdminProducts();
                    
                    // تحديث عرض المنتجات في الصفحة الرئيسية
                    displayProducts();
                    
                    alert('تم حذف المنتج بنجاح');
                })
                .catch(error => {
                    console.error('خطأ في حذف المنتج:', error);
                    alert(`حدث خطأ أثناء حذف المنتج: ${error.message || 'خطأ غير معروف'}`);
                });
        } catch (error) {
            console.error('خطأ في حذف المنتج:', error);
            alert(`حدث خطأ أثناء حذف المنتج: ${error.message || 'خطأ غير معروف'}`);
        }
    }
}

// تحديث وظيفة عرض المنتجات في لوحة تحكم المشرف
function displayAdminProducts() {
    const adminProductsList = document.getElementById('adminProductsList');
    if (!adminProductsList) return;

    const productsRef = dbRef(db, 'products');
    dbOnValue(productsRef, (snapshot) => {
        adminProductsList.innerHTML = '';
        pendingProductsCount = 0; // إعادة تعيين العداد
        
        const data = snapshot.val();
        if (data) {
            const productsArray = Object.entries(data).map(([id, product]) => ({
                id,
                ...product
            }));
            
            // ترتيب المنتجات حسب التاريخ (الأحدث أولاً)
            productsArray.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            productsArray.forEach(product => {
                if (product.status === 'pending') {
                    pendingProductsCount++;
                }
                
                const productCard = document.createElement('div');
                productCard.className = 'admin-product-card';
                
                const cardContent = `
                    <div class="product-image-container">
                        <img src="${product.imageUrl}" 
                             alt="${product.name || 'منتج بدون اسم'}" 
                             class="product-image" 
                             onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=صورة+غير+متوفرة'">
                    </div>
                    <div class="product-details">
                        <div class="product-header">
                            <h3 class="product-name">${product.name || 'بدون اسم'}</h3>
                            <div class="product-price">${product.price || 0} دج</div>
                        </div>
                        <div class="product-category">
                            <i class="fas fa-tag"></i>
                            <span>${getCategoryName(product.category)}</span>
                        </div>
                        <div class="product-description">${product.description || 'لا يوجد وصف'}</div>
                        <div class="product-footer">
                            <div class="product-contact">
                                <i class="fas fa-phone"></i>
                                <span>${product.phone || 'غير متوفر'}</span>
                            </div>
                            <div class="product-date">
                                <i class="far fa-calendar-alt"></i>
                                <span>${new Date(product.date).toLocaleDateString('ar-EG')}</span>
                            </div>
                            <div class="product-status">
                                <i class="fas fa-info-circle"></i>
                                <span>${product.status === 'pending' ? 'قيد الانتظار' : 
                                      product.status === 'approved' ? 'معتمد' : 'مرفوض'}</span>
                            </div>
                            <div class="product-seller">
                                <i class="fas fa-user"></i>
                                <span>${product.seller || 'غير معروف'}</span>
                            </div>
                        </div>
                        <div class="admin-actions">
                            ${product.status === 'pending' ? `
                                <button onclick="approveProduct('${product.id}')" class="approve-btn">
                                    <i class="fas fa-check"></i> اعتماد
                                </button>
                                <button onclick="rejectProduct('${product.id}')" class="reject-btn">
                                    <i class="fas fa-times"></i> رفض
                                </button>
                            ` : ''}
                            <button onclick="deleteProduct('${product.id}')" class="delete-btn">
                                <i class="fas fa-trash"></i> حذف
                            </button>
                        </div>
                    </div>
                `;
                
                productCard.innerHTML = cardContent;
                adminProductsList.appendChild(productCard);
            });
            
            // تحديث الإشعار
            updateAdminNotification();
        }
    });
}

// وظيفة تحديث إشعار المشرف
function updateAdminNotification() {
    const notification = document.getElementById('adminNotification');
    if (!notification) return;
    
    if (pendingProductsCount > 0) {
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-bell"></i>
                <span>${pendingProductsCount} منتج في انتظار المراجعة</span>
            </div>
        `;
        notification.style.display = 'block';
        
        // إضافة تأثير الاهتزاز للإشعار
        notification.classList.add('shake');
        setTimeout(() => {
            notification.classList.remove('shake');
        }, 1000);
    } else {
        notification.style.display = 'none';
    }
}

// Function to display feedbacks in admin dashboard
function displayFeedbacks() {
    const feedbackList = document.getElementById('feedbackList');
    if (!feedbackList) return;

    const feedbackRef = dbRef(db, 'feedback');
    dbOnValue(feedbackRef, (snapshot) => {
        feedbackList.innerHTML = '';
        
        const data = snapshot.val();
        if (data) {
            const feedbackArray = Object.entries(data).map(([id, feedback]) => ({
                id,
                ...feedback
            }));
            
            feedbackArray.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            feedbackArray.forEach(feedback => {
                const feedbackCard = document.createElement('div');
                feedbackCard.className = 'feedback-card';
                feedbackCard.innerHTML = `
                    <h3>${feedback.subject}</h3>
                    <div class="feedback-info">
                        <p>من: ${feedback.user}</p>
                        <p>التاريخ: ${new Date(feedback.date).toLocaleDateString('ar-EG')}</p>
                        <p>الحالة: ${getStatusText(feedback.status)}</p>
                    </div>
                    <div class="feedback-message">
                        ${feedback.message}
                    </div>
                    <div class="feedback-actions">
                        ${feedback.status === 'pending' ? `
                            <button onclick="resolveFeedback('${feedback.id}')">حل المشكلة</button>
                            <button onclick="rejectFeedback('${feedback.id}')">رفض التعليق</button>
                        ` : ''}
                        <button onclick="deleteFeedback('${feedback.id}')">حذف التعليق</button>
                    </div>
                `;
                feedbackList.appendChild(feedbackCard);
            });
        }
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
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // جلب معلومات المستخدم من قاعدة البيانات
        const userRef = dbRef(db, `users/${user.uid}`);
        const snapshot = await dbGet(userRef);
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            currentUser = {
                uid: user.uid,
                email: user.email,
                role: userData.role || 'user',
                subscriptionPlan: userData.subscriptionPlan
            };
            
            // إظهار الإشعار إذا كان المستخدم مشرفاً
            if (currentUser.role === 'admin') {
                updateAdminNotification();
            }
            
            // ... باقي الكود كما هو ...
        }
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        alert('فشل تسجيل الدخول: ' + error.message);
    }
});

// تحديث وظيفة البحث عن المنتجات
document.getElementById('mainProductSearch').addEventListener('input', function(e) {
    const searchQuery = e.target.value.toLowerCase();
    const productsContainer = document.getElementById('productsContainer');
    if (!productsContainer) return;

    const productCards = productsContainer.getElementsByClassName('product-card');
    let hasVisibleProducts = false;

    Array.from(productCards).forEach(card => {
        const productName = card.querySelector('.product-name')?.textContent.toLowerCase() || '';
        const productDescription = card.querySelector('.product-description')?.textContent.toLowerCase() || '';
        const productCategory = card.querySelector('.product-category')?.textContent.toLowerCase() || '';

        const isVisible = productName.includes(searchQuery) || 
                        productDescription.includes(searchQuery) || 
                        productCategory.includes(searchQuery);

        card.style.display = isVisible ? '' : 'none';
        if (isVisible) hasVisibleProducts = true;
    });

    // إظهار رسالة إذا لم يتم العثور على نتائج
    const noResultsMessage = document.getElementById('noResultsMessage');
    if (!hasVisibleProducts) {
        if (!noResultsMessage) {
            const message = document.createElement('div');
            message.id = 'noResultsMessage';
            message.className = 'no-products-message';
            message.innerHTML = `
                <i class="fas fa-search"></i>
                <p>لم يتم العثور على منتجات مطابقة للبحث</p>
            `;
            productsContainer.appendChild(message);
        }
    } else if (noResultsMessage) {
        noResultsMessage.remove();
    }
});

// استدعاء وظيفة عرض المنتجات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    displayProducts();
}); 
document.addEventListener('DOMContentLoaded', () => {
    const employeeNameInput = document.getElementById('employeeName');
    const agentSelect = document.getElementById('agentSelect');
    const customerSearchInput = document.getElementById('customerSearch');
    const customerSelect = document.getElementById('customerSelect');
    const productsContainer = document.getElementById('productsContainer');
    const submitBtn = document.getElementById('submitBtn');
    const responseMessage = document.getElementById('responseMessage');

    let agents = [];
    let customers = [];
    let productsByCategory = {}; // ستحتوي على المنتجات مصنفة حسب الفئة

    // URL لـ Google Apps Script Web App (ستحصل عليه بعد النشر)
    const GOOGLE_SHEET_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyv2jGLJ9sbmu4BWuvNCwJDn6LLxuZTTFOo0_A4E5GO8lnFOMV8XknyAEJjmat4Ra97/exec'; 
    // استبدل هذا بالرابط الفعلي لتطبيق الويب الخاص بك

    // ----------------------------------------------------
    // وظائف جلب البيانات من ملفات JSON
    // ----------------------------------------------------
    async function fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching data:', error);
            responseMessage.className = 'error';
            responseMessage.textContent = `فشل في تحميل البيانات: ${error.message}`;
            return url.includes('products.json') ? {} : []; // Return empty object for products, empty array for others
        }
    }

    async function loadAllData() {
        agents = await fetchData('agents.json');
        customers = await fetchData('customers.json');
        productsByCategory = await fetchData('products.json'); // جلب المنتجات حسب الفئة

        populateAgents();
        populateCustomers(customers); // Populate initially with all customers
        renderProducts(); // عرض المنتجات بناءً على الفئات
    }

    // ----------------------------------------------------
    // وظائف بناء الواجهة
    // ----------------------------------------------------

    // تعبئة قائمة المندوبين
    function populateAgents() {
        agentSelect.innerHTML = '<option value="">-- اختر مندوبًا --</option>';
        agents.forEach(agent => {
            const option = document.createElement('option');
            option.value = agent;
            option.textContent = agent;
            agentSelect.appendChild(option);
        });
    }

    // تعبئة قائمة العملاء (مع دعم البحث)
    function populateCustomers(filteredCustomers) {
        customerSelect.innerHTML = ''; // Clear previous options
        if (filteredCustomers.length === 0) {
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "لا يوجد عملاء مطابقون";
            customerSelect.appendChild(option);
            return;
        }
        filteredCustomers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer;
            option.textContent = customer;
            customerSelect.appendChild(option);
        });
    }

    // فلترة قائمة العملاء عند الكتابة في حقل البحث
    customerSearchInput.addEventListener('input', () => {
        const searchTerm = customerSearchInput.value.toLowerCase();
        const filtered = customers.filter(customer =>
            customer.toLowerCase().includes(searchTerm)
        );
        populateCustomers(filtered);
    });

    // عند اختيار عميل من القائمة المنسدلة، ضع اسمه في حقل البحث ليتضح للمستخدم
    customerSelect.addEventListener('change', () => {
        if (customerSelect.value) {
            customerSearchInput.value = customerSelect.value;
        }
    });

    // عرض المنتجات كفئات وأصناف مع خيارات نعم/لا
    function renderProducts() {
        productsContainer.innerHTML = '';
        let productIndexCounter = 0; // لضمان أسماء فريدة لأزرار الراديو عبر الفئات

        for (const category in productsByCategory) {
            if (productsByCategory.hasOwnProperty(category)) {
                const productsInThisCategory = productsByCategory[category];

                const categoryGroup = document.createElement('div');
                categoryGroup.classList.add('category-group');

                const categoryTitle = document.createElement('h3');
                categoryTitle.classList.add('category-title');
                categoryTitle.textContent = category;
                categoryGroup.appendChild(categoryTitle);

                productsInThisCategory.forEach(product => {
                    const productItem = document.createElement('div');
                    productItem.classList.add('product-item');

                    const label = document.createElement('label');
                    label.textContent = product;
                    productItem.appendChild(label);

                    const radioGroup = document.createElement('div');
                    radioGroup.classList.add('radio-group');

                    // استخدام productIndexCounter لإنشاء أسماء وأرقام تعريف فريدة
                    const uniqueName = `product_${productIndexCounter}`;
                    const yesId = `${uniqueName}_yes`;
                    const noId = `${uniqueName}_no`;

                    // زر نعم
                    const yesInput = document.createElement('input');
                    yesInput.type = 'radio';
                    yesInput.id = yesId;
                    yesInput.name = uniqueName; // نفس الاسم للمنتج الواحد
                    yesInput.value = 'Yes';
                    yesInput.required = true;
                    yesInput.dataset.productName = product; // حفظ اسم المنتج في dataset
                    
                    const yesLabel = document.createElement('label');
                    yesLabel.setAttribute('for', yesId);
                    yesLabel.textContent = 'نعم';
                    yesLabel.style.fontWeight = 'normal';
                    yesLabel.style.marginRight = '0'; 

                    // زر لا
                    const noInput = document.createElement('input');
                    noInput.type = 'radio';
                    noInput.id = noId;
                    noInput.name = uniqueName; // نفس الاسم للمنتج الواحد
                    noInput.value = 'No';
                    noInput.required = true;
                    noInput.dataset.productName = product; // حفظ اسم المنتج في dataset

                    const noLabel = document.createElement('label');
                    noLabel.setAttribute('for', noId);
                    noLabel.textContent = 'لا';
                    noLabel.style.fontWeight = 'normal';
                    noLabel.style.marginRight = '0';

                    radioGroup.appendChild(yesInput);
                    radioGroup.appendChild(yesLabel);
                    radioGroup.appendChild(noInput);
                    radioGroup.appendChild(noLabel);

                    productItem.appendChild(radioGroup);
                    categoryGroup.appendChild(productItem);

                    productIndexCounter++; // زيادة العداد لكل منتج
                });
                productsContainer.appendChild(categoryGroup);
            }
        }
    }

    // ----------------------------------------------------
    // وظيفة جمع البيانات وإرسالها
    // ----------------------------------------------------

    submitBtn.addEventListener('click', async () => {
        // التحقق من صحة جميع المدخلات المطلوبة
        if (!employeeNameInput.value || !agentSelect.value || !customerSelect.value) {
            responseMessage.className = 'error';
            responseMessage.textContent = 'الرجاء تعبئة جميع الحقول المطلوبة (اسم الموظف، المندوب، العميل).';
            return;
        }

        const productResponses = {};
        let allProductsAnswered = true;
        
        // جمع كل المنتجات من جميع الفئات
        const allProducts = [];
        for (const category in productsByCategory) {
            if (productsByCategory.hasOwnProperty(category)) {
                allProducts.push(...productsByCategory[category]);
            }
        }

        // التحقق من إجابة كل منتج
        allProducts.forEach((product, index) => {
            // نستخدم dataset.productName للبحث عن الإجابة الصحيحة
            const selectedOption = document.querySelector(`input[data-product-name="${product}"]:checked`);
            if (selectedOption) {
                productResponses[product] = selectedOption.value;
            } else {
                allProductsAnswered = false; // إذا لم يتم الإجابة على أي منتج
            }
        });

        if (!allProductsAnswered) {
            responseMessage.className = 'error';
            responseMessage.textContent = 'الرجاء الإجابة على جميع أسئلة المنتجات (نعم/لا).';
            return;
        }

        const productsAvailable = Object.keys(productResponses).filter(product => productResponses[product] === 'Yes').join(', ');
        const productsNotAvailable = Object.keys(productResponses).filter(product => productResponses[product] === 'No').join(', ');

        const now = new Date();
        const timestampDate = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
        const timestampTime = now.toLocaleTimeString('en-US', { hour12: false }); // HH:MM:SS

        const formData = {
            Timestamp_Date: timestampDate,
            Timestamp_Time: timestampTime,
            Employee_Name: employeeNameInput.value,
            Agent_Name: agentSelect.value,
            Customer_Name: customerSelect.value,
            Products_Available: productsAvailable,
            Products_Not_Available: productsNotAvailable
        };

        console.log('بيانات الإرسال:', formData); // للتأكد من البيانات قبل الإرسال

        try {
            responseMessage.textContent = 'جاري الإرسال...';
            responseMessage.className = '';

            const response = await fetch(GOOGLE_SHEET_WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors', // مهم للسماح بالطلبات العابرة للمجالات بدون تعقيد CORS على جانب الخادم
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(formData).toString(),
            });

            // نظرًا لاستخدام 'no-cors'، لا يمكننا التحقق من response.ok أو قراءة response.json()
            // سنفترض النجاح إذا لم يحدث خطأ شبكة. يمكن التحقق من النجاح بشكل أفضل من خلال
            // استجابة من Google Apps Script نفسها، ولكن يتطلب ذلك إعداد CORS بشكل صحيح.
            // لغرض هذا المثال المبسط، سنعتبر أنه تم الإرسال بنجاح بعد الطلب.

            responseMessage.className = 'success';
            responseMessage.textContent = 'تم إرسال البيانات بنجاح!';
            
            // مسح الحقول بعد الإرسال الناجح
            employeeNameInput.value = '';
            agentSelect.value = '';
            customerSearchInput.value = '';
            customerSelect.innerHTML = ''; // Clear customer select
            populateCustomers(customers); // Repopulate with all customers
            renderProducts(); // Reset product selections

        } catch (error) {
            console.error('خطأ في إرسال البيانات:', error);
            responseMessage.className = 'error';
            responseMessage.textContent = `حدث خطأ أثناء الإرسال: ${error.message}`;
        }
    });

    // تحميل جميع البيانات عند تحميل الصفحة
    loadAllData();
});
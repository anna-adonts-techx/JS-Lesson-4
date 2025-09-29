document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('customer-form');
    const otherSourceGroup = document.getElementById('other-source-group');

    // Helper to get the correct container for error message (.input-wrapper or .form-group)
    const getErrorContainer = (input) => {
        return input.closest('.input-wrapper') || input.closest('.form-group');
    };

    // Helper function to show an error message
    const showError = (input, message) => {
        const container = getErrorContainer(input);
        
        if (container) {
            const errorElement = container.querySelector('.error-message');
            
            // 1. Add 'has-error' to the immediate container (for input border/message)
            container.classList.add('has-error'); 
            
            // 2. ALSO add 'has-error' to the main form-group (for light red background)
            const formGroup = input.closest('.form-group');
            if (formGroup) {
                formGroup.classList.add('has-error');
            }
            
            if (errorElement) errorElement.textContent = message;
        }
    };

    // Helper function to clear an individual error
    const clearError = (input) => {
        const container = getErrorContainer(input);
        const formGroup = input.closest('.form-group');

        if (container) {
            container.classList.remove('has-error');
            const errorElement = container.querySelector('.error-message');
            if (errorElement) errorElement.style.display = 'none'; 
        }
        
        // Only clear the form-group error if NO other input inside it still has an error.
        if (formGroup && !formGroup.querySelector('.input-wrapper.has-error, .form-group > input.has-error, .form-group > select.has-error, .form-group > textarea.has-error')) {
            formGroup.classList.remove('has-error');
        }
    };

    // Helper function to clear all previous errors
    const clearAllErrors = () => {
        document.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    };

    // Show/hide the 'Other' source input field based on selection
    form.elements.source.addEventListener('change', (e) => {
        otherSourceGroup.style.display = e.target.value === 'Other' ? 'block' : 'none';
        if (e.target.value !== 'Other') {
            clearError(form.elements.otherSource);
        }
    });

    // Main validation function
    const validateForm = () => {
        let isValid = true;
        clearAllErrors();

        // 1. Required fields check
        form.querySelectorAll('input[required], select[required], textarea[required]').forEach(input => {
            if (!input.value.trim() || (input.type === 'radio' && !form.querySelector(`input[name="${input.name}"]:checked`))) {
                showError(input, 'This field is required.');
                isValid = false;
            }
        });
        

        // ... existing validation logic ...

        // Remove the radio check. If you need to make the new checkbox group required:
        const recommendGroupInputs = form.querySelectorAll('input[name^="recommend"]');
        if (recommendGroupInputs.length > 0 && !form.querySelector('input[name^="recommend"]:checked')) {
            const recommendGroupContainer = document.getElementById('recommend-group');
            // We use the container (form-group) to show the error
            if (recommendGroupContainer) {
                    recommendGroupContainer.classList.add('has-error');
                    recommendGroupContainer.querySelector('.error-message').textContent = 'Please select at least one option.';
            }
            isValid = false;
        }

        // ... rest of validation logic ...

        // 2. Conditional required field (Other source)
        if (form.elements.source.value === 'Other' && !form.elements.otherSource.value.trim()) {
            showError(form.elements.otherSource, 'Please specify the source.');
            isValid = false;
        }

        // 3. Phone number validation
        const phoneInput = form.elements.phone;
        if (phoneInput.value && !/^[0-9\s()-]+$/.test(phoneInput.value)) {
            showError(phoneInput, 'Phone number can only contain numbers and ()-.');
            isValid = false;
        }

        // 4. Email validation
        const emailInput = form.elements.email;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailInput.value && !emailRegex.test(emailInput.value)) {
            showError(emailInput, 'Please enter a valid e-mail address.');
            isValid = false;
        }
        
        return isValid;
    };

    // Function to get all form data as an object
    const getFormData = () => {
        const formData = {};
        const data = new FormData(form);

        for (const [key, value] of data.entries()) {
             // Skip reference fields that will be handled separately
            if (!key.startsWith('ref')) {
                formData[key] = value;
            }
        }

        // Handle the references table
        formData.references = [];
        const refRows = document.querySelectorAll('.table tbody tr'); 
        refRows.forEach((row, index) => {
            // Use the restored 'name' attributes to get values
            const fullName = row.querySelector(`input[name="refFullName${index + 1}"]`).value.trim();
            const address = row.querySelector(`input[name="refAddress${index + 1}"]`).value.trim();
            const contact = row.querySelector(`input[name="refContact${index + 1}"]`).value.trim();

            if (fullName || address || contact) {
                formData.references.push({
                    fullName: fullName,
                    address: address,
                    contactNumber: contact,
                });
            }
        });

        return formData;
    };
    
    // Function to save data to Local Storage 
    const saveToLocalStorage = (data) => {
        const submissions = JSON.parse(localStorage.getItem('customerSubmissions')) || [];
        submissions.push(data);
        localStorage.setItem('customerSubmissions', JSON.stringify(submissions));
        console.log("Data saved to local storage!");
    };
    
    // Function to show the success modal 
    const showSuccessModal = () => {
        document.getElementById('success-modal').style.display = 'flex';
        setTimeout(() => {
            document.getElementById('success-modal').style.display = 'none';
        },3000); // 3 seconds
    };

    // Handle form submission
    form.addEventListener('submit', (event) => {
        event.preventDefault(); 
        
        if (validateForm()) {
            const formData = getFormData();
            console.log("Form Data Submitted:", formData);
            
            saveToLocalStorage(formData);
            showSuccessModal();
            
            form.reset();
            otherSourceGroup.style.display = 'none';
        } else {
            // Scroll to the first error
            const firstError = form.querySelector('.has-error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });

    // Add event listeners to inputs to clear the error on interaction
    form.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('input', () => clearError(input));
        input.addEventListener('change', () => clearError(input));
    });
});
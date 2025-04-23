// Modals Module

class ModalManager {
    constructor() {
        this.activeModal = null;
        this.init();
    }

    init() {
        // Add modal container to body
        const container = document.createElement('div');
        container.className = 'modals-container';
        document.body.appendChild(container);
        this.container = container;

        // Add event listener for escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.close();
            }
        });
    }

    show(content, options = {}) {
        const {
            title = '',
            onClose = null,
            onConfirm = null,
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            showCancel = true,
            width = '500px'
        } = options;

        // Create modal element
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: ${width}">
                ${title ? `<h3>${title}</h3>` : ''}
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-buttons">
                    ${showCancel ? `
                        <button class="btn-cancel">${cancelText}</button>
                    ` : ''}
                    <button class="btn">${confirmText}</button>
                </div>
            </div>
        `;

        // Add event listeners
        const closeBtn = modal.querySelector('.btn-cancel');
        const confirmBtn = modal.querySelector('.btn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        confirmBtn.addEventListener('click', () => {
            if (onConfirm) {
                onConfirm();
            }
            this.close();
        });

        // Add to container
        this.container.appendChild(modal);

        // Trigger animation
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });

        // Store reference
        this.activeModal = modal;

        // Call onClose when modal is closed
        if (onClose) {
            this.onCloseCallbacks = this.onCloseCallbacks || [];
            this.onCloseCallbacks.push(onClose);
        }
    }

    close() {
        if (!this.activeModal) return;

        // Remove active class
        this.activeModal.classList.remove('active');

        // Remove after animation
        setTimeout(() => {
            this.activeModal.remove();
            this.activeModal = null;

            // Call onClose callbacks
            if (this.onCloseCallbacks) {
                this.onCloseCallbacks.forEach(callback => callback());
                this.onCloseCallbacks = [];
            }
        }, 300);
    }

    // Helper method to create form modal
    showForm(title, fields, onSubmit, options = {}) {
        const formContent = `
            <form class="modal-form">
                ${fields.map(field => `
                    <div class="form-group">
                        <label>${field.label}</label>
                        ${field.type === 'textarea' 
                            ? `<textarea name="${field.name}" ${field.required ? 'required' : ''}></textarea>`
                            : `<input type="${field.type}" name="${field.name}" ${field.required ? 'required' : ''}>`
                        }
                    </div>
                `).join('')}
            </form>
        `;

        this.show(formContent, {
            title,
            onConfirm: () => {
                const form = document.querySelector('.modal-form');
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                onSubmit(data);
            },
            ...options
        });
    }
}

// Create global modal manager instance
const modals = new ModalManager();

// Export modal manager
export default modals; 
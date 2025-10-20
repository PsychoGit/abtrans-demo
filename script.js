// Language Management System
class LanguageManager {
    constructor() {
        this.currentLang = localStorage.getItem('selectedLanguage') || 'en';
        this.translations = null; // Will be loaded asynchronously
        this.init();
    }

    async loadTranslations() {
        try {
            console.log('Attempting to fetch translations...');
            const response = await fetch('translations.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Successfully fetched translations:', data);
            this.translations = data;
            // Re-apply language after translations are loaded
            console.log('Applying initial language:', this.currentLang);
            this.applyLanguage(this.currentLang);
            // Set up the custom language selector dropdown AFTER translations are loaded
            this.setupCustomLanguageSelectorDropdown();
        } catch (error) {
            console.error('Could not load translations:', error);
            // Fallback to a minimal set of translations if fetch fails
            this.translations = {
                en: {
                    nav: { home: "Home", about: "About Us", services: "Services", location: "Location", contact: "Contact" },
                    hero: { title: "Reliable Transportation", subtitle: "For Your Business", description: "Professional trucking services", cta: "Get In Touch" },
                    about: { title: "About A B Transport", paragraph1: "Error loading content.", paragraph2: "Please refresh the page.", years: "Years Experience", fleet: "Vehicle Fleet", delivery: "On-Time Delivery" },
                    services: { title: "Our Services", freight: { title: "Freight Transportation", description: "Reliable services." }, local: { title: "Local Delivery", description: "Fast and efficient." }, warehouse: { title: "Warehouse Logistics", description: "Comprehensive solutions." }, insured: { title: "Insured Shipments", description: "Fully insured." } },
                    footer: { company: "A B Transport", description: "Your trusted partner.", quickLinks: "Quick Links", contactInfo: "Contact Info", copyright: "© {year} A B Transport. All rights reserved." }
                }
            };
            console.log('Applying fallback language:', this.currentLang);
            this.applyLanguage(this.currentLang);
            // Set up the custom language selector dropdown even in fallback mode
            this.setupCustomLanguageSelectorDropdown();
        }
    }

    init() {
        // Load translations from external file
        this.loadTranslations();

        // Set up the standard (hidden) language selector
        this.setupLanguageSelector();
        
        // Update document language
        document.documentElement.lang = this.currentLang;
    }

    setupLanguageSelector() {
        const selector = document.getElementById('languageSelect');
        if (selector) {
            selector.value = this.currentLang;
            selector.addEventListener('change', (e) => {
                this.switchLanguage(e.target.value);
            });
        }
    }

    setupCustomLanguageSelectorDropdown() {
        // Capture the correct 'this' context (the LanguageManager instance)
        const self = this; 
        const customSelects = document.querySelectorAll('.custom-select');
        
        customSelects.forEach(customSelect => {
            const selectSelected = customSelect.querySelector('.select-selected');
            const selectItems = customSelect.querySelector('.select-items');
            const selectItemElements = customSelect.querySelectorAll('.select-item');
            
            // Toggle dropdown
            selectSelected.addEventListener('click', function(e) {
                e.stopPropagation();
                closeAllSelects(this);
                selectItems.classList.toggle('select-hide');
            });
            
            // Handle item selection
            selectItemElements.forEach(item => {
                item.addEventListener('click', function(e) {
                    e.stopPropagation();
                    
                    const value = this.getAttribute('data-value');
                    const flagSrc = this.querySelector('.flag-icon').src;
                    const text = this.querySelector('span').textContent;
                    
                    // Update selected display
                    selectSelected.querySelector('.flag-icon').src = flagSrc;
                    selectSelected.querySelector('span').textContent = text; // Corrected selector from '.span' to 'span'
                    
                    // Close dropdown
                    selectItems.classList.add('select-hide');
                    
                    // Switch language using the captured context
                    if (self) {
                        self.switchLanguage(value);
                    }
                });
            });
        });
        
        // Close all dropdowns when clicking outside
        document.addEventListener('click', closeAllSelects);
        
        function closeAllSelects(exceptThis) {
            const selectItems = document.querySelectorAll('.select-items');
            const selectSelected = document.querySelectorAll('.select-selected');
            
            selectItems.forEach(selectItem => {
                if (exceptThis && exceptThis.nextElementSibling === selectItem) {
                    return;
                }
                selectItem.classList.add('select-hide');
            });
        }
    }

    switchLanguage(lang) {
        console.log(`Switching language to: ${lang}`);
        this.currentLang = lang;
        localStorage.setItem('selectedLanguage', lang);
        console.log('Current translations object:', this.translations); // Log the state of translations
        this.applyLanguage(lang);
        document.documentElement.lang = lang;
        
        // Update typing animation for hero title
        this.restartTypingAnimation();
    }

    applyLanguage(lang) {
        console.log(`Applying language: ${lang}. Current translations:`, this.translations);
        // Don't apply if translations haven't loaded yet
        if (!this.translations) {
            console.warn('Translations not yet loaded. Retrying in 100ms...');
            setTimeout(() => this.applyLanguage(lang), 100);
            return;
        }

        const elements = document.querySelectorAll('[data-translate]');
        console.log(`Found ${elements.length} elements to translate.`);
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.getTranslation(key, lang);
            if (translation) {
                console.log(`Translating element with key "${key}" to: "${translation}"`);
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translation;
                } else {
                    // Handle HTML content in translations (like <br> tags)
                    if (translation.includes('<')) {
                        element.innerHTML = translation;
                    } else {
                        element.textContent = translation;
                    }
                }
            } else {
                console.warn(`No translation found for key: ${key} in language: ${lang}`);
            }
        });

        // Update form placeholders
        this.updateFormPlaceholders(lang);
        
        // Update copyright year
        this.updateCopyrightYear();
    }

    getTranslation(key, lang) {
        const keys = key.split('.');
        let value = this.translations[lang];
        
        for (const k of keys) {
            if (value && value[k] !== undefined) {
                value = value[k];
            } else {
                console.warn(`Translation not found for key: ${key} in language: ${lang}`);
                return null;
            }
        }
        
        return value;
    }

    restartTypingAnimation() {
        const typingElement = document.querySelector('.typing-text');
        if (typingElement) {
            // Remove animation
            typingElement.classList.remove('typing-animation');
            
            // Force reflow
            typingElement.offsetHeight;
            
            // Get current text
            const currentText = this.getTranslation('hero.title', this.currentLang) || 'Reliable Transportation';
            typingElement.textContent = '';
            
            // Start smooth typing animation
            this.typeText(typingElement, currentText, 100);
        }
    }

    typeText(element, text, speed = 100) {
        let i = 0;
        element.classList.add('typing-animation');
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else {
                // Add cursor blink after typing is complete
                element.style.borderRight = '3px solid white';
                element.style.animation = 'blink 1s infinite';
            }
        }
        
        // Clear any existing content and start typing
        element.textContent = '';
        element.style.borderRight = 'none';
        element.style.animation = 'none';
        type();
    }

    updateFormPlaceholders(lang) {
        const formInputs = document.querySelectorAll('input[placeholder], textarea[placeholder]');
        formInputs.forEach(input => {
            const translateKey = input.getAttribute('data-translate');
            if (translateKey) {
                const translation = this.getTranslation(translateKey, lang);
                if (translation) {
                    input.placeholder = translation;
                }
            }
        });
    }

    updateCopyrightYear() {
        const copyrightElement = document.querySelector('[data-translate="footer.copyright"]');
        if (copyrightElement) {
            const currentYear = new Date().getFullYear();
            const translation = this.getTranslation('footer.copyright', this.currentLang);
            if (translation) {
                copyrightElement.textContent = translation.replace('{year}', currentYear);
            }
        }
    }
}

// Initialize Language Manager
const languageManager = new LanguageManager();

// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Header scroll effect
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.boxShadow = 'var(--shadow)';
    }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 70;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Contact Form Handling
const contactForm = document.getElementById('contactForm');
const successMessage = document.createElement('div');
successMessage.className = 'success-message';
contactForm.parentNode.insertBefore(successMessage, contactForm);

contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(this);
    const name = formData.get('name');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const subject = formData.get('subject');
    const message = formData.get('message');
    
    // Basic validation
    if (!name || !email || !subject || !message) {
        alert(languageManager.getTranslation('contact.validation.required', languageManager.currentLang) || 'Please fill in all required fields.');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert(languageManager.getTranslation('contact.validation.email', languageManager.currentLang) || 'Please enter a valid email address.');
        return;
    }
    
    // Simulate form submission (in real implementation, this would be an API call)
    const submitButton = this.querySelector('.submit-button');
    const originalText = submitButton.textContent;
    
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;
    
    setTimeout(() => {
        // Show success message
        const successText = languageManager.getTranslation('contact.success', languageManager.currentLang) || 'Thank you for your message! We\'ll get back to you soon.';
        successMessage.textContent = successText;
        successMessage.classList.add('show');
        
        // Reset form
        this.reset();
        
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
        // Hide success message after 5 seconds
        setTimeout(() => {
            successMessage.classList.remove('show');
        }, 5000);
        
        // Log form data (in real implementation, this would be sent to a server)
        console.log('Form submitted with data:', {
            name,
            email,
            phone,
            subject,
            message,
            language: languageManager.currentLang
        });
    }, 1500);
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Add fade-in class to elements and observe them
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.service-card, .stat, .about-text, .location-info, .contact-info, .contact-form');
    
    animatedElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
});

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('.hero');
    const speed = scrolled * 0.5;
    
    if (parallax) {
        parallax.style.transform = `translateY(${speed}px)`;
    }
});

// Active navigation highlighting
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-menu a');

window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// Add loading animation to images
document.querySelectorAll('img').forEach(img => {
    img.addEventListener('load', function() {
        this.style.opacity = '0';
        this.style.transition = 'opacity 0.5s ease-in-out';
        setTimeout(() => {
            this.style.opacity = '1';
        }, 100);
    });
});

// Counter animation for stats
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    function updateCounter() {
        start += increment;
        if (start < target) {
            element.textContent = Math.floor(start);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    }
    
    updateCounter();
}

// Trigger counter animation when stats section is visible
const statsSection = document.querySelector('.stats');
const statsObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
            entry.target.classList.add('animated');
            const statNumbers = entry.target.querySelectorAll('h3');
            
            statNumbers.forEach(stat => {
                const text = stat.textContent;
                // Handle special cases like "10+" or "98%"
                if (text.includes('+')) {
                    const number = parseInt(text);
                    if (!isNaN(number)) {
                        animateCounter(stat, number);
                        setTimeout(() => {
                            stat.textContent = text;
                        }, 2000);
                    }
                } else if (text.includes('%')) {
                    const number = parseInt(text);
                    if (!isNaN(number)) {
                        animateCounter(stat, number);
                        setTimeout(() => {
                            stat.textContent = text;
                        }, 2000);
                    }
                } else {
                    const number = parseInt(text);
                    if (!isNaN(number)) {
                        animateCounter(stat, number);
                    }
                }
            });
        }
    });
}, { threshold: 0.5 });

if (statsSection) {
    statsObserver.observe(statsSection);
}

// Add ripple effect to buttons
document.querySelectorAll('.cta-button, .submit-button, .social-link').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
    .cta-button, .submit-button, .social-link {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Enhanced truck animation with random speeds
const truck = document.querySelector('.truck');
if (truck) {
    function randomizeTruckSpeed() {
        const baseSpeed = 8; // seconds
        const variation = 4; // seconds variation
        const randomSpeed = baseSpeed + Math.random() * variation;
        truck.style.animationDuration = randomSpeed + 's';
    }
    
    randomizeTruckSpeed();
    setInterval(randomizeTruckSpeed, 20000); // Change speed every 20 seconds
}

// Add keyboard navigation support
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Close mobile menu if open
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

// Performance optimization: Debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debounce to scroll event listeners
const debouncedScrollHandler = debounce(() => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.boxShadow = 'var(--shadow)';
    }
    
    // Update active navigation
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
}, 10);

window.addEventListener('scroll', debouncedScrollHandler);

// Export language manager for global access (if needed)
window.languageManager = languageManager;

        // ========================================
        // APPLICATION LOGIC
        // ========================================

        let aiTools = []; // Will be loaded from JSON file
        let learningResources = []; // Will be loaded from JSON file
        let currentCategory = 'all';
        let searchTerm = '';
        let currentSection = 'tools'; // 'tools' or 'learn'

        // Load tools data from JSON file
        async function loadToolsData() {
            try {
                const response = await fetch('tools.json');
                if (!response.ok) {
                    throw new Error('Failed to load tools data');
                }
                aiTools = await response.json();
            } catch (error) {
                console.error('Error loading tools data:', error);
                // Fallback: show error message
                const grid = document.getElementById('toolsGrid');
                grid.innerHTML = '<div style="text-align: center; color: white; padding: 40px;">Error loading tools data. Please try refreshing the page.</div>';
            }
        }

        // Load learning resources from JSON file
        async function loadLearningData() {
            try {
                const response = await fetch('learning.json');
                if (!response.ok) {
                    throw new Error('Failed to load learning data');
                }
                learningResources = await response.json();
            } catch (error) {
                console.error('Error loading learning data:', error);
                // Fallback: show error message
                const grid = document.getElementById('learnGrid');
                grid.innerHTML = '<div style="text-align: center; color: white; padding: 40px;">Error loading learning resources. Please try refreshing the page.</div>';
            }
        }

        // Initialize the app
        async function init() {
            await Promise.all([loadToolsData(), loadLearningData()]);
            renderCategories();
            renderFavorites();
            renderAllTools();
            renderLearnCategories();
            renderLearningResources();
            updateStats();
            setupEventListeners();
        }

        // Get unique categories from tools
        function getCategories() {
            const categories = [...new Set(aiTools.map(tool => tool.category))];
            return categories.sort();
        }

        // Render category pills
        function renderCategories() {
            const container = document.getElementById('categoriesContainer');
            const categories = getCategories();

            // Keep the "All Tools" pill and add others
            categories.forEach(category => {
                const pill = document.createElement('div');
                pill.className = 'category-pill';
                pill.dataset.category = category;
                pill.textContent = formatCategoryName(category);
                container.appendChild(pill);
            });
        }

        // Format category names for display
        function formatCategoryName(category) {
            return category.split('-').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
        }

        // Render favorites section
        function renderFavorites() {
            const grid = document.getElementById('favoritesGrid');

            // Get favorite tools
            let favoriteTools = aiTools.filter(tool => tool.personal_favourite === 'yes');

            // Apply category and search filters
            if (currentCategory !== 'all') {
                favoriteTools = favoriteTools.filter(tool => tool.category === currentCategory);
            }

            if (searchTerm) {
                favoriteTools = favoriteTools.filter(tool =>
                    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    tool.category.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            // Clear grid
            grid.innerHTML = '';

            // Add favorite tools to grid with staggered animation
            favoriteTools.forEach((tool, index) => {
                const card = createToolCard(tool);
                card.style.animationDelay = `${index * 0.05}s`;
                grid.appendChild(card);
            });
        }

        // Render all tools section
        function renderAllTools() {
            const grid = document.getElementById('toolsGrid');
            const emptyState = document.getElementById('emptyState');

            // Get non-favorite tools
            let allTools = aiTools.filter(tool => tool.personal_favourite === 'no');

            // Apply category and search filters
            if (currentCategory !== 'all') {
                allTools = allTools.filter(tool => tool.category === currentCategory);
            }

            if (searchTerm) {
                allTools = allTools.filter(tool =>
                    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    tool.category.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            // Clear grid
            grid.innerHTML = '';

            if (allTools.length === 0 && aiTools.filter(tool => tool.personal_favourite === 'yes').filter(tool => {
                if (currentCategory !== 'all' && tool.category !== currentCategory) return false;
                if (searchTerm && !(
                    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    tool.category.toLowerCase().includes(searchTerm.toLowerCase())
                )) return false;
                return true;
            }).length === 0) {
                emptyState.style.display = 'block';
                return;
            } else {
                emptyState.style.display = 'none';
            }

            // Add tools to grid with staggered animation
            allTools.forEach((tool, index) => {
                const card = createToolCard(tool);
                card.style.animationDelay = `${index * 0.05}s`;
                grid.appendChild(card);
            });
        }

        // Create a tool card element
        function createToolCard(tool) {
            const card = document.createElement('div');
            card.className = 'tool-card';

            card.innerHTML = `
                <div class="tool-header">
                    <div class="tool-icon">${tool.icon}</div>
                    <div class="tool-info">
                        <div class="tool-name">${tool.name}</div>
                        <span class="tool-category">${formatCategoryName(tool.category)}</span>
                    </div>
                </div>
                <div class="tool-description">${tool.description}</div>
                <div class="tool-footer">
                    <span class="pricing-badge ${tool.pricing}">
                        ${tool.pricing === 'free' ? '✨ Free' :
                          tool.pricing === 'paid' ? '💎 Paid' :
                          '🎯 Freemium'}
                    </span>
                    <a href="${tool.link}" target="_blank" class="tool-link">
                        Visit →
                    </a>
                </div>
            `;

            // Add pricing note as tooltip if available
            if (tool.pricingNote) {
                const pricingBadge = card.querySelector('.pricing-badge');
                pricingBadge.title = tool.pricingNote;
            }

            return card;
        }

        // Get unique learning categories from resources
        function getLearningCategories() {
            const categories = [...new Set(learningResources.map(resource => resource.category))];
            return categories.sort();
        }

        // Render learning category pills
        function renderLearnCategories() {
            const container = document.getElementById('learnCategoriesContainer');
            const categories = getLearningCategories();

            // Keep the "All Resources" pill and add others
            categories.forEach(category => {
                const pill = document.createElement('div');
                pill.className = 'category-pill';
                pill.dataset.category = category;
                pill.textContent = formatCategoryName(category);
                container.appendChild(pill);
            });
        }

        // Render learning resources
        function renderLearningResources() {
            const grid = document.getElementById('learnGrid');
            const emptyState = document.getElementById('learnEmptyState');

            // Filter resources based on category and search
            let filteredResources = learningResources;

            if (currentCategory !== 'all') {
                filteredResources = filteredResources.filter(resource => resource.category === currentCategory);
            }

            if (searchTerm) {
                filteredResources = filteredResources.filter(resource =>
                    resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    resource.category.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            // Clear grid
            grid.innerHTML = '';

            if (filteredResources.length === 0) {
                emptyState.style.display = 'block';
                return;
            } else {
                emptyState.style.display = 'none';
            }

            // Add resources to grid with staggered animation
            filteredResources.forEach((resource, index) => {
                const card = createLearningCard(resource);
                card.style.animationDelay = `${index * 0.05}s`;
                grid.appendChild(card);
            });
        }

        // Create a learning resource card element
        function createLearningCard(resource) {
            const card = document.createElement('div');
            card.className = 'learn-card';

            card.innerHTML = `
                <div class="learn-header-info">
                    <div class="learn-icon">${resource.icon}</div>
                    <div class="learn-info">
                        <div class="learn-name">${resource.name}</div>
                        <div class="learn-meta">
                            <span class="difficulty-badge ${resource.difficulty}">${resource.difficulty}</span>
                            <span class="type-badge">${resource.type}</span>
                        </div>
                    </div>
                </div>
                <div class="learn-description">${resource.description}</div>
                <div class="learn-footer">
                    <span class="category-badge">${formatCategoryName(resource.category)}</span>
                    <a href="${resource.link}" target="_blank" class="learn-link">
                        Learn Now →
                    </a>
                </div>
            `;

            return card;
        }

        // Update statistics
        function updateStats() {
            document.getElementById('totalTools').textContent = aiTools.length;
            document.getElementById('freeTools').textContent =
                aiTools.filter(tool => tool.pricing === 'free' || tool.pricing === 'freemium').length;
            document.getElementById('categoriesCount').textContent = getCategories().length;
        }

        // Setup event listeners
        function setupEventListeners() {
            // Navigation
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const section = e.target.dataset.section;

                    // Update active nav link
                    document.querySelectorAll('.nav-link').forEach(navLink => {
                        navLink.classList.remove('active');
                    });
                    e.target.classList.add('active');

                    // Show/hide sections
                    document.querySelectorAll('.page-section').forEach(pageSection => {
                        pageSection.classList.remove('active');
                    });
                    document.getElementById(`${section}-section`).classList.add('active');

                    // Update current section
                    currentSection = section;

                    // Reset search and category when switching sections
                    searchTerm = '';
                    currentCategory = 'all';
                    document.getElementById('searchInput').value = '';
                    document.getElementById('learnSearchInput').value = '';

                    // Reset category pills
                    document.querySelectorAll('.category-pill').forEach(pill => {
                        pill.classList.remove('active');
                    });
                    document.querySelectorAll('.category-pill[data-category="all"]').forEach(pill => {
                        pill.classList.add('active');
                    });

                    // Re-render appropriate content
                    if (section === 'tools') {
                        renderFavorites();
                        renderAllTools();
                    } else if (section === 'learn') {
                        renderLearningResources();
                    }
                });
            });

            // Search functionality for tools
            document.getElementById('searchInput').addEventListener('input', (e) => {
                if (currentSection === 'tools') {
                    searchTerm = e.target.value;
                    renderFavorites();
                    renderAllTools();
                }
            });

            // Search functionality for learning
            document.getElementById('learnSearchInput').addEventListener('input', (e) => {
                if (currentSection === 'learn') {
                    searchTerm = e.target.value;
                    renderLearningResources();
                }
            });

            // Category filter for tools
            document.getElementById('categoriesContainer').addEventListener('click', (e) => {
                if (e.target.classList.contains('category-pill') && currentSection === 'tools') {
                    // Remove active class from all pills
                    document.querySelectorAll('#categoriesContainer .category-pill').forEach(pill => {
                        pill.classList.remove('active');
                    });

                    // Add active class to clicked pill
                    e.target.classList.add('active');

                    // Update current category and re-render
                    currentCategory = e.target.dataset.category;
                    renderFavorites();
                    renderAllTools();
                }
            });

            // Category filter for learning
            document.getElementById('learnCategoriesContainer').addEventListener('click', (e) => {
                if (e.target.classList.contains('category-pill') && currentSection === 'learn') {
                    // Remove active class from all pills
                    document.querySelectorAll('#learnCategoriesContainer .category-pill').forEach(pill => {
                        pill.classList.remove('active');
                    });

                    // Add active class to clicked pill
                    e.target.classList.add('active');

                    // Update current category and re-render
                    currentCategory = e.target.dataset.category;
                    renderLearningResources();
                }
            });
        }

        // Initialize app when DOM is loaded
        document.addEventListener('DOMContentLoaded', init);
        // ========================================
        // APPLICATION LOGIC
        // ========================================

        let aiTools = []; // Will be loaded from JSON file
        let learningResources = []; // Will be loaded from JSON file
        let mcpServers = []; // Will be loaded from JSON file
        let currentDataset = 'tools';
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
            await Promise.all([loadToolsData(), loadLearningData(), loadMcpData()]);
            renderCategories();
            renderFavorites();
            renderAllTools();
            renderLearnCategories();
            renderLearningResources();
            renderMcpCategories();
            renderMcpServers();
            updateStats();
            setupEventListeners();
            setupAdmin();
        }

        // Load MCP servers from JSON file
        async function loadMcpData() {
            try {
                const response = await fetch('mcp.json');
                if (!response.ok) {
                    throw new Error('Failed to load MCP servers');
                }
                mcpServers = await response.json();
            } catch (error) {
                console.error('Error loading MCP servers:', error);
                const grid = document.getElementById('mcpGrid');
                grid.innerHTML = '<div style="text-align: center; color: white; padding: 40px;">Error loading MCP servers. Please try refreshing the page.</div>';
            }
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

            // Clear existing non-ALL pills
            Array.from(container.querySelectorAll('.category-pill'))
                .forEach(p => { if (p.dataset.category !== 'all') p.remove(); });

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

            Array.from(container.querySelectorAll('.category-pill'))
                .forEach(p => { if (p.dataset.category !== 'all') p.remove(); });

            categories.forEach(category => {
                const pill = document.createElement('div');
                pill.className = 'category-pill';
                pill.dataset.category = category;
                pill.textContent = formatCategoryName(category);
                container.appendChild(pill);
            });
        }

        // Get unique MCP categories from servers
        function getMcpCategories() {
            const categories = [...new Set(mcpServers.map(server => server.category))];
            return categories.sort();
        }

        // Render MCP category pills
        function renderMcpCategories() {
            const container = document.getElementById('mcpCategoriesContainer');
            if (!container) return;
            const categories = getMcpCategories();

            Array.from(container.querySelectorAll('.category-pill'))
                .forEach(p => { if (p.dataset.category !== 'all') p.remove(); });

            categories.forEach(category => {
                const pill = document.createElement('div');
                pill.className = 'category-pill';
                pill.dataset.category = category;
                pill.textContent = formatCategoryName(category);
                container.appendChild(pill);
            });
        }

        // Render MCP servers
        function renderMcpServers() {
            const grid = document.getElementById('mcpGrid');
            const emptyState = document.getElementById('mcpEmptyState');
            if (!grid || !emptyState) return;

            let filtered = mcpServers;

            if (currentCategory !== 'all') {
                filtered = filtered.filter(server => server.category === currentCategory);
            }

            if (searchTerm) {
                filtered = filtered.filter(server =>
                    server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    server.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    server.category.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            grid.innerHTML = '';

            if (filtered.length === 0) {
                emptyState.style.display = 'block';
                return;
            } else {
                emptyState.style.display = 'none';
            }

            filtered.forEach((server, index) => {
                const card = createToolCard(server);
                card.style.animationDelay = `${index * 0.05}s`;
                grid.appendChild(card);
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
                    const mcpSearch = document.getElementById('mcpSearchInput');
                    if (mcpSearch) mcpSearch.value = '';
                    const adminStatusEl = document.getElementById('adminStatus');
                    if (adminStatusEl) adminStatusEl.textContent = '';

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
                    } else if (section === 'mcp') {
                        renderMcpServers();
                    } else if (section === 'admin') {
                        updateAdminPreview();
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

            // Search functionality for MCP
            const mcpSearchEl = document.getElementById('mcpSearchInput');
            if (mcpSearchEl) {
                mcpSearchEl.addEventListener('input', (e) => {
                    if (currentSection === 'mcp') {
                        searchTerm = e.target.value;
                        renderMcpServers();
                    }
                });
            }

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

            // Category filter for MCP
            const mcpCat = document.getElementById('mcpCategoriesContainer');
            if (mcpCat) {
                mcpCat.addEventListener('click', (e) => {
                    if (e.target.classList.contains('category-pill') && currentSection === 'mcp') {
                        document.querySelectorAll('#mcpCategoriesContainer .category-pill').forEach(pill => {
                            pill.classList.remove('active');
                        });
                        e.target.classList.add('active');
                        currentCategory = e.target.dataset.category;
                        renderMcpServers();
                    }
                });
            }
        }

        // =====================
        // Admin Setup & Handlers
        // =====================
        function setupAdmin() {
            const datasetSelect = document.getElementById('adminDatasetSelect');
            const openBtn = document.getElementById('adminOpenBtn');
            const saveBtn = document.getElementById('adminSaveBtn');
            const downloadBtn = document.getElementById('adminDownloadBtn');
            const form = document.getElementById('adminForm');

            if (!datasetSelect || !openBtn || !saveBtn || !downloadBtn || !form) return;

            datasetSelect.addEventListener('change', (e) => {
                currentDataset = e.target.value;
                showAdminFieldsForDataset(currentDataset);
                updateAdminPreview();
            });

            openBtn.addEventListener('click', async () => {
                await openJsonFile(currentDataset);
            });

            saveBtn.addEventListener('click', async () => {
                await saveDatasetToFile(currentDataset);
            });

            downloadBtn.addEventListener('click', () => {
                downloadDatasetJson(currentDataset);
            });

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('adminName').value.trim();
                const icon = document.getElementById('adminIcon').value.trim() || '✨';
                const link = document.getElementById('adminLink').value.trim();
                const category = document.getElementById('adminCategory').value.trim() || 'misc';
                const description = document.getElementById('adminDescription').value.trim();

                if (!name || !link || !description) {
                    setAdminStatus('Please fill in required fields (name, link, description).');
                    return;
                }

                if (currentDataset === 'tools') {
                    const pricing = document.getElementById('adminPricing').value;
                    const pricingNote = document.getElementById('adminPricingNote').value.trim();
                    const favourite = document.getElementById('adminFavourite').value;
                    aiTools.push({ name, icon, link, description, pricing, pricingNote, category, personal_favourite: favourite });
                    renderCategories();
                    renderFavorites();
                    renderAllTools();
                    updateStats();
                } else if (currentDataset === 'learn') {
                    const difficulty = document.getElementById('adminDifficulty').value;
                    const type = document.getElementById('adminType').value.trim() || 'article';
                    learningResources.push({ name, icon, link, description, category, difficulty, type });
                    renderLearnCategories();
                    renderLearningResources();
                } else if (currentDataset === 'mcp') {
                    const pricing = document.getElementById('adminPricing').value;
                    mcpServers.push({ name, icon, link, description, category, pricing, personal_favourite: 'no' });
                    renderMcpCategories();
                    renderMcpServers();
                }

                form.reset();
                setAdminStatus('Item added (not yet saved to disk).');
                updateAdminPreview();
            });

            showAdminFieldsForDataset(currentDataset);
            updateAdminPreview();
        }

        function showAdminFieldsForDataset(dataset) {
            const toolFields = document.querySelectorAll('.admin-fields-tools');
            const learnFields = document.querySelectorAll('.admin-fields-learn');
            const mcpFields = document.querySelectorAll('.admin-fields-mcp');

            toolFields.forEach(el => el.style.display = (dataset === 'tools') ? '' : (el.tagName === 'DIV' ? 'none' : 'none'));
            learnFields.forEach(el => el.style.display = (dataset === 'learn') ? '' : 'none');
            mcpFields.forEach(el => el.style.display = (dataset === 'mcp') ? '' : (el.tagName === 'DIV' ? 'none' : 'none'));
        }

        function updateAdminPreview() {
            const preview = document.getElementById('adminPreview');
            if (!preview) return;
            let data = [];
            if (currentDataset === 'tools') data = aiTools;
            if (currentDataset === 'learn') data = learningResources;
            if (currentDataset === 'mcp') data = mcpServers;

            const sample = data.slice(-3);
            const summary = `Items: ${data.length}`;
            const code = JSON.stringify(sample, null, 2);
            preview.innerHTML = `<div class="admin-summary">${summary}</div><pre class="admin-code">${escapeHtml(code)}</pre>`;
        }

        function escapeHtml(str) {
            return str
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;');
        }

        async function openJsonFile(dataset) {
            try {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json,application/json';
                input.style.display = 'none';
                document.body.appendChild(input);
                input.click();
                await new Promise(resolve => input.onchange = resolve);
                const file = input.files && input.files[0];
                input.remove();
                if (!file) return;
                const text = await file.text();
                const json = JSON.parse(text);
                if (!Array.isArray(json)) throw new Error('Invalid JSON format: expected an array');
                if (dataset === 'tools') aiTools = json;
                if (dataset === 'learn') learningResources = json;
                if (dataset === 'mcp') mcpServers = json;
                if (dataset === 'tools') { renderCategories(); renderFavorites(); renderAllTools(); updateStats(); }
                if (dataset === 'learn') { renderLearnCategories(); renderLearningResources(); }
                if (dataset === 'mcp') { renderMcpCategories(); renderMcpServers(); }
                setAdminStatus('JSON loaded from file.');
                updateAdminPreview();
            } catch (err) {
                console.error(err);
                setAdminStatus('Failed to open JSON file.');
            }
        }

        async function saveDatasetToFile(dataset) {
            try {
                const supportsFS = 'showSaveFilePicker' in window;
                const fileName = dataset === 'tools' ? 'tools.json' : (dataset === 'learn' ? 'learning.json' : 'mcp.json');
                const data = dataset === 'tools' ? aiTools : (dataset === 'learn' ? learningResources : mcpServers);
                const content = JSON.stringify(data, null, 4);

                if (supportsFS) {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: fileName,
                        types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }]
                    });
                    const writable = await handle.createWritable();
                    await writable.write(content);
                    await writable.close();
                    setAdminStatus('Saved to disk.');
                } else {
                    // Fallback to download
                    const blob = new Blob([content], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                    setAdminStatus('Downloaded JSON file.');
                }
            } catch (err) {
                console.error(err);
                setAdminStatus('Failed to save file.');
            }
        }

        function downloadDatasetJson(dataset) {
            const fileName = dataset === 'tools' ? 'tools.json' : (dataset === 'learn' ? 'learning.json' : 'mcp.json');
            const data = dataset === 'tools' ? aiTools : (dataset === 'learn' ? learningResources : mcpServers);
            const content = JSON.stringify(data, null, 4);
            const blob = new Blob([content], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            setAdminStatus('Downloaded JSON file.');
        }

        function setAdminStatus(text) {
            const el = document.getElementById('adminStatus');
            if (el) el.textContent = text;
        }

        // Initialize app when DOM is loaded
        document.addEventListener('DOMContentLoaded', init);
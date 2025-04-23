// Health News API Integration
document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const newsContainer = document.getElementById('news-container');
    const newsTemplate = document.getElementById('news-template');
    const loadMoreBtn = document.getElementById('load-more');
    const newsSearch = document.getElementById('news-search');
    const noResults = document.getElementById('no-results');
    const resetSearchBtn = document.getElementById('reset-search');
    const categoryPills = document.querySelectorAll('.category-pill');
    const loadingSpinner = document.querySelector('.news-loading');
    
    // API Configuration
    // Using NewsAPI.org for this example (free tier has limitations)
    // In production, you would use your own API key and proper backend handling
    const NEWS_API_KEY = 'YOUR_API_KEY_HERE'; // Replace with actual API key
    const BASE_URL = 'https://newsapi.org/v2/everything';
    
    // State variables
    let currentPage = 1;
    const pageSize = 9;
    let currentCategory = 'all';
    let currentQuery = 'health';
    let fetchInProgress = false;
    
    // Initialize
    fetchNews();
    
    // Event Listeners
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentPage++;
            fetchNews(false);
        });
    }
    
    if (newsSearch) {
        newsSearch.addEventListener('input', debounce(function() {
            if (this.value.length === 0) {
                currentQuery = 'health';
            } else {
                currentQuery = this.value + ' health';
            }
            currentPage = 1;
            fetchNews(true);
        }, 500));
    }
    
    if (resetSearchBtn) {
        resetSearchBtn.addEventListener('click', () => {
            if (newsSearch) newsSearch.value = '';
            currentQuery = 'health';
            currentCategory = 'all';
            currentPage = 1;
            
            // Reset category pills
            categoryPills.forEach(pill => {
                pill.classList.remove('active');
                if (pill.dataset.category === 'all') {
                    pill.classList.add('active');
                }
            });
            
            fetchNews(true);
        });
    }
    
    // Category selection
    categoryPills.forEach(pill => {
        pill.addEventListener('click', () => {
            // Remove active class from all pills
            categoryPills.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked pill
            pill.classList.add('active');
            
            // Update current category
            currentCategory = pill.dataset.category;
            
            // Reset page and fetch news
            currentPage = 1;
            fetchNews(true);
        });
    });
    
    // Fetch news from API
    function fetchNews(clearExisting = false) {
        if (fetchInProgress) return;
        fetchInProgress = true;
        
        // Show loading spinner
        loadingSpinner.style.display = 'flex';
        
        // Hide no results message
        if (noResults) noResults.style.display = 'none';
        
        // Build query
        let query = currentQuery;
        if (currentCategory !== 'all') {
            query += ' ' + currentCategory;
        }
        
        // In a real application, you would call your own backend to protect your API key
        // For demo purposes, making a direct call to NewsAPI (won't work in production)
        const apiUrl = `${BASE_URL}?q=${encodeURIComponent(query)}&page=${currentPage}&pageSize=${pageSize}&language=en&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
        
        // For this demo, we'll use a mock response instead of actual API call
        // setTimeout simulates API fetch time
        setTimeout(() => {
            const mockResponse = getMockNewsData(query, currentPage, pageSize);
            handleNewsResponse(mockResponse, clearExisting);
        }, 1000);
        
        // In a real application, you would use this fetch call:
        /*
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                handleNewsResponse(data, clearExisting);
            })
            .catch(error => {
                console.error('Error fetching news:', error);
                fetchInProgress = false;
                loadingSpinner.style.display = 'none';
            });
        */
    }
    
    // Handle API response
    function handleNewsResponse(data, clearExisting) {
        // Hide loading spinner
        loadingSpinner.style.display = 'none';
        fetchInProgress = false;
        
        // Clear existing news if needed
        if (clearExisting && newsContainer) {
            newsContainer.innerHTML = '';
        }
        
        // Check if there are articles
        if (data.articles && data.articles.length > 0) {
            // Add news items to container
            data.articles.forEach(article => {
                addNewsItem(article);
            });
            
            // Show/hide load more button based on if there are more results
            if (loadMoreBtn) {
                if (data.articles.length < pageSize) {
                    loadMoreBtn.style.display = 'none';
                } else {
                    loadMoreBtn.style.display = 'flex';
                }
            }
        } else {
            // Show no results message
            if (noResults) noResults.style.display = 'flex';
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        }
    }
    
    // Add a single news item to the container
    function addNewsItem(article) {
        if (!newsContainer || !newsTemplate) return;
        
        // Clone the template
        const newsItem = newsTemplate.content.cloneNode(true);
        
        // Set image
        const imgElement = newsItem.querySelector('.news-image img');
        if (imgElement) {
            if (article.urlToImage) {
                imgElement.src = article.urlToImage;
                imgElement.alt = article.title;
            } else {
                imgElement.src = 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=600&auto=format&fit=crop';
                imgElement.alt = 'Health news placeholder';
            }
        }
        
        // Set category (we'll extract it from the content or source name)
        const categoryElement = newsItem.querySelector('.article-category');
        if (categoryElement) {
            let category = '';
            if (article.content && article.content.toLowerCase().includes('nutrition')) {
                category = 'Nutrition';
            } else if (article.content && article.content.toLowerCase().includes('fitness')) {
                category = 'Fitness';
            } else if (article.content && article.content.toLowerCase().includes('wellness')) {
                category = 'Wellness';
            } else if (article.content && article.content.toLowerCase().includes('medical')) {
                category = 'Medical';
            } else if (article.content && article.content.toLowerCase().includes('research')) {
                category = 'Research';
            } else {
                category = 'Health';
            }
            categoryElement.textContent = category;
        }
        
        // Set title
        const titleElement = newsItem.querySelector('.news-title');
        if (titleElement) {
            titleElement.textContent = article.title;
        }
        
        // Set excerpt
        const excerptElement = newsItem.querySelector('.news-excerpt');
        if (excerptElement) {
            excerptElement.textContent = article.description || 'No description available';
        }
        
        // Set source name
        const sourceElement = newsItem.querySelector('.source-name');
        if (sourceElement) {
            sourceElement.textContent = article.source?.name || 'Unknown Source';
        }
        
        // Set date
        const dateElement = newsItem.querySelector('.date-text');
        if (dateElement) {
            const publishedDate = new Date(article.publishedAt);
            const now = new Date();
            const diffDays = Math.floor((now - publishedDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
                const hours = Math.floor((now - publishedDate) / (1000 * 60 * 60));
                if (hours === 0) {
                    dateElement.textContent = 'Just now';
                } else {
                    dateElement.textContent = `${hours} hour${hours > 1 ? 's' : ''} ago`;
                }
            } else if (diffDays === 1) {
                dateElement.textContent = 'Yesterday';
            } else if (diffDays < 7) {
                dateElement.textContent = `${diffDays} days ago`;
            } else {
                dateElement.textContent = publishedDate.toLocaleDateString();
            }
        }
        
        // Set link
        const linkElement = newsItem.querySelector('.btn-read-more');
        if (linkElement) {
            linkElement.href = article.url;
        }
        
        // Add to container
        newsContainer.appendChild(newsItem);
    }
    
    // Helper function to debounce input events
    function debounce(func, delay) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }
    
    // Mock data for demonstration purposes
    function getMockNewsData(query, page, pageSize) {
        const mockArticles = [
            {
                source: {
                    id: null,
                    name: "Harvard Health"
                },
                author: "Dr. Elizabeth Smith",
                title: "Study Finds Daily Walking Lowers Risk of Heart Disease by 30%",
                description: "New research suggests that walking just 30 minutes daily can significantly reduce your risk of developing cardiovascular disease, with benefits increasing the more you walk.",
                url: "https://example.com/walking-heart-health",
                urlToImage: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=600&auto=format&fit=crop",
                publishedAt: "2023-05-01T09:30:00Z",
                content: "Walking is one of the simplest forms of exercise... nutrition and fitness experts recommend combining daily walks with a balanced diet for optimal heart health."
            },
            {
                source: {
                    id: null,
                    name: "Medical News Today"
                },
                author: "James Wilson",
                title: "Breakthrough in Alzheimer's Research Shows Promise for Early Detection",
                description: "Scientists have developed a new blood test that can detect Alzheimer's disease up to 10 years before symptoms appear, potentially allowing for earlier intervention and better treatment outcomes.",
                url: "https://example.com/alzheimers-research",
                urlToImage: "https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=600&auto=format&fit=crop",
                publishedAt: "2023-05-03T14:15:00Z",
                content: "The new research published in Nature Medicine shows that specific biomarkers in blood can indicate the development of Alzheimer's disease long before cognitive symptoms appear. Medical researchers are optimistic about this breakthrough."
            },
            {
                source: {
                    id: null,
                    name: "Wellness Journal"
                },
                author: "Sarah Johnson",
                title: "Mindfulness Meditation Reduces Anxiety and Depression, Meta-Analysis Confirms",
                description: "A comprehensive review of over 200 studies confirms that regular mindfulness practice can be as effective as medication for treating certain mental health conditions.",
                url: "https://example.com/mindfulness-mental-health",
                urlToImage: "https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?q=80&w=600&auto=format&fit=crop",
                publishedAt: "2023-05-05T11:45:00Z",
                content: "The wellness community has long promoted mindfulness techniques, but this new meta-analysis provides strong scientific evidence. Researchers found that just 10 minutes of daily meditation can produce measurable improvements in mental well-being."
            },
            {
                source: {
                    id: null,
                    name: "Nutrition Science"
                },
                author: "Dr. Michael Chen",
                title: "Mediterranean Diet Linked to Longer Lifespan and Reduced Cancer Risk",
                description: "A 30-year longitudinal study has found that people who closely follow a Mediterranean diet live an average of 4.5 years longer and have a 23% lower risk of developing certain cancers.",
                url: "https://example.com/mediterranean-diet-benefits",
                urlToImage: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=600&auto=format&fit=crop",
                publishedAt: "2023-05-07T08:20:00Z",
                content: "The nutrition study followed over 25,000 participants across three decades. 'The evidence is overwhelming that a diet rich in olive oil, nuts, fresh vegetables, and fatty fish contributes significantly to longevity,' says lead researcher Dr. Chen."
            },
            {
                source: {
                    id: null,
                    name: "Fitness Today"
                },
                author: "Alex Torres",
                title: "High-Intensity Interval Training More Effective Than Traditional Cardio, Study Shows",
                description: "Research comparing different exercise modalities finds that HIIT workouts produce better results in less time compared to steady-state cardio for both weight loss and cardiovascular health.",
                url: "https://example.com/hiit-benefits",
                urlToImage: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=600&auto=format&fit=crop",
                publishedAt: "2023-05-10T16:30:00Z",
                content: "The fitness industry has been promoting HIIT for years, and now science backs it up. The study found that just 20 minutes of high-intensity exercise three times weekly produced better health outcomes than 45 minutes of moderate exercise five times per week."
            },
            {
                source: {
                    id: null,
                    name: "Sleep Research Institute"
                },
                author: "Dr. Jessica Williams",
                title: "Poor Sleep Quality Linked to Increased Risk of Dementia",
                description: "A groundbreaking study reveals that chronic sleep disturbances may increase the risk of developing dementia later in life by up to 40%, highlighting the importance of sleep hygiene.",
                url: "https://example.com/sleep-dementia-link",
                urlToImage: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=600&auto=format&fit=crop",
                publishedAt: "2023-05-12T13:10:00Z",
                content: "Medical researchers have identified several mechanisms by which poor sleep may contribute to cognitive decline. 'We now consider quality sleep to be as important to brain health as diet and exercise,' notes lead sleep scientist Dr. Williams."
            },
            {
                source: {
                    id: null,
                    name: "Preventive Medicine Journal"
                },
                author: "Robert Thompson",
                title: "Vitamin D Supplementation May Reduce Risk of Respiratory Infections",
                description: "A large-scale clinical trial finds that adequate vitamin D levels can boost immune function and reduce the incidence of common respiratory illnesses by up to 25%.",
                url: "https://example.com/vitamin-d-research",
                urlToImage: "https://images.unsplash.com/photo-1584362096155-5c7ba8fabc66?q=80&w=600&auto=format&fit=crop",
                publishedAt: "2023-05-15T10:05:00Z",
                content: "The research emphasizes the importance of nutrition and maintaining proper vitamin D levels, especially during winter months. 'We found that the protective effect was strongest in people who were previously deficient,' says nutrition expert Dr. Lisa Kumar."
            },
            {
                source: {
                    id: null,
                    name: "Sports Medicine"
                },
                author: "Carlos Mendez",
                title: "New Recovery Techniques Help Athletes Prevent Injuries and Extend Careers",
                description: "Innovative approaches combining cryotherapy, targeted strength training, and advanced biomechanics are helping professional athletes recover faster and maintain peak performance longer.",
                url: "https://example.com/athlete-recovery-innovations",
                urlToImage: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=600&auto=format&fit=crop",
                publishedAt: "2023-05-18T15:40:00Z",
                content: "The fitness and sports medicine communities are adopting these techniques rapidly. 'What we're seeing is a revolution in how we approach athletic longevity,' says sports physiologist Dr. Mendez. 'These methods are also beneficial for weekend warriors and casual exercisers.'"
            },
            {
                source: {
                    id: null,
                    name: "Mental Health Foundation"
                },
                author: "Dr. Thomas Wilson",
                title: "Social Connection As Important As Diet and Exercise for Longevity",
                description: "Research examining factors contributing to longevity in blue zones reveals that strong social ties and community integration may be as crucial as physical health habits.",
                url: "https://example.com/social-connection-longevity",
                urlToImage: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=600&auto=format&fit=crop",
                publishedAt: "2023-05-20T12:15:00Z",
                content: "The wellness study examined centenarians across different cultures and found that regular social interaction was a common factor. 'Humans are social creatures, and meaningful connections appear to have profound physiological benefits,' explains lead researcher Dr. Wilson."
            }
        ];
        
        // Filter articles based on query
        let filteredArticles = mockArticles;
        if (query && query !== 'health') {
            const keywords = query.toLowerCase().split(' ');
            filteredArticles = mockArticles.filter(article => {
                const articleText = (article.title + ' ' + article.description + ' ' + article.content).toLowerCase();
                return keywords.some(keyword => articleText.includes(keyword));
            });
        }
        
        // Calculate pagination
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedArticles = filteredArticles.slice(startIndex, endIndex);
        
        // Return mock response in the same format as the real API
        return {
            status: "ok",
            totalResults: filteredArticles.length,
            articles: paginatedArticles
        };
    }
});

// Import Firebase functions
import { subscribeToNewsletter } from './firebase.js';
import notifications from './notifications.js';

// Initialize newsletter subscription functionality
function initNewsletterSubscription() {
    const newsletterForm = document.querySelector('.newsletter-form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get email
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            const email = emailInput.value.trim();
            
            // Basic validation
            if (!email) {
                notifications.error('Please enter a valid email address');
                return;
            }
            
            // Show loading state
            const submitButton = newsletterForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subscribing...';
            submitButton.disabled = true;
            
            try {
                // Subscribe to newsletter
                const result = await subscribeToNewsletter(email);
                
                if (result.success) {
                    // Show success message
                    notifications.success('Successfully subscribed to newsletter!');
                    
                    // Clear form
                    emailInput.value = '';
                } else {
                    // Show error message
                    notifications.error(result.error || 'Failed to subscribe. Please try again.');
                }
            } catch (error) {
                console.error('Newsletter subscription error:', error);
                notifications.error('An unexpected error occurred. Please try again.');
            } finally {
                // Reset button state
                submitButton.innerHTML = originalButtonText;
                submitButton.disabled = false;
            }
        });
    }
}

// Initialize all news page functionality
document.addEventListener('DOMContentLoaded', function() {
    initNewsSearch();
    initNewsCategories();
    fetchNews();
    initNewsletterSubscription();
});

// Ensure functions are initialized at the top
function initNewsSearch() {
    // Implementation for search functionality
    const searchInput = document.getElementById('news-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function(e) {
            const searchQuery = e.target.value.trim().toLowerCase();
            filterNews(searchQuery);
        }, 300));
    }
    
    // Reset search button
    const resetButton = document.getElementById('reset-search');
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            document.getElementById('news-search').value = '';
            resetNewsFilter();
        });
    }
}

function initNewsCategories() {
    // Implementation for category filtering
    const categoryButtons = document.querySelectorAll('.category-pill');
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Filter by category
            const category = this.dataset.category;
            filterNewsByCategory(category);
        });
    });
}

// Helper functions
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

function filterNews(query) {
    // Implementation for filtering news by search query
    const newsCards = document.querySelectorAll('.news-card');
    let foundResults = false;
    
    newsCards.forEach(card => {
        const title = card.querySelector('.news-title').textContent.toLowerCase();
        const excerpt = card.querySelector('.news-excerpt').textContent.toLowerCase();
        const category = card.querySelector('.article-category').textContent.toLowerCase();
        
        if (title.includes(query) || excerpt.includes(query) || category.includes(query)) {
            card.style.display = 'flex';
            foundResults = true;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Show/hide no results message
    document.getElementById('no-results').style.display = foundResults ? 'none' : 'flex';
}

function filterNewsByCategory(category) {
    // Implementation for filtering news by category
    const newsCards = document.querySelectorAll('.news-card');
    let foundResults = false;
    
    newsCards.forEach(card => {
        const cardCategory = card.querySelector('.article-category').textContent.toLowerCase();
        
        if (category === 'all' || cardCategory === category.toLowerCase()) {
            card.style.display = 'flex';
            foundResults = true;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Also clear any search text
    document.getElementById('news-search').value = '';
    
    // Show/hide no results message
    document.getElementById('no-results').style.display = foundResults ? 'none' : 'flex';
}

function resetNewsFilter() {
    // Implementation for resetting filters
    const newsCards = document.querySelectorAll('.news-card');
    newsCards.forEach(card => {
        card.style.display = 'flex';
    });
    
    // Hide no results message
    document.getElementById('no-results').style.display = 'none';
    
    // Reset category pills
    const categoryButtons = document.querySelectorAll('.category-pill');
    categoryButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector('.category-pill[data-category="all"]').classList.add('active');
}

// Function to fetch news from API
async function fetchNews() {
    const newsContainer = document.getElementById('news-container');
    const loadingIndicator = document.querySelector('.news-loading');
    
    if (!newsContainer || !loadingIndicator) return;
    
    try {
        loadingIndicator.style.display = 'flex';
        
        // In a real application, you would fetch from a real API
        // For demonstration, we'll use a timeout to simulate API call
        setTimeout(() => {
            // Hide loading indicator
            loadingIndicator.style.display = 'none';
            
            // Add mock data
            const mockNews = getMockNewsData();
            mockNews.forEach(article => addNewsItem(article));
        }, 1500);
        
    } catch (error) {
        console.error('Error fetching news:', error);
        loadingIndicator.style.display = 'none';
        
        // Show error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'news-error';
        errorMessage.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <p>Failed to load news. Please try again later.</p>
        `;
        newsContainer.appendChild(errorMessage);
    }
}

// Function to add news item to container
function addNewsItem(article) {
    const newsContainer = document.getElementById('news-container');
    const template = document.getElementById('news-template');
    
    if (!newsContainer || !template) return;
    
    // Clone template
    const newsItem = template.content.cloneNode(true);
    
    // Set article data
    newsItem.querySelector('.news-title').textContent = article.title;
    newsItem.querySelector('.news-excerpt').textContent = article.description;
    newsItem.querySelector('.article-category').textContent = article.category;
    newsItem.querySelector('.source-name').textContent = article.source.name;
    newsItem.querySelector('.date-text').textContent = formatDate(article.publishedAt);
    newsItem.querySelector('.btn-read-more').href = article.url;
    
    // Set image
    const imgElement = newsItem.querySelector('.news-image img');
    if (imgElement) {
        if (article.urlToImage) {
            imgElement.src = article.urlToImage;
            imgElement.alt = article.title;
        } else {
            imgElement.src = 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=600&auto=format&fit=crop';
            imgElement.alt = 'Health news placeholder';
        }
    }
    
    // Add to container
    newsContainer.appendChild(newsItem);
}

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    
    // Check if valid date
    if (isNaN(date.getTime())) return 'Unknown';
    
    // Calculate difference in days
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        // Format as MM/DD/YYYY
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    }
}

// Mock data for development
function getMockNewsData() {
    return [
        {
            title: "New Study Links Mediterranean Diet to Longer Lifespan",
            description: "Researchers have found that following a Mediterranean diet rich in olive oil, nuts, and fish may add years to your life expectancy.",
            category: "Nutrition",
            source: { name: "Health Journal" },
            publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            url: "#",
            urlToImage: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=600&auto=format&fit=crop"
        },
        {
            title: "The Benefits of High-Intensity Interval Training",
            description: "HIIT workouts can burn more calories in less time compared to steady-state cardio, according to fitness experts.",
            category: "Fitness",
            source: { name: "Fitness Today" },
            publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            url: "#",
            urlToImage: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=600&auto=format&fit=crop"
        },
        {
            title: "Mindfulness Meditation May Reduce Inflammation, Study Finds",
            description: "Regular mindfulness practice could help reduce inflammation markers in the body, potentially lowering risk for various chronic diseases.",
            category: "Wellness",
            source: { name: "Mind & Body" },
            publishedAt: new Date().toISOString(), // Today
            url: "#",
            urlToImage: "https://images.unsplash.com/photo-1536623975707-c4b3b2af565d?q=80&w=600&auto=format&fit=crop"
        },
        {
            title: "FDA Approves New Treatment for Type 2 Diabetes",
            description: "A groundbreaking new medication that improves insulin sensitivity has been approved for treatment of Type 2 diabetes patients.",
            category: "Medical",
            source: { name: "Medical News" },
            publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
            url: "#",
            urlToImage: "https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=600&auto=format&fit=crop"
        },
        {
            title: "Sleep Quality May Be More Important Than Quantity",
            description: "New research suggests that the quality of sleep, rather than just the number of hours, plays a crucial role in cognitive function and overall health.",
            category: "Wellness",
            source: { name: "Sleep Science" },
            publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
            url: "#",
            urlToImage: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=600&auto=format&fit=crop"
        },
        {
            title: "Breakthrough in Alzheimer's Research Offers Hope",
            description: "Scientists have identified a new biomarker that could lead to earlier diagnosis and more effective treatments for Alzheimer's disease.",
            category: "Research",
            source: { name: "Science Daily" },
            publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
            url: "#",
            urlToImage: "https://images.unsplash.com/photo-1559757175-7b21291b407e?q=80&w=600&auto=format&fit=crop"
        }
    ];
} 
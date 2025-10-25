/**
 * ============================================
 * CRAWL QUEUE - PARALLEL PROCESSING SYSTEM
 * ============================================
 * 
 * This module provides a queue-based system for parallel crawling
 * Benefits:
 * - Crawl multiple pages simultaneously (faster)
 * - Better resource management
 * - Rate limiting control
 * - Priority queue support
 * 
 * NOTE: This is an OPTIONAL enhancement. The intelligentCrawler.js
 * works fine without this, but this makes it MUCH faster for large sites.
 */

const { smartCrawl } = require('./intelligentCrawler');

// ============================================
// CONFIGURATION
// ============================================

const QUEUE_CONFIG = {
    MAX_CONCURRENT: 5, // Maximum parallel requests
    RATE_LIMIT_DELAY: 1000, // Delay between batches (ms)
    MAX_RETRIES: 2,
    PRIORITY_LEVELS: {
        HIGH: 1,
        NORMAL: 2,
        LOW: 3
    }
};

// ============================================
// CRAWL QUEUE CLASS
// ============================================

class CrawlQueue {
    constructor(options = {}) {
        this.maxConcurrent = options.maxConcurrent || QUEUE_CONFIG.MAX_CONCURRENT;
        this.rateLimitDelay = options.rateLimitDelay || QUEUE_CONFIG.RATE_LIMIT_DELAY;
        
        this.queue = []; // Pending URLs to crawl
        this.active = new Map(); // Currently crawling URLs
        this.completed = new Map(); // Completed URLs with results
        this.failed = new Map(); // Failed URLs with errors
        
        this.isRunning = false;
        this.isPaused = false;
        this.browser = null; // Shared Puppeteer browser instance
        
        // Statistics
        this.stats = {
            totalQueued: 0,
            totalCompleted: 0,
            totalFailed: 0,
            startTime: null,
            endTime: null
        };
        
        // Event callbacks
        this.onComplete = null;
        this.onError = null;
        this.onProgress = null;
    }
    
    // ==================
    // QUEUE MANAGEMENT
    // ==================
    
    /**
     * Add URL to queue
     */
    add(url, options = {}) {
        const priority = options.priority || QUEUE_CONFIG.PRIORITY_LEVELS.NORMAL;
        const depth = options.depth || 0;
        const parentUrl = options.parentUrl || null;
        
        // Check if already processed
        if (this.completed.has(url) || this.failed.has(url) || this.active.has(url)) {
            return false;
        }
        
        // Check if already in queue
        if (this.queue.some(item => item.url === url)) {
            return false;
        }
        
        this.queue.push({
            url,
            priority,
            depth,
            parentUrl,
            retries: 0,
            addedAt: Date.now()
        });
        
        this.stats.totalQueued++;
        
        // Sort by priority
        this.queue.sort((a, b) => a.priority - b.priority);
        
        return true;
    }
    
    /**
     * Add multiple URLs at once
     */
    addBatch(urls, options = {}) {
        let added = 0;
        urls.forEach(url => {
            if (this.add(url, options)) {
                added++;
            }
        });
        return added;
    }
    
    /**
     * Get next URL from queue
     */
    getNext() {
        if (this.queue.length === 0) return null;
        return this.queue.shift();
    }
    
    /**
     * Check if queue is empty
     */
    isEmpty() {
        return this.queue.length === 0 && this.active.size === 0;
    }
    
    /**
     * Get queue size
     */
    size() {
        return {
            pending: this.queue.length,
            active: this.active.size,
            completed: this.completed.size,
            failed: this.failed.size
        };
    }
    
    // ==================
    // CRAWLING LOGIC
    // ==================
    
    /**
     * Process a single URL
     */
    async processUrl(item) {
        const { url, depth, parentUrl, retries } = item;
        
        this.active.set(url, {
            ...item,
            startedAt: Date.now()
        });
        
        try {
            console.log(`[QUEUE] 🔄 Processing (${this.active.size}/${this.maxConcurrent}): ${url}`);
            
            // Crawl the URL
            const result = await smartCrawl(url, this.browser);
            
            // Store result
            this.completed.set(url, {
                ...result,
                url,
                depth,
                parentUrl,
                completedAt: Date.now()
            });
            
            this.stats.totalCompleted++;
            this.active.delete(url);
            
            // Emit progress event
            if (this.onProgress) {
                this.onProgress(this.getProgress());
            }
            
            // Emit complete event
            if (this.onComplete) {
                this.onComplete(url, result);
            }
            
            return result;
            
        } catch (error) {
            console.error(`[QUEUE] ❌ Error processing ${url}:`, error.message);
            
            // Retry logic
            if (retries < QUEUE_CONFIG.MAX_RETRIES) {
                console.log(`[QUEUE] 🔁 Retrying ${url} (attempt ${retries + 1}/${QUEUE_CONFIG.MAX_RETRIES})`);
                
                // Re-add to queue with increased retry count
                this.queue.unshift({
                    ...item,
                    retries: retries + 1,
                    priority: QUEUE_CONFIG.PRIORITY_LEVELS.HIGH // Prioritize retries
                });
            } else {
                // Max retries exceeded
                this.failed.set(url, {
                    url,
                    error: error.message,
                    depth,
                    parentUrl,
                    retries,
                    failedAt: Date.now()
                });
                
                this.stats.totalFailed++;
                
                if (this.onError) {
                    this.onError(url, error);
                }
            }
            
            this.active.delete(url);
        }
    }
    
    /**
     * Process queue with parallel execution
     */
    async processQueue() {
        while (!this.isEmpty() && !this.isPaused) {
            // Get available slots
            const availableSlots = this.maxConcurrent - this.active.size;
            
            if (availableSlots <= 0) {
                // Wait for some to complete
                await new Promise(resolve => setTimeout(resolve, 100));
                continue;
            }
            
            // Get next batch of URLs
            const batch = [];
            for (let i = 0; i < availableSlots && this.queue.length > 0; i++) {
                const item = this.getNext();
                if (item) batch.push(item);
            }
            
            if (batch.length === 0) {
                // No more items in queue, wait for active to complete
                if (this.active.size > 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                continue;
            }
            
            // Process batch in parallel
            const promises = batch.map(item => this.processUrl(item));
            
            // Wait for batch to complete (or fail)
            await Promise.allSettled(promises);
            
            // Rate limiting delay between batches
            if (this.queue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
            }
        }
    }
    
    /**
     * Start processing the queue
     */
    async start(browser = null) {
        if (this.isRunning) {
            console.log('[QUEUE] ⚠️  Queue is already running');
            return;
        }
        
        this.isRunning = true;
        this.isPaused = false;
        this.stats.startTime = Date.now();
        this.browser = browser;
        
        console.log('[QUEUE] 🚀 Starting queue processing...');
        console.log(`[QUEUE] 📊 Max concurrent: ${this.maxConcurrent}, Rate limit: ${this.rateLimitDelay}ms`);
        
        await this.processQueue();
        
        this.isRunning = false;
        this.stats.endTime = Date.now();
        
        const duration = (this.stats.endTime - this.stats.startTime) / 1000;
        console.log(`[QUEUE] ✅ Queue processing completed in ${duration.toFixed(2)}s`);
        
        return this.getResults();
    }
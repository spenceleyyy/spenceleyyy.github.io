document.addEventListener('DOMContentLoaded', () => {
    const longUrlInput = document.getElementById('long-url');
    const customAliasInput = document.getElementById('custom-alias');
    const shortenerService = document.getElementById('shortener-service');
    const shortenBtn = document.getElementById('shorten-url');
    const shortenedOutput = document.getElementById('shortened-output');
    const shortenedPlaceholder = document.getElementById('shortened-placeholder');
    const shortenedResult = document.getElementById('shortened-result');
    const shortenedUrlDisplay = document.getElementById('shortened-url-display');
    const copyBtn = document.getElementById('copy-shortened');

    // Enable/disable custom alias based on service
    if (shortenerService && customAliasInput) {
        shortenerService.addEventListener('change', () => {
            if (shortenerService.value === 'isgd') {
                customAliasInput.disabled = false;
            } else {
                customAliasInput.disabled = true;
                customAliasInput.value = '';
            }
        });
    }

    // Shorten URL
    if (shortenBtn) {
        shortenBtn.addEventListener('click', async () => {
            const longUrl = longUrlInput.value.trim();
            
            if (!longUrl) {
                alert('Please enter a URL');
                return;
            }

            // Basic URL validation
            try {
                new URL(longUrl);
            } catch {
                alert('Please enter a valid URL (must start with http:// or https://)');
                return;
            }

            shortenBtn.disabled = true;
            shortenBtn.innerHTML = '<span>Shortening...</span>';

            const service = shortenerService.value;
            const customAlias = customAliasInput.value.trim();

            try {
                let shortUrl = '';

                if (service === 'tinyurl') {
                    shortUrl = await shortenWithTinyURL(longUrl);
                } else if (service === 'isgd') {
                    shortUrl = await shortenWithIsGd(longUrl, customAlias);
                }

                // Show result
                shortenedPlaceholder.style.display = 'none';
                shortenedResult.style.display = 'block';
                shortenedUrlDisplay.textContent = shortUrl;
                shortenedUrlDisplay.dataset.url = shortUrl;

            } catch (error) {
                alert('Error shortening URL: ' + error.message);
            } finally {
                shortenBtn.disabled = false;
                shortenBtn.innerHTML = '<span>Shorten URL</span>';
            }
        });
    }

    async function shortenWithTinyURL(url) {
        const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error('TinyURL service error');
        return await response.text();
    }

    async function shortenWithIsGd(url, customAlias = '') {
        let apiUrl = `https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`;
        if (customAlias) {
            apiUrl += `&shorturl=${encodeURIComponent(customAlias)}`;
        }
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.errorcode) {
            throw new Error(data.errormessage || 'is.gd service error');
        }
        
        return data.shorturl;
    }

    // Copy to clipboard
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const url = shortenedUrlDisplay.dataset.url;
            navigator.clipboard.writeText(url).then(() => {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<span>✓ Copied!</span>';
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                }, 2000);
            });
        });
    }
});
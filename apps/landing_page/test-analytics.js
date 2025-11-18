// Simple test script to verify analytics endpoint
async function testAnalytics() {
    const baseUrl = 'http://localhost:8788';

    try {
        // Test analytics endpoint
        const response = await fetch(`${baseUrl}/api/analytics`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event: 'test_event',
                category: 'testing',
                label: 'kv_setup_test',
                timestamp: Date.now(),
                url: 'http://localhost:8788',
                userAgent: 'Test Script',
                referrer: ''
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ Analytics endpoint working!');
            console.log('📊 Test event stored in KV successfully');
        } else {
            console.log('❌ Analytics endpoint failed:', result);
        }

        // Test main page
        const pageResponse = await fetch(`${baseUrl}/`);
        if (pageResponse.ok) {
            console.log('✅ Landing page accessible!');
        } else {
            console.log('❌ Landing page failed:', pageResponse.status);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('💡 Make sure to run "npx wrangler dev" first');
    }
}

// Run the test
testAnalytics();

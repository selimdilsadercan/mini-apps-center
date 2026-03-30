import axios from "axios";

const TEST_URL = "https://www.youtube.com/shorts/np6wl6y_pNg"; // Test için bir URL

async function testYouTubeScraper(url: string) {
  try {
    console.log("🚀 Testing YouTube Shorts scraper...\n");
    console.log("📱 URL:", url);

    // YouTube oEmbed API
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;

    console.log("\n🔍 Fetching from oEmbed API...");
    
    const response = await axios.get(oembedUrl, {
      timeout: 10000,
    });

    console.log("\n✅ Response received:");
    console.log(JSON.stringify(response.data, null, 2));

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    return {
      success: false,
      error: error.message,
    };
  }
}

// Gerçek bir YouTube Shorts URL'i ile test edin
const testUrl = "https://www.youtube.com/shorts/np6wl6y_pNg"; // Rick Astley örneği
testYouTubeScraper(testUrl)
  .then(() => {
    console.log("\n✅ Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });

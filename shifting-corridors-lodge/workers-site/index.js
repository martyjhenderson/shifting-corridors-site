// Worker script for serving static assets with support for hashed filenames
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    console.log(`Request for: ${url.pathname}`);
    
    // Check if __STATIC_CONTENT exists
    if (!env.__STATIC_CONTENT) {
      return new Response("Error: __STATIC_CONTENT binding is missing", { 
        status: 500,
        headers: { "Content-Type": "text/plain" }
      });
    }
    
    try {
      // List all keys in KV storage
      const listResult = await env.__STATIC_CONTENT.list();
      const keys = listResult.keys.map(k => k.name);
      console.log("Available keys:", keys);
      
      // Function to find a key by prefix
      const findKeyByPrefix = (prefix) => {
        return keys.find(key => key.startsWith(prefix));
      };
      
      // Handle static files
      if (url.pathname.startsWith('/static/') || 
          url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|json|txt)$/)) {
        
        // Remove leading slash for KV lookup
        const pathWithoutSlash = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
        
        // Try to find the key with the path as prefix
        const key = findKeyByPrefix(pathWithoutSlash.split('.')[0]);
        
        if (key) {
          console.log(`Found matching key for ${pathWithoutSlash}: ${key}`);
          const asset = await env.__STATIC_CONTENT.get(key, "arrayBuffer");
          
          // Determine content type
          let contentType = "text/plain";
          if (key.endsWith(".html")) contentType = "text/html";
          else if (key.endsWith(".css")) contentType = "text/css";
          else if (key.endsWith(".js")) contentType = "application/javascript";
          else if (key.endsWith(".json")) contentType = "application/json";
          else if (key.endsWith(".png")) contentType = "image/png";
          else if (key.endsWith(".jpg") || key.endsWith(".jpeg")) contentType = "image/jpeg";
          else if (key.endsWith(".gif")) contentType = "image/gif";
          else if (key.endsWith(".ico")) contentType = "image/x-icon";
          else if (key.endsWith(".txt")) contentType = "text/plain";
          
          return new Response(asset, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=31536000"
            }
          });
        } else {
          console.log(`No matching key found for ${pathWithoutSlash}`);
        }
      }
      
      // For all other routes, serve index.html
      // Find the index.html key (it will have a hash in the name)
      const indexKey = findKeyByPrefix("index.");
      
      if (indexKey) {
        console.log(`Found index.html key: ${indexKey}`);
        const indexHtml = await env.__STATIC_CONTENT.get(indexKey, "text");
        
        return new Response(indexHtml, {
          headers: {
            "Content-Type": "text/html",
            "Cache-Control": "public, max-age=3600"
          }
        });
      } else {
        console.error("No index.html key found");
        return new Response(`index.html not found. Available keys: ${keys.join(", ")}`, { 
          status: 404,
          headers: { "Content-Type": "text/plain" }
        });
      }
    } catch (e) {
      console.error(`Error handling request: ${e.message}`);
      return new Response(`Error: ${e.message}\n${e.stack}`, { 
        status: 500,
        headers: { "Content-Type": "text/plain" }
      });
    }
  }
};
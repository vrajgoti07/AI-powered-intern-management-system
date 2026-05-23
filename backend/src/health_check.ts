import http from 'http';

http.get('http://localhost:5000/api/v1/health', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("Health check response status:", res.statusCode);
    console.log("Health check response body:", data);
  });
}).on('error', (err) => {
  console.error("Health check request failed:", err);
});

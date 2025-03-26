const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const server = http.createServer((req, res) => {
    // Parse the URL and decode the path
    const parsedUrl = url.parse(req.url, true);
    let filePath = decodeURIComponent(parsedUrl.pathname);
    
    console.log('Requested URL:', req.url);
    console.log('Decoded path:', filePath);
    
    // Handle root path
    if (filePath === '/') {
        filePath = '/Cursor Modification/portals/login.html';
    }

    // Remove leading slash and add current directory
    filePath = '.' + filePath;
    console.log('Full file path:', filePath);

    // Get the file extension
    const extname = path.extname(filePath);

    // Set content type based on file extension
    let contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.ico':
            contentType = 'image/x-icon';
            break;
    }

    // Read the file
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // File not found
                console.log('File not found:', filePath);
                fs.readFile('./Cursor Modification/portals/404.html', (error, content) => {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                });
            } else {
                // Server error
                console.error('Server error:', error);
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            // Success
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const PORT = 8000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('Press Ctrl+C to stop the server');
}); 
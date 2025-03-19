const express = require('express');
const cors = require('cors');
const { EmailService } = require('./email-service');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize email service
const emailService = new EmailService();

// Middleware
app.use(cors());
app.use(express.json());

// Email sending endpoint
app.post('/api/send-invoice', async (req, res) => {
    try {
        const { to, invoice, organization } = req.body;

        if (!to || !invoice || !organization) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields' 
            });
        }

        const result = await emailService.sendInvoiceEmail(to, invoice, organization);
        
        res.json({ 
            success: true, 
            message: 'Invoice sent successfully',
            result 
        });
    } catch (error) {
        console.error('Error sending invoice:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
    console.log(`Email service running on port ${port}`);
}); 
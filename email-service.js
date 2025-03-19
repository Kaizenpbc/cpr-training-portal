const sgMail = require('@sendgrid/mail');
const PDFDocument = require('pdfkit');

class EmailService {
    constructor() {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }

    async sendInvoiceEmail(to, invoice, organization) {
        try {
            const html = this.generateInvoiceEmailHtml(invoice, organization);
            const pdfBuffer = await this.generateInvoicePDF(invoice, organization);

            const msg = {
                to,
                from: process.env.EMAIL_FROM,
                subject: `Invoice ${invoice.id} - GTA CPR`,
                html,
                attachments: [
                    {
                        content: pdfBuffer.toString('base64'),
                        filename: `invoice-${invoice.id}.pdf`,
                        type: 'application/pdf',
                        disposition: 'attachment'
                    }
                ]
            };

            const response = await sgMail.send(msg);
            return response;
        } catch (error) {
            console.error('Error in sendInvoiceEmail:', error);
            throw error;
        }
    }

    generateInvoiceEmailHtml(invoice, organization) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .invoice-details { margin-bottom: 30px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
                    th { background-color: #f5f5f5; }
                    .total { font-weight: bold; }
                    .footer { margin-top: 30px; text-align: center; font-size: 0.9em; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>GTA CPR</h1>
                        <p>Invoice ${invoice.id}</p>
                    </div>

                    <div class="invoice-details">
                        <p><strong>To:</strong> ${organization.name}</p>
                        <p><strong>Attention:</strong> ${invoice.attention}</p>
                        <p><strong>Address:</strong> ${organization.address}</p>
                        <p><strong>Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                        <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoice.lineItems.map(item => `
                                <tr>
                                    <td>${new Date(item.date).toLocaleDateString()}</td>
                                    <td>${item.description}</td>
                                    <td>$${item.amount.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                            <tr>
                                <td colspan="2"><strong>Subtotal</strong></td>
                                <td>$${invoice.subtotal.toFixed(2)}</td>
                            </tr>
                            ${invoice.discount ? `
                                <tr>
                                    <td colspan="2"><strong>Discount (${invoice.discountPercentage}%)</strong></td>
                                    <td>$${invoice.discount.toFixed(2)}</td>
                                </tr>
                            ` : ''}
                            <tr class="total">
                                <td colspan="2"><strong>Total</strong></td>
                                <td>$${invoice.totalAmount.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="payment-terms">
                        <h3>Payment Terms</h3>
                        <p>${invoice.paymentTerms}</p>
                    </div>

                    <div class="footer">
                        <p>Thank you for your business!</p>
                        <p>If you have any questions, please don't hesitate to contact us.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    async generateInvoicePDF(invoice, organization) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument();
                const chunks = [];

                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));

                // Add content to PDF
                doc.fontSize(20).text('GTA CPR', { align: 'center' });
                doc.moveDown();
                doc.fontSize(16).text(`Invoice ${invoice.id}`, { align: 'center' });
                doc.moveDown();

                // Organization details
                doc.fontSize(12).text(organization.name);
                doc.text(`Attention: ${invoice.attention}`);
                doc.text(organization.address);
                doc.moveDown();

                // Invoice details
                doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`);
                doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`);
                doc.moveDown();

                // Line items
                let y = doc.y;
                doc.text('Date', 50, y);
                doc.text('Description', 150, y);
                doc.text('Amount', 400, y);
                y += 20;

                invoice.lineItems.forEach(item => {
                    doc.text(new Date(item.date).toLocaleDateString(), 50, y);
                    doc.text(item.description, 150, y);
                    doc.text(`$${item.amount.toFixed(2)}`, 400, y);
                    y += 20;
                });

                // Totals
                y += 10;
                doc.text('Subtotal:', 300, y);
                doc.text(`$${invoice.subtotal.toFixed(2)}`, 400, y);
                y += 20;

                if (invoice.discount) {
                    doc.text(`Discount (${invoice.discountPercentage}%):`, 300, y);
                    doc.text(`$${invoice.discount.toFixed(2)}`, 400, y);
                    y += 20;
                }

                doc.font('Helvetica-Bold');
                doc.text('Total:', 300, y);
                doc.text(`$${invoice.totalAmount.toFixed(2)}`, 400, y);
                doc.font('Helvetica');

                // Payment terms
                doc.moveDown(2);
                doc.text('Payment Terms:', 50, doc.y);
                doc.text(invoice.paymentTerms, 50, doc.y + 10);

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = { EmailService }; 
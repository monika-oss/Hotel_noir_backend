const { Resend } = require('resend');
const twilio = require('twilio');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Helper: Load latest .env config
const loadEnvConfig = () => {
  const envPath = path.resolve(__dirname, '../.env');
  let envConfig = { ...process.env };
  if (fs.existsSync(envPath)) {
    const parsed = dotenv.parse(fs.readFileSync(envPath));
    envConfig = { ...envConfig, ...parsed };
  }
  return envConfig;
};

const sendOrderConfirmation = async (order) => {
  const envConfig = loadEnvConfig();

  console.log('📧 Starting notification process for order:', order._id);
  
  const orderItemsText = order.items.map(i => `- ${i.quantity}x ${i.title} ($${i.price})`).join('\n');
  const totalAmount = order.totalAmount.toFixed(2);
  const messageBody = `*New Order - NOIR & GOLD*\n\n*Name:* ${order.customerName}\n*Table/Address:* ${order.tableNumber}\n*Phone:* ${order.phone}\n\n*Items:*\n${orderItemsText}\n\n*Total:* $${totalAmount}`;

  // 1. Send Email using Resend API (bypasses Render SMTP block)
  if (envConfig.RESEND_API_KEY) {
    try {
      const resend = new Resend(envConfig.RESEND_API_KEY);
      
      const { data, error } = await resend.emails.send({
        from: 'Noir & Gold <onboarding@resend.dev>', // Resend testing email
        to: [envConfig.ADMIN_EMAIL], // Only sending to Admin on free tier testing
        subject: `Order Confirmation - ${order.customerName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a2e; color: #eee;">
            <h1 style="color: #d4af37; text-align: center;">NOIR & GOLD</h1>
            <h2 style="color: #d4af37;">New Order Received</h2>
            <p><strong>Customer Name:</strong> ${order.customerName}</p>
            <p><strong>Table/Address:</strong> ${order.tableNumber}</p>
            <p><strong>Phone:</strong> ${order.phone}</p>
            <hr style="border-color: #d4af37;" />
            <h3 style="color: #d4af37;">Items:</h3>
            <ul>${order.items.map(i => `<li>${i.quantity}x ${i.title} - $${i.price}</li>`).join('')}</ul>
            <hr style="border-color: #d4af37;" />
            <h3 style="color: #d4af37;">Total: $${totalAmount}</h3>
          </div>
        `
      });

      if (error) {
        console.error('❌ Resend API Error:', error);
      } else {
        console.log('✅ Order confirmation email sent via Resend API! ID:', data.id);
      }
    } catch (emailError) {
      console.error('❌ Error executing Resend:', emailError.message);
    }
  } else {
    console.log('⚠️ Skipping Email: RESEND_API_KEY not configured in environment');
  }

  // 2. Send WhatsApp to Admin (Twilio)
  if (envConfig.TWILIO_ACCOUNT_SID && envConfig.TWILIO_ACCOUNT_SID !== 'your_twilio_sid') {
    try {
      const twilioClient = twilio(envConfig.TWILIO_ACCOUNT_SID, envConfig.TWILIO_AUTH_TOKEN);
      const message = await twilioClient.messages.create({
        body: messageBody,
        from: envConfig.TWILIO_WHATSAPP_NUMBER,
        to: envConfig.ADMIN_WHATSAPP_NUMBER
      });
      console.log('✅ WhatsApp sent. SID:', message.sid);
    } catch (waError) {
      console.error('❌ Error sending WhatsApp:', waError.message);
    }
  }
};

const sendOrderCompletedNotification = async (order) => {
  const envConfig = loadEnvConfig();

  if (envConfig.RESEND_API_KEY) {
    try {
      const resend = new Resend(envConfig.RESEND_API_KEY);
      
      const { data, error } = await resend.emails.send({
        from: 'Noir & Gold <onboarding@resend.dev>',
        to: [envConfig.ADMIN_EMAIL], // Customer email sending restricted on free tier without verified domain
        subject: `Your Order is Ready! - Noir & Gold`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a2e; color: #eee;">
            <h1 style="color: #d4af37; text-align: center;">NOIR & GOLD</h1>
            <h2 style="color: #d4af37;">Your Order is Ready! 🎉</h2>
            <p>Hi ${order.customerName},</p>
            <p>Great news! Your order is now <strong style="color: #4CAF50;">COMPLETED</strong> and ready.</p>
            <p>Thank you for dining with Noir & Gold.</p>
          </div>
        `
      });

      if (error) {
        console.error('❌ Resend API Error:', error);
      } else {
        console.log('✅ Completion email sent via Resend!');
      }
    } catch (emailError) {
      console.error('❌ Error sending completion Email:', emailError.message);
    }
  }
};

const testNotifications = async () => {
  console.log('Test function temporarily disabled');
};

module.exports = {
  sendOrderConfirmation,
  sendOrderCompletedNotification,
  testNotifications
};

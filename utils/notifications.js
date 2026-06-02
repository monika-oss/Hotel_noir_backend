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

// EmailJS Config
const EMAILJS_SERVICE_ID = 'service_05yfaao'; // User's Service ID
const EMAILJS_TEMPLATE_ID = 'template_z27i8ur'; // User's Template ID
const EMAILJS_PUBLIC_KEY = 'FDZD0SLFS6FK9rZYP'; // User's Public Key

const sendOrderConfirmation = async (order) => {
  const envConfig = loadEnvConfig();
  console.log('📧 Starting notification process for order:', order._id);
  
  const orderItemsText = order.items.map(i => `- ${i.quantity}x ${i.title} ($${i.price})`).join('\n');
  const totalAmount = order.totalAmount.toFixed(2);
  const messageBody = `*New Order - NOIR & GOLD*\n\n*Name:* ${order.customerName}\n*Table/Address:* ${order.tableNumber}\n*Phone:* ${order.phone}\n\n*Items:*\n${orderItemsText}\n\n*Total:* $${totalAmount}`;

  // 1. Send Email to CUSTOMER using EmailJS
  try {
    const templateParams = {
      // Custom variables in case they copied my template
      to_email: order.email,
      customer_name: order.customerName,
      order_items: orderItemsText,
      total_amount: totalAmount,
      // Default variables in case they kept the default EmailJS template
      email: order.email,
      order_id: order._id.toString(),
      orders: order.items.map(i => ({ name: i.title, price: i.price, units: i.quantity }))
    };

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: templateParams
      })
    });

    if (response.ok) {
      console.log('✅ Order confirmation email sent to CUSTOMER via EmailJS!');
    } else {
      const errText = await response.text();
      console.error('❌ EmailJS API Error:', errText);
    }
  } catch (emailError) {
    console.error('❌ Error executing EmailJS:', emailError.message);
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
  console.log('📧 Sending order completion notification for order:', order._id);
  
  try {
    const templateParams = {
      to_email: order.email,
      customer_name: order.customerName,
      order_items: 'Your order is now COMPLETED and ready!',
      total_amount: order.totalAmount.toFixed(2),
      email: order.email,
      order_id: order._id.toString(),
      orders: []
    };

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: templateParams
      })
    });

    if (response.ok) {
      console.log('✅ Completion email sent to CUSTOMER via EmailJS!');
    } else {
      console.error('❌ EmailJS API Error:', await response.text());
    }
  } catch (emailError) {
    console.error('❌ Error sending completion Email:', emailError.message);
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

const nodemailer = require('nodemailer');
const twilio = require('twilio');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const sendOrderConfirmation = async (order) => {
  try {
    // Dynamically load latest .env without needing a server restart
    const envPath = path.resolve(__dirname, '../.env');
    let envConfig = process.env;
    if (fs.existsSync(envPath)) {
      const parsed = dotenv.parse(fs.readFileSync(envPath));
      envConfig = { ...process.env, ...parsed };
    }

    const orderItemsText = order.items.map(i => `- ${i.quantity}x ${i.title} ($${i.price})`).join('\n');
    const totalAmount = order.totalAmount.toFixed(2);
    
    const messageBody = `*New Order - NOIR & GOLD*\n\n*Name:* ${order.customerName}\n*Table/Address:* ${order.tableNumber}\n*Phone:* ${order.phone}\n\n*Items:*\n${orderItemsText}\n\n*Total:* $${totalAmount}`;

    // 1. Send Email to Customer & Admin
    if (envConfig.EMAIL_USER && envConfig.EMAIL_USER !== 'your_email@gmail.com') {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: envConfig.EMAIL_USER,
            pass: envConfig.EMAIL_PASS
          }
        });
        const mailOptions = {
          from: `"Noir & Gold" <${envConfig.EMAIL_USER}>`,
          to: `${order.email}, ${envConfig.ADMIN_EMAIL}`,
          subject: `Order Confirmation - ${order.customerName}`,
          text: messageBody.replace(/\*/g, '') 
        };
        await transporter.sendMail(mailOptions);
        console.log('✅ Order confirmation email sent');
      } catch (emailError) {
        console.error('❌ Error sending Email:', emailError.message);
      }
    } else {
      console.log('⚠️ Skipping Email: Dummy credentials found');
    }

    // 2. Send WhatsApp to Admin
    if (envConfig.TWILIO_ACCOUNT_SID && envConfig.TWILIO_ACCOUNT_SID !== 'your_twilio_sid') {
      try {
        const twilioClient = twilio(envConfig.TWILIO_ACCOUNT_SID, envConfig.TWILIO_AUTH_TOKEN);
        await twilioClient.messages.create({
          body: messageBody,
          from: envConfig.TWILIO_WHATSAPP_NUMBER,
          to: envConfig.ADMIN_WHATSAPP_NUMBER
        });
        console.log('✅ Order confirmation WhatsApp sent to Admin');
      } catch (waError) {
        console.error('❌ Error sending WhatsApp:', waError.message);
      }
    } else {
      console.log('⚠️ Skipping WhatsApp: Dummy Twilio credentials found');
    }
  } catch (error) {
    console.error('❌ Error sending notifications:', error.message);
  }
};

module.exports = {
  sendOrderConfirmation
};

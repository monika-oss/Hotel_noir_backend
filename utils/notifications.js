const nodemailer = require('nodemailer');
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

// Helper: Create and verify email transporter
const createEmailTransporter = async (envConfig) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: envConfig.EMAIL_USER,
      pass: envConfig.EMAIL_PASS
    }
  });

  // Verify the connection before sending
  try {
    await transporter.verify();
    console.log('✅ Email transporter verified successfully');
    return transporter;
  } catch (verifyError) {
    console.error('❌ Email transporter verification failed:', verifyError.message);
    console.error('💡 Make sure EMAIL_PASS is a Gmail App Password (not your regular password)');
    console.error('💡 Go to: https://myaccount.google.com/apppasswords to generate one');
    return null;
  }
};

const sendOrderConfirmation = async (order) => {
  const envConfig = loadEnvConfig();

  console.log('📧 Starting notification process for order:', order._id);
  console.log('📧 Customer email:', order.email);
  console.log('📧 Admin email:', envConfig.ADMIN_EMAIL);

  const orderItemsText = order.items.map(i => `- ${i.quantity}x ${i.title} ($${i.price})`).join('\n');
  const totalAmount = order.totalAmount.toFixed(2);
  
  const messageBody = `*New Order - NOIR & GOLD*\n\n*Name:* ${order.customerName}\n*Table/Address:* ${order.tableNumber}\n*Phone:* ${order.phone}\n\n*Items:*\n${orderItemsText}\n\n*Total:* $${totalAmount}`;

  // 1. Send Email to Customer & Admin
  if (envConfig.EMAIL_USER && envConfig.EMAIL_USER !== 'your_email@gmail.com') {
    try {
      const transporter = await createEmailTransporter(envConfig);
      if (transporter) {
        const mailOptions = {
          from: `"Noir & Gold" <${envConfig.EMAIL_USER}>`,
          to: `${order.email}, ${envConfig.ADMIN_EMAIL}`,
          subject: `Order Confirmation - ${order.customerName}`,
          text: messageBody.replace(/\*/g, ''),
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a2e; color: #eee;">
              <h1 style="color: #d4af37; text-align: center;">NOIR & GOLD</h1>
              <h2 style="color: #d4af37;">Order Confirmation</h2>
              <p><strong>Name:</strong> ${order.customerName}</p>
              <p><strong>Table/Address:</strong> ${order.tableNumber}</p>
              <p><strong>Phone:</strong> ${order.phone}</p>
              <hr style="border-color: #d4af37;" />
              <h3 style="color: #d4af37;">Items:</h3>
              <ul>${order.items.map(i => `<li>${i.quantity}x ${i.title} - $${i.price}</li>`).join('')}</ul>
              <hr style="border-color: #d4af37;" />
              <h3 style="color: #d4af37;">Total: $${totalAmount}</h3>
              <p style="text-align: center; color: #888; margin-top: 20px;">Thank you for dining with Noir & Gold</p>
            </div>
          `
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Order confirmation email sent. Message ID:', info.messageId);
      }
    } catch (emailError) {
      console.error('❌ Error sending Email:', emailError.message);
      console.error('❌ Full email error:', JSON.stringify(emailError, null, 2));
    }
  } else {
    console.log('⚠️ Skipping Email: EMAIL_USER not configured');
  }

  // 2. Send WhatsApp to Admin
  if (envConfig.TWILIO_ACCOUNT_SID && envConfig.TWILIO_ACCOUNT_SID !== 'your_twilio_sid') {
    try {
      console.log('📱 Attempting WhatsApp via Twilio...');
      console.log('📱 From:', envConfig.TWILIO_WHATSAPP_NUMBER);
      console.log('📱 To:', envConfig.ADMIN_WHATSAPP_NUMBER);
      
      const twilioClient = twilio(envConfig.TWILIO_ACCOUNT_SID, envConfig.TWILIO_AUTH_TOKEN);
      const message = await twilioClient.messages.create({
        body: messageBody,
        from: envConfig.TWILIO_WHATSAPP_NUMBER,
        to: envConfig.ADMIN_WHATSAPP_NUMBER
      });
      console.log('✅ WhatsApp sent. SID:', message.sid, 'Status:', message.status);
    } catch (waError) {
      console.error('❌ Error sending WhatsApp:', waError.message);
      console.error('❌ Twilio error code:', waError.code);
      console.error('❌ Twilio more info:', waError.moreInfo);
      
      if (waError.code === 21608 || waError.code === 63007) {
        console.error('💡 The recipient must first send "join <sandbox-keyword>" to the Twilio WhatsApp sandbox number.');
        console.error('💡 Send a WhatsApp message to +14155238886 with the join code from your Twilio console.');
      }
      if (waError.code === 20003) {
        console.error('💡 Twilio authentication failed. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env');
      }
    }
  } else {
    console.log('⚠️ Skipping WhatsApp: TWILIO_ACCOUNT_SID not configured');
  }
};


const sendOrderCompletedNotification = async (order) => {
  const envConfig = loadEnvConfig();

  console.log('📧 Sending order completion notification for order:', order._id);

  if (envConfig.EMAIL_USER && envConfig.EMAIL_USER !== 'your_email@gmail.com') {
    try {
      const transporter = await createEmailTransporter(envConfig);
      if (transporter) {
        const mailOptions = {
          from: `"Noir & Gold" <${envConfig.EMAIL_USER}>`,
          to: order.email,
          subject: `Your Order is Ready! - Noir & Gold`,
          text: `Hi ${order.customerName},\n\nGreat news! Your order is now COMPLETED and ready.\n\nThank you for dining with Noir & Gold.\n\nBest regards,\nThe Noir & Gold Team`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a2e; color: #eee;">
              <h1 style="color: #d4af37; text-align: center;">NOIR & GOLD</h1>
              <h2 style="color: #d4af37;">Your Order is Ready! 🎉</h2>
              <p>Hi ${order.customerName},</p>
              <p>Great news! Your order is now <strong style="color: #4CAF50;">COMPLETED</strong> and ready.</p>
              <p>Thank you for dining with Noir & Gold.</p>
              <p style="color: #888;">Best regards,<br/>The Noir & Gold Team</p>
            </div>
          `
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Order completion email sent. Message ID:', info.messageId);
      }
    } catch (emailError) {
      console.error('❌ Error sending completion Email:', emailError.message);
      console.error('❌ Full error:', JSON.stringify(emailError, null, 2));
    }
  } else {
    console.log('⚠️ Skipping completion email: EMAIL_USER not configured');
  }
};


// Test function - run: node -e "require('./utils/notifications').testNotifications()"
const testNotifications = async () => {
  console.log('\n🧪 ===== NOTIFICATION TEST =====\n');
  
  const envConfig = loadEnvConfig();
  
  // Test 1: Email
  console.log('--- Test 1: Email ---');
  console.log('EMAIL_USER:', envConfig.EMAIL_USER);
  console.log('EMAIL_PASS:', envConfig.EMAIL_PASS ? '***SET***' : '❌ NOT SET');
  console.log('ADMIN_EMAIL:', envConfig.ADMIN_EMAIL);
  
  if (envConfig.EMAIL_USER && envConfig.EMAIL_PASS) {
    try {
      const transporter = await createEmailTransporter(envConfig);
      if (transporter) {
        const info = await transporter.sendMail({
          from: `"Noir & Gold TEST" <${envConfig.EMAIL_USER}>`,
          to: envConfig.ADMIN_EMAIL,
          subject: '🧪 Test Email from Noir & Gold Backend',
          text: 'If you received this, email notifications are working correctly!'
        });
        console.log('✅ TEST EMAIL SENT! Message ID:', info.messageId);
      }
    } catch (err) {
      console.error('❌ TEST EMAIL FAILED:', err.message);
    }
  }
  
  // Test 2: WhatsApp
  console.log('\n--- Test 2: WhatsApp ---');
  console.log('TWILIO_ACCOUNT_SID:', envConfig.TWILIO_ACCOUNT_SID ? '***SET***' : '❌ NOT SET');
  console.log('TWILIO_AUTH_TOKEN:', envConfig.TWILIO_AUTH_TOKEN ? '***SET***' : '❌ NOT SET');
  console.log('TWILIO_WHATSAPP_NUMBER:', envConfig.TWILIO_WHATSAPP_NUMBER);
  console.log('ADMIN_WHATSAPP_NUMBER:', envConfig.ADMIN_WHATSAPP_NUMBER);
  
  if (envConfig.TWILIO_ACCOUNT_SID && envConfig.TWILIO_AUTH_TOKEN) {
    try {
      const twilioClient = twilio(envConfig.TWILIO_ACCOUNT_SID, envConfig.TWILIO_AUTH_TOKEN);
      const message = await twilioClient.messages.create({
        body: '🧪 Test WhatsApp from Noir & Gold Backend - Notifications are working!',
        from: envConfig.TWILIO_WHATSAPP_NUMBER,
        to: envConfig.ADMIN_WHATSAPP_NUMBER
      });
      console.log('✅ TEST WHATSAPP SENT! SID:', message.sid, 'Status:', message.status);
    } catch (err) {
      console.error('❌ TEST WHATSAPP FAILED:', err.message);
      console.error('Error code:', err.code);
      console.error('More info:', err.moreInfo);
      
      if (err.code === 21608 || err.code === 63007) {
        console.error('\n💡 FIX: Send "join <sandbox-keyword>" via WhatsApp to +14155238886');
        console.error('   Find your sandbox keyword at: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn');
      }
      if (err.code === 20003) {
        console.error('\n💡 FIX: Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env');
      }
    }
  }
  
  console.log('\n🧪 ===== TEST COMPLETE =====\n');
};

module.exports = {
  sendOrderConfirmation,
  sendOrderCompletedNotification,
  testNotifications
};

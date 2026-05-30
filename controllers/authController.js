const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate JWT Token
const generateToken = (id, email) => {
  return jwt.sign(
    { id, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Send email (for OTP)
const sendEmail = async (email, otp) => {
  try {
    // 1. If Resend API Key is provided, use Resend HTTP API (works perfectly on Render Free Tier)
    if (process.env.RESEND_API_KEY) {
      const axios = require('axios');
      await axios.post(
        'https://api.resend.com/emails',
        {
          from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
          to: email,
          subject: 'Your OTP for Konvo Task Manager',
          html: `<h1>Your OTP: ${otp}</h1><p>This OTP will expire in ${process.env.OTP_EXPIRY || 5} minutes</p>`,
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return true;
    }

    // 2. Fallback to standard SMTP (for local development or paid instances where SMTP ports are open)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Your OTP for Konvo Task Manager',
      html: `<h1>Your OTP: ${otp}</h1><p>This OTP will expire in ${process.env.OTP_EXPIRY || 5} minutes</p>`,
    });

    return true;
  } catch (error) {
    console.error('Email error:', error.response?.data || error.message || error);
    return false;
  }
};

// Signup controller
const signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    console.log(`[AUTH] SIGNUP request received - Email: ${email}, Name: ${name}`);

    // Check if user already exists
    const { data: existingUser, error: checkError } = await req.supabase .from('users') .select('*') .eq('email', email) .maybeSingle();

    if (existingUser) {
      console.log(`[AUTH] SIGNUP failed - Email already exists: ${email}`);
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database
    const { data: user, error: createError } = await req.supabase
      .from('users')
      .insert([
        {
          email,
          password: hashedPassword,
          name,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error(`[AUTH] SIGNUP database insert error:`, createError.message);
      return res.status(500).json({ message: 'Failed to create user', error: createError.message });
    }

    // Generate token
    const token = generateToken(user.id, user.email);
    console.log(`[AUTH] SIGNUP success - Registered User ID: ${user.id}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login controller
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[AUTH] LOGIN request received - Email: ${email}`);

    // Find user
    const { data: user, error: findError } = await req.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) {
      console.log(`[AUTH] LOGIN failed - User not found for email: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log(`[AUTH] LOGIN failed - Invalid password for email: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user.id, user.email);
    console.log(`[AUTH] LOGIN success - Logged in User ID: ${user.id}`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Request OTP controller
const requestOTP = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`[AUTH] REQUEST_OTP request received - Email: ${email}`);

    // Find user
    const { data: user } = await req.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) {
      console.log(`[AUTH] REQUEST_OTP failed - User not found: ${email}`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Store OTP in database
    const { error: updateError } = await req.supabase
      .from('users')
      .update({
        otp,
        otp_expiry: otpExpiry,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error(`[AUTH] REQUEST_OTP DB update error:`, updateError.message);
      return res.status(500).json({ message: 'Failed to generate OTP' });
    }

    console.log(`[AUTH] REQUEST_OTP - Code generated: ${otp} (expires ${otpExpiry}). Sending email...`);

    // Send OTP via email
    const emailSent = await sendEmail(email, otp);

    if (!emailSent) {
      console.error(`[AUTH] REQUEST_OTP failed - Failed to send email to: ${email}`);
      return res.status(500).json({ message: 'Failed to send OTP email' });
    }

    console.log(`[AUTH] REQUEST_OTP success - OTP sent to inbox of: ${email}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent to email successfully',
      expiresIn: `${process.env.OTP_EXPIRY || 5} minutes`,
    });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify OTP controller
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log(`[AUTH] VERIFY_OTP request received - Email: ${email}, Code: ${otp}`);

    // Find user
    const { data: user } = await req.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) {
      console.log(`[AUTH] VERIFY_OTP failed - User not found: ${email}`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if OTP is valid
    if (user.otp !== otp) {
      console.log(`[AUTH] VERIFY_OTP failed - Code mismatch for email: ${email}`);
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    // Check if OTP is expired
    if (new Date() > new Date(user.otp_expiry)) {
      console.log(`[AUTH] VERIFY_OTP failed - Code expired (expiry was ${user.otp_expiry}) for email: ${email}`);
      return res.status(401).json({ message: 'OTP has expired' });
    }

    // Clear OTP and generate token
    const { error: updateError } = await req.supabase
      .from('users')
      .update({
        otp: null,
        otp_expiry: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error(`[AUTH] VERIFY_OTP failed - Database clear error:`, updateError.message);
      return res.status(500).json({ message: 'Failed to verify OTP' });
    }

    const token = generateToken(user.id, user.email);
    console.log(`[AUTH] VERIFY_OTP success - User ${user.id} logged in successfully via OTP.`);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  signup,
  login,
  requestOTP,
  verifyOTP,
};

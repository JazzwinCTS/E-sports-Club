require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Maps test card numbers to official Stripe backend test tokens
const TEST_CARD_MAP = {
    '4242424242424242': 'tok_visa',                            // Success
    '4000000000000002': 'tok_chargeDeclined',                  // Generic Decline
    '4000000000000005': 'tok_chargeDeclinedInsufficientFunds',  // Insufficient Funds
    '4000000000000069': 'tok_chargeDeclinedExpiredCard',        // Expired Card
    '4000000000000003': 'tok_chargeDeclinedIncorrectCvc',       // Incorrect CVC
    '4000000000000004': 'tok_chargeDeclinedProcessingError'     // Processing Error
};

app.get('/', (req, res) => {
    res.send('Backend payment server is live!');
});

app.post('/api/pay', async (req, res) => {
    try {
        const { cardNumber, expMonth, expYear, cvc, amountCents, description } = req.body;
        
        const cleanCard = (cardNumber || '').replace(/\s+/g, '');
        const cleanCvc = (cvc || '').toString().trim();

        // 1. Validate CVC Length (3 or 4 digits)
        if (!/^\d{3,4}$/.test(cleanCvc)) {
            return res.status(400).json({
                success: false,
                error: { message: "Your card's security code is invalid." }
            });
        }

        // 2. Validate Expiry Month & Year
        const month = parseInt(expMonth, 10);
        let year = parseInt(expYear, 10);
        if (year < 100) year += 2000; // Converts '26' to 2026

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        if (isNaN(month) || month < 1 || month > 12) {
            return res.status(400).json({
                success: false,
                error: { message: "Your card's expiration month is invalid." }
            });
        }

        if (year < currentYear || (year === currentYear && month < currentMonth)) {
            return res.status(400).json({
                success: false,
                error: { message: "Your card's expiration year is in the past." }
            });
        }

        // 3. Map card number to Stripe test token
        const sourceToken = TEST_CARD_MAP[cleanCard] || 'tok_chargeDeclined';

        // 4. Create charge with Stripe
        const charge = await stripe.charges.create({
            amount: amountCents,
            currency: 'myr',
            source: sourceToken,
            description: description
        });

        return res.status(200).json({
            success: true,
            status: charge.status,
            paid: charge.paid
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: { message: error.message }
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
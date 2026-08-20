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

app.post('/api/pay', async (req, res) => {
    try {
        const { cardNumber, amountCents, description } = req.body;
        const cleanCard = (cardNumber || '').replace(/\s+/g, '');

        // Map entered card to Stripe test token; default to decline for unknown test numbers
        const sourceToken = TEST_CARD_MAP[cleanCard] || 'tok_chargeDeclined';

        // Submit charge to Stripe API
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
        // Returns official error message generated directly by Stripe's server
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
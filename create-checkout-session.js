
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
dotenv.config({path: path.resolve('../../../.env')});
const app = express();
import stripe from 'stripe';
console.log(process.env.VITE_STRIPE_SECRET_KEY);
// console.log(path.resolve('../../../.env'));

const stripeInstance = stripe(process.env.VITE_STRIPE_SECRET_KEY); 
app.use(cors());
app.use(express.json());
app.post('/create-checkout-session', async (req, res) => {
  console.log(req.body);
  
  const { items, total, email } = req.body; // Get the amount from the request body (in the smallest unit, e.g., cents)
  console.log(items);
  
  const newItems = items?.map(item => {
    return {
      quantity: 1,
      price_data: {
          currency: 'usd',
          unit_amount: Math.round(item.price * 100), // Stripe requires amounts in cents
          product_data: {
              name: item.title,
              images: [(item.images && item.images[0]) || item.image],
              description: item.description // Add description here if required
          }
      }
  }
  })
  try {
    const paymentIntent = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      // shipping_address_collection: {allowed_countries: ['GB,US','CA']},
      line_items: newItems,
      mode: 'payment',
      success_url: `${process.env.VITE_HOST}/payment`,
      cancel_url: `${process.env.VITE_DEPHOST}/cart`,
      currency: 'usd', 
      // amount: total,
      metadata: {
        email: email,
        images: JSON.stringify(items.map(item=>item.image||item.images[0]))
      }
    });
    res.status(200).json({id: paymentIntent.id})
    
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

app.listen(8000, () => console.log('Server is running on port 8000'));
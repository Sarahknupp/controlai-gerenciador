import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Environment variables for Stripe configuration
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'your-public-key';
const STRIPE_API_URL = import.meta.env.VITE_API_URL || '/api';

// Context type definitions
interface StripeContextType {
  loading: boolean;
  error: string | null;
  createPaymentIntent: (amount: number, currency?: string, metadata?: Record<string, string>) => Promise<{ clientSecret: string }>;
  createSubscription: (priceId: string, customerId?: string) => Promise<{ subscriptionId: string; clientSecret: string }>;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

// Load Stripe outside of render to avoid recreation
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

// Provider component
export const StripeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a payment intent
  const createPaymentIntent = async (amount: number, currency = 'brl', metadata = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be a request to your backend
      // For demo purposes, we'll simulate the response
      console.log(`Creating payment intent for ${amount} ${currency}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response
      const response = {
        clientSecret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substring(2, 9)}`,
      };
      
      return response;
    } catch (err) {
      console.error('Error creating payment intent:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment intent';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Create a subscription
  const createSubscription = async (priceId: string, customerId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be a request to your backend
      console.log(`Creating subscription for price: ${priceId}, customer: ${customerId || 'new customer'}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response
      const response = {
        subscriptionId: `sub_mock_${Date.now()}`,
        clientSecret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substring(2, 9)}`,
      };
      
      return response;
    } catch (err) {
      console.error('Error creating subscription:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create subscription';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    loading,
    error,
    createPaymentIntent,
    createSubscription
  };

  return (
    <StripeContext.Provider value={value}>
      <Elements stripe={stripePromise}>
        {children}
      </Elements>
    </StripeContext.Provider>
  );
};

// Hook to use Stripe context
export const useStripe = () => {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
};
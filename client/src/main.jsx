import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react';
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  SignIn,
  SignUp,
} from '@clerk/clerk-react';
import './index.css'
import App from './App.jsx'

const PUBLISHABLE_KEY = "pk_test_c3VwcmVtZS1tYXJtb3QtNC5jbGVyay5hY2NvdW50cy5kZXYk";

createRoot(document.getElementById('root')).render(
<ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <SignedIn>
        <App />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
  </ClerkProvider>
)

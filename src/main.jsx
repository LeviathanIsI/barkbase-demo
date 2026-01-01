import App from "@/App";
import ErrorBoundary from "@/app/ErrorBoundary";
import "@/index.css";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { initSentry, Sentry } from "@/lib/sentry";

// Initialize Sentry before rendering
initSentry();

// Check if demo mode
const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

// Guard to prevent re-initialization
let demoInitialized = false;

// Demo mode initialization - must complete before app renders
async function initializeDemo() {
  if (demoInitialized) {
    console.log('[Demo] Already initialized, skipping');
    return;
  }
  demoInitialized = true;
  const { loadSeedData } = await import('@/demo/seedData');
  const { initializeDemoStore } = await import('@/demo/persistence/DemoStore');
  const { useAuthStore } = await import('@/stores/auth');
  const { useTenantStore } = await import('@/stores/tenant');
  const { DEMO_TENANT } = await import('@/demo/config');

  // Load and initialize seed data
  const seedData = await loadSeedData();
  initializeDemoStore(seedData);

  // Set up demo auth - this MUST be set before router renders
  useAuthStore.getState().setAuth({
    user: {
      id: 'demo-user-001',
      email: 'demo@barkbase.com',
      firstName: 'Demo',
      lastName: 'User',
    },
    role: 'ADMIN',
    tenantId: 'demo-tenant',
    accountCode: 'BK-DEMO01',
    accessToken: 'demo-token',
  });

  // Set up demo tenant
  useTenantStore.setState({
    tenant: {
      recordId: DEMO_TENANT.id,
      slug: DEMO_TENANT.slug,
      name: DEMO_TENANT.name,
      accountCode: DEMO_TENANT.accountCode,
      plan: DEMO_TENANT.plan,
      features: DEMO_TENANT.features,
      settings: DEMO_TENANT.settings,
      terminology: DEMO_TENANT.terminology,
    },
    initialized: true,
    isLoading: false,
  });

  console.log('[Demo] Initialized successfully');
}

// Render the app
function renderApp() {
  if ("serviceWorker" in navigator) {
    registerSW({ immediate: true });
  }

  createRoot(document.getElementById("root")).render(
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We&apos;ve been notified and are working on a fix.
            </p>
            <button
              onClick={resetError}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
      onError={(error) => {
        console.error("Caught by Sentry ErrorBoundary:", error);
      }}
    >
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </Sentry.ErrorBoundary>
  );
}

// Bootstrap - block render until demo init completes
async function bootstrap() {
  if (isDemoMode) {
    await initializeDemo();
  }

  renderApp();
}

bootstrap();

/**
 * Demo Provider Component
 *
 * Initializes the demo environment:
 * - Loads and resolves seed data
 * - Initializes DemoStore with seed data
 * - Sets up demo authentication
 * - Sets up demo tenant
 * - Renders DemoBanner
 */

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useTenantStore } from '@/stores/tenant';
import { initializeDemoStore } from '../persistence/DemoStore';
import { loadSeedData } from '../seedData';
import { DEMO_TENANT } from '../config';
import DemoBanner from './DemoBanner';
import LoadingState from '@/components/ui/LoadingState';

export default function DemoProvider({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeDemo = async () => {
      try {
        // Load and resolve seed data (with relative dates)
        const seedData = await loadSeedData();

        // Initialize demo store with seed data
        initializeDemoStore(seedData);

        // Initialize demo authentication
        const { initializeDemoAuth } = useAuthStore.getState();
        initializeDemoAuth();

        // Initialize demo tenant
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

        setIsInitialized(true);
      } catch (err) {
        console.error('[Demo] Initialization failed:', err);
        setError(err.message || 'Failed to initialize demo');
      }
    };

    initializeDemo();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Demo Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingState label="Loading demo..." variant="mascot" />
      </div>
    );
  }

  return (
    <>
      <DemoBanner />
      {/* Add top padding to account for fixed banner */}
      <div className="pt-10">
        {children}
      </div>
    </>
  );
}

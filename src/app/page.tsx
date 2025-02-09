'use client';

import { useState, useEffect } from 'react';
import { ServerSearch } from '../components/ServerSearch';
import { ServerHeader } from '../components/ServerHeader';
import { getPowerData } from './actions';
import { PowerData } from '../types/server';

function ServerGrid({ servers, searchTerm }: { servers: PowerData[], searchTerm: string }) {
  return <ServerSearch servers={servers} searchTerm={searchTerm} />;
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [servers, setServers] = useState<PowerData[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const newData = await getPowerData();
      setServers(newData);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Failed to refresh:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    handleRefresh();
    const interval = setInterval(handleRefresh, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <ServerHeader
            serverCount={servers.length}
            lastUpdate={lastUpdate}
            onSearch={setSearchTerm}
            onRefresh={handleRefresh}
            loading={loading}
          />
          
          {loading && servers.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6"
                >
                  <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="mt-4 space-y-3">
                    <div className="h-8 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-2 w-full rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-2 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ServerGrid servers={servers} searchTerm={searchTerm} />
          )}
        </div>
      </div>
    </main>
  );
}

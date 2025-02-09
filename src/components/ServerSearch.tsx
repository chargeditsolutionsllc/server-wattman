'use client';

import { ServerCard } from './ServerCard';
import { PowerData } from '../types/server';

interface ServerSearchProps {
  servers: PowerData[];
  searchTerm: string;
}

export function ServerSearch({ servers, searchTerm }: ServerSearchProps) {
  const filteredServers = servers.filter(server =>
    server.serverName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredServers.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No servers found</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Try adjusting your search
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filteredServers.map((server) => (
        <ServerCard key={server.serverName} server={server} />
      ))}
    </div>
  );
}

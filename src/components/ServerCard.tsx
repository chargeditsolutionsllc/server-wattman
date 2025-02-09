'use client';

import { PowerData, servers } from '../types/server';

export function ServerCard({ server }: { server: PowerData }) {
  return (
    <div className={`
      relative overflow-hidden rounded-xl border bg-white dark:bg-slate-800 p-6
      ${server.error ? 'border-red-200 dark:border-red-800' : 'border-slate-200 dark:border-slate-700'}
      transition-all hover:shadow-lg dark:hover:shadow-slate-900/50
    `}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1">
            {server.serverName}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <span className={`
              inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
              ${server.error 
                ? 'bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-400' 
                : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'}
            `}>
              {server.error ? 'Error' : 'Online'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(() => {
            const config = servers.find(config => config.name === server.serverName);
            return config && (
              <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-400/30">
                {config.type}
              </span>
            );
          })()}
        </div>
      </div>

      {server.error ? (
        <div className="mt-4">
          <p className="text-sm text-red-600 dark:text-red-400">{server.error}</p>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {server.powerConsumption}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">{server.unit}</span>
          </div>
          <div className="mt-1">
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
              <div 
                className="h-2 rounded-full bg-emerald-500 transition-all"
                style={{ 
                  width: `${Math.min(100, (server.powerConsumption / 1000) * 100)}%`
                }}
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Last updated: {new Date(server.timestamp).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}

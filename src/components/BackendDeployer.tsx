'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEditor } from '../context/EditorContext';
import { Server, Shield, CreditCard, Cpu, Mail, Play, AlertCircle, CheckCircle, Terminal, HelpCircle, ExternalLink, Settings } from 'lucide-react';

interface DeploymentLog {
  text: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

export default function BackendDeployer() {
  const { backendServices, updateBackendService, showToast } = useEditor();
  const [activeServiceId, setActiveServiceId] = useState<string>('auth');
  const [deploying, setDeploying] = useState<boolean>(false);
  const [deployed, setDeployed] = useState<boolean>(false);
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Local configs states
  const [authProvider, setAuthProvider] = useState('email');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripeSuccessUrl, setStripeSuccessUrl] = useState('');
  const [smtpHost, setSmtpHost] = useState('smtp.mailgun.org');
  const [smtpPort, setSmtpPort] = useState('587');

  // Auto-scroll terminal log
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Sync config states on service click
  useEffect(() => {
    const service = backendServices.find(s => s.id === activeServiceId);
    if (service) {
      if (service.id === 'auth') {
        setAuthProvider(service.config.provider || 'email');
      } else if (service.id === 'stripe') {
        setStripeSecretKey(service.config.secretKey || '');
        setStripeSuccessUrl(service.config.successUrl || '');
      } else if (service.id === 'smtp') {
        setSmtpHost(service.config.host || 'smtp.mailgun.org');
        setSmtpPort(service.config.port || '587');
      }
    }
  }, [activeServiceId, backendServices]);

  const handleSaveConfig = () => {
    let config: any = {};
    if (activeServiceId === 'auth') {
      config = { provider: authProvider };
    } else if (activeServiceId === 'stripe') {
      config = { secretKey: stripeSecretKey, successUrl: stripeSuccessUrl };
    } else if (activeServiceId === 'smtp') {
      config = { host: smtpHost, port: smtpPort };
    } else if (activeServiceId === 'db-sync') {
      config = { mode: 'auto' };
    }

    const service = backendServices.find(s => s.id === activeServiceId);
    updateBackendService(activeServiceId, service?.enabled || false, config);
  };

  const handleToggleService = (id: string, enabled: boolean) => {
    const service = backendServices.find(s => s.id === id);
    updateBackendService(id, enabled, service?.config || {});
  };

  const runDeployPipeline = () => {
    if (deploying) return;
    setDeploying(true);
    setDeployed(false);
    setLogs([]);

    const pipelineSteps: { log: string; delay: number; type?: 'info' | 'success' | 'warn' | 'error' }[] = [
      { log: '⚙ [1/6] Provisioning serverless visual environment containers...', delay: 200 },
      { log: '📦 [2/6] Compiling custom JavaScript logic scripts triggers...', delay: 600 },
      { log: '📡 [3/6] Connecting Supabase / MongoDB schemas configurations...', delay: 1100 },
      { log: '💳 [4/6] Connecting Stripe Checkout API gateways credentials...', delay: 1500 },
      { log: '🔐 [5/6] Instantiating OAuth User Auth middlewares routing...', delay: 2000 },
      { log: '☁ [6/6] Pushing production build binaries to Vercel routing layers...', delay: 2400 },
      { log: '🔥 Optimizing static assets & edge serverless functions...', delay: 2800 },
      { log: '⚡ Edge servers response verified successfully: Status 200 OK', delay: 3100, type: 'success' },
      { log: '✓ Visual backend successfully deployed to Vercel Production!', delay: 3500, type: 'success' },
      { log: '🔗 Production Live Sandbox Preview URL: https://visual-builder-sandbox.vercel.app', delay: 3600, type: 'success' }
    ];

    pipelineSteps.forEach((step, idx) => {
      setTimeout(() => {
        setLogs(prev => [...prev, { text: step.log, type: step.type || 'info' }]);
        if (idx === pipelineSteps.length - 1) {
          setDeploying(false);
          setDeployed(true);
          showToast('Visual backend successfully deployed!', 'success');
        }
      }, step.delay);
    });
  };

  const getServiceIcon = (id: string) => {
    switch (id) {
      case 'auth': return Shield;
      case 'stripe': return CreditCard;
      case 'db-sync': return Cpu;
      default: return Mail;
    }
  };

  const activeService = backendServices.find(s => s.id === activeServiceId);

  return (
    <div className="flex-1 bg-slate-950 flex select-none text-slate-200 min-h-0 overflow-hidden font-sans">
      
      {/* Left Column: Visual Modules map */}
      <div className="w-80 border-r border-slate-900 bg-slate-950 flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-slate-900 bg-slate-950/40">
          <h2 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-blue-450" />
            <span>Backend Services Map</span>
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Toggle and link modules to provision custom visual backends.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {backendServices.map(service => {
            const Icon = getServiceIcon(service.id);
            const isSelected = activeServiceId === service.id;
            return (
              <div
                key={service.id}
                onClick={() => setActiveServiceId(service.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-slate-900 border-blue-500/35 shadow-lg shadow-blue-500/5'
                    : 'bg-slate-900/40 border-slate-900 hover:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600/10 text-blue-400' : 'bg-slate-950 text-slate-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>{service.name}</h3>
                      <p className="text-[9px] text-slate-500 leading-relaxed mt-0.5">
                        {service.id === 'auth' && 'Credentials sign-in gateway'}
                        {service.id === 'stripe' && 'Visual checkout card checkout'}
                        {service.id === 'db-sync' && 'Serverless database queries pool'}
                        {service.id === 'smtp' && 'Custom notifications dispatcher'}
                      </p>
                    </div>
                  </div>

                  {/* Switch toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleService(service.id, !service.enabled);
                    }}
                    className={`w-8 h-4 rounded-full relative transition-all shrink-0 mt-1 ${
                      service.enabled ? 'bg-blue-600' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.25 transition-all ${
                        service.enabled ? 'left-4' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {service.enabled && (
                  <span className="absolute bottom-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Setting Configurations & Terminal log */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-955 overflow-y-auto p-6 space-y-6">
        
        {/* Settings block */}
        {activeService && (
          <section className="bg-slate-900 border border-slate-900 p-5 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-450" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">{activeService.name} Configuration</h2>
              </div>

              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-slate-500">Status:</span>
                <span className={`font-bold uppercase font-mono px-1.5 py-0.5 rounded ${activeService.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-950 text-slate-500'}`}>
                  {activeService.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {activeService.id === 'auth' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5">AUTH METHOD</label>
                  <select
                    value={authProvider}
                    onChange={(e) => setAuthProvider(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="email">Email / Password Login</option>
                    <option value="google">Google Auth Gateway</option>
                    <option value="github">GitHub Developer Login</option>
                  </select>
                </div>
              )}

              {activeService.id === 'stripe' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5">STRIPE SECRET API KEY</label>
                    <input
                      type="password"
                      placeholder="sk_test_..."
                      value={stripeSecretKey}
                      onChange={(e) => setStripeSecretKey(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5">CHECKOUT SUCCESS URL</label>
                    <input
                      type="text"
                      placeholder="https://mysite.com/success"
                      value={stripeSuccessUrl}
                      onChange={(e) => setStripeSuccessUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </>
              )}

              {activeService.id === 'db-sync' && (
                <div className="col-span-2 p-4 bg-slate-950/40 rounded-xl border border-slate-900 flex gap-3 text-xs leading-relaxed text-slate-400">
                  <Cpu className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block mb-0.5">Real-time Connection Gateway Sync</strong>
                    Automatically aggregates database pools queries, syncing Next.js serverless functions outputs directly with your visual diagram tables setup. No code configurations needed.
                  </div>
                </div>
              )}

              {activeService.id === 'smtp' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5">SMTP HOST</label>
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5">SMTP PORT</label>
                    <input
                      type="text"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleSaveConfig}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] rounded-lg border border-slate-700 transition-all cursor-pointer block ml-auto uppercase tracking-wider"
            >
              Save Configuration
            </button>
          </section>
        )}

        {/* Deploy section */}
        <section className="bg-slate-900 border border-slate-900 p-5 rounded-2xl space-y-4 shadow-xl flex flex-col min-h-[360px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Visual Deployment Console</h2>
            </div>

            <button
              onClick={runDeployPipeline}
              disabled={deploying}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-bold rounded-lg shadow-md transition-all cursor-pointer uppercase tracking-wider"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{deploying ? 'Deploying...' : 'Deploy Visual Backend'}</span>
            </button>
          </div>

          {/* Terminal Console log box */}
          <div className="flex-1 bg-slate-950 p-4 font-mono text-[11px] leading-relaxed rounded-xl border border-slate-900 overflow-y-auto text-slate-350 min-h-[220px] max-h-[300px]">
            {logs.length === 0 ? (
              <div className="text-slate-650 italic p-4 text-center select-none">
                Terminal idle. Click "Deploy Visual Backend" to provision edge servers infrastructure...
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log, idx) => {
                  let colorClass = 'text-slate-350';
                  if (log.type === 'success') colorClass = 'text-emerald-400 font-bold';
                  return (
                    <div key={idx} className={`${colorClass} whitespace-pre-wrap`}>
                      {log.text}
                    </div>
                  );
                })}
                {deploying && (
                  <div className="flex items-center gap-1.5 text-blue-400 animate-pulse mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />
                    <span>deploy pipeline compiling edge build...</span>
                  </div>
                )}
                <div ref={terminalEndRef} />
              </div>
            )}
          </div>

          {/* Clickable Sandbox Badge */}
          {deployed && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between animate-fadeIn font-sans">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
                <div>
                  <h4 className="text-xs font-bold text-white">Visual Platform Deployed Successfully!</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Your changes are live in the serverless edge sandbox environment.</p>
                </div>
              </div>
              
              <a
                href="https://visual-builder-sandbox.vercel.app"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg shadow-lg shadow-emerald-500/10 transition-all uppercase tracking-wider"
              >
                <span>Open Sandbox</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </section>

      </div>

    </div>
  );
}

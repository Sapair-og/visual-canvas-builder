'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEditor } from '../context/EditorContext';
import { 
  Server, Shield, CreditCard, Cpu, Mail, Play, AlertCircle, CheckCircle, 
  Terminal, HelpCircle, ExternalLink, Settings, Laptop, Smartphone, Tablet, Eye 
} from 'lucide-react';
import CanvasNodeRenderer from './CanvasNodeRenderer';

interface DeploymentLog {
  text: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

export default function BackendDeployer() {
  const { 
    backendServices, 
    updateBackendService, 
    showToast, 
    pages, 
    currentPageId, 
    changePage,
    canvasState,
    themeTokens,
    logicFlows
  } = useEditor();

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

  // Sandbox Viewport states
  const [sandboxDevice, setSandboxDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [sandboxPage, setSandboxPage] = useState('index');

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
      { log: '🔗 Local Sandbox environment compiled successfully: http://visual-sandbox.local/index', delay: 3600, type: 'success' }
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

  const getDeviceWidth = () => {
    switch (sandboxDevice) {
      case 'mobile': return 'max-w-[360px]';
      case 'tablet': return 'max-w-[600px]';
      default: return 'w-full';
    }
  };

  return (
    <div className="flex-1 bg-slate-950 flex select-none text-slate-200 min-h-0 overflow-hidden font-sans">
      
      {/* Left Column: Visual Modules map */}
      <div className="w-72 border-r border-slate-900 bg-slate-950 flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-slate-900 bg-slate-950/40">
          <h2 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-blue-450" />
            <span>Backend Services Map</span>
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5 font-sans">Toggle and link modules to provision custom visual backends.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {backendServices.map(service => {
            const Icon = getServiceIcon(service.id);
            const isSelected = activeServiceId === service.id;
            return (
              <div
                key={service.id}
                onClick={() => setActiveServiceId(service.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
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
                      <p className="text-[9px] text-slate-500 leading-relaxed mt-0.5 font-sans">
                        {service.id === 'auth' && 'Credentials sign-in gateway'}
                        {service.id === 'stripe' && 'Visual card checkout flow'}
                        {service.id === 'db-sync' && 'Serverless DB queries pool'}
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

      {/* Right Column: Setting Configurations & Terminal log / Live Sandbox */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-955 overflow-y-auto p-6 space-y-6">
        
        {/* Settings block */}
        {activeService && !deployed && (
          <section className="bg-slate-900 border border-slate-900 p-5 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-sans">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-450" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">{activeService.name} Configuration</h2>
              </div>

              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-slate-505">Status:</span>
                <span className={`font-bold uppercase font-mono px-1.5 py-0.5 rounded ${activeService.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-950 text-slate-500'}`}>
                  {activeService.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-sans">
              {activeService.id === 'auth' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Auth Method</label>
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
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Stripe Secret Key</label>
                    <input
                      type="password"
                      placeholder="sk_test_..."
                      value={stripeSecretKey}
                      onChange={(e) => setStripeSecretKey(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Checkout Success URL</label>
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
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">SMTP Host</label>
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">SMTP Port</label>
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
              className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-white font-bold text-[10px] rounded-lg border border-slate-800 transition-all cursor-pointer block ml-auto uppercase tracking-wider"
            >
              Save Configuration
            </button>
          </section>
        )}

        {/* Deploy section */}
        {!deployed && (
          <section className="bg-slate-900 border border-slate-900 p-5 rounded-2xl space-y-4 shadow-xl flex flex-col min-h-[320px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-sans">
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
            <div className="flex-1 bg-slate-950 p-4 font-mono text-[11px] leading-relaxed rounded-xl border border-slate-900 overflow-y-auto text-slate-350 min-h-[220px]">
              {logs.length === 0 ? (
                <div className="text-slate-650 italic p-4 text-center select-none font-sans">
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
                    <div className="flex items-center gap-1.5 text-blue-450 animate-pulse mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />
                      <span>deploy pipeline compiling edge build...</span>
                    </div>
                  )}
                  <div ref={terminalEndRef} />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Live Sandbox viewport section (Fills space when deployed) */}
        {deployed && (
          <section className="flex-1 bg-slate-900 border border-slate-900 p-5 rounded-2xl space-y-4 shadow-xl flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0 font-sans">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">Live Sandbox Viewport</h2>
              </div>
              
              {/* Controls */}
              <div className="flex items-center gap-4">
                {/* Switch page */}
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-slate-500 font-bold">Route:</span>
                  <select
                    value={sandboxPage}
                    onChange={(e) => setSandboxPage(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 font-mono text-[10px] focus:outline-none"
                  >
                    {Object.keys(pages).map(pId => (
                      <option key={pId} value={pId}>/{pId}</option>
                    ))}
                  </select>
                </div>

                {/* Device triggers */}
                <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 shrink-0">
                  <button
                    onClick={() => setSandboxDevice('desktop')}
                    className={`p-1 rounded transition-all ${sandboxDevice === 'desktop' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    title="Desktop View"
                  >
                    <Laptop className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setSandboxDevice('tablet')}
                    className={`p-1 rounded transition-all ${sandboxDevice === 'tablet' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    title="Tablet View"
                  >
                    <Tablet className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setSandboxDevice('mobile')}
                    className={`p-1 rounded transition-all ${sandboxDevice === 'mobile' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    title="Mobile View"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => setDeployed(false)}
                  className="px-2.5 py-1 bg-slate-950 border border-slate-850 hover:bg-slate-900 rounded text-[9px] font-bold text-slate-400 hover:text-white uppercase transition-all"
                >
                  Configure
                </button>
              </div>
            </div>

            {/* Simulated browser header bar */}
            <div className="bg-slate-950 border border-slate-900 rounded-t-xl p-2 px-3 flex items-center gap-2 shrink-0 select-none">
              <div className="flex items-center gap-1 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 bg-slate-900/60 border border-slate-850/50 rounded-lg py-1 px-3 text-[10px] text-slate-500 font-mono flex items-center justify-between">
                <span>http://visual-builder-sandbox.local/{sandboxPage}</span>
                <Eye className="w-3 h-3 text-slate-650" />
              </div>
            </div>

            {/* Page content view container */}
            <div className="flex-1 bg-slate-950/20 border-x border-b border-slate-900 rounded-b-xl flex items-start justify-center p-6 overflow-auto">
              <div className={`w-full ${getDeviceWidth()} bg-slate-900/40 border border-slate-850 rounded-xl overflow-hidden shadow-2xl relative transition-all duration-300`}>
                {pages[sandboxPage] ? (
                  <div className="relative">
                    {/* Simulated iframe preview element */}
                    <CanvasNodeRenderer node={pages[sandboxPage]} />
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs italic p-12 text-center">Page router load error: route not configured.</p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

    </div>
  );
}

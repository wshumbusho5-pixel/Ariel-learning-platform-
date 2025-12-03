'use client';

import { useState } from 'react';
import { Settings as SettingsIcon, Key, Shield, Bell, Database } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    defaultAiProvider: 'openai',
    openaiKey: '••••••••••••••••',
    anthropicKey: '••••••••••••••••',
    freeTierLimit: 10,
    premiumTierLimit: 100,
    enableEmailNotifications: true,
    dailyCostAlert: 50,
  });

  const [showKeys, setShowKeys] = useState(false);

  const handleSave = () => {
    alert('Settings saved successfully! (This is a demo - backend integration needed)');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Configure platform settings and preferences</p>
      </div>

      {/* AI Configuration */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Key className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">AI Configuration</h2>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Default Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default AI Provider
            </label>
            <select
              value={settings.defaultAiProvider}
              onChange={(e) =>
                setSettings({ ...settings, defaultAiProvider: e.target.value })
              }
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="openai">OpenAI (GPT-4)</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="ollama">Ollama (Local)</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              This provider will be used for generating answers by default
            </p>
          </div>

          {/* API Keys */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">API Keys</h3>
              <button
                onClick={() => setShowKeys(!showKeys)}
                className="text-sm text-orange-600 hover:text-orange-700"
              >
                {showKeys ? 'Hide' : 'Show'} Keys
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OpenAI API Key
              </label>
              <input
                type={showKeys ? 'text' : 'password'}
                value={settings.openaiKey}
                onChange={(e) =>
                  setSettings({ ...settings, openaiKey: e.target.value })
                }
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
                placeholder="sk-..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anthropic API Key
              </label>
              <input
                type={showKeys ? 'text' : 'password'}
                value={settings.anthropicKey}
                onChange={(e) =>
                  setSettings({ ...settings, anthropicKey: e.target.value })
                }
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
                placeholder="sk-ant-..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* User Limits */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">User Tier Limits</h2>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Free Tier Daily Limit
            </label>
            <input
              type="number"
              value={settings.freeTierLimit}
              onChange={(e) =>
                setSettings({ ...settings, freeTierLimit: Number(e.target.value) })
              }
              className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">Questions per day for free users</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Premium Tier Daily Limit
            </label>
            <input
              type="number"
              value={settings.premiumTierLimit}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  premiumTierLimit: Number(e.target.value),
                })
              }
              className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">Questions per day for premium users</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Bell className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications & Alerts</h2>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive email alerts for important events</p>
            </div>
            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  enableEmailNotifications: !settings.enableEmailNotifications,
                })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enableEmailNotifications ? 'bg-orange-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enableEmailNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Cost Alert Threshold
            </label>
            <div className="flex items-center max-w-xs">
              <span className="text-gray-500 mr-2">$</span>
              <input
                type="number"
                value={settings.dailyCostAlert}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    dailyCostAlert: Number(e.target.value),
                  })
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Get alerted when daily AI costs exceed this amount
            </p>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Database className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">System Information</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-sm text-gray-600">Platform Version</span>
            <span className="text-sm font-medium text-gray-900">v1.0.0</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-sm text-gray-600">Database</span>
            <span className="text-sm font-medium text-gray-900">MongoDB</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-sm text-gray-600">Environment</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Development
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-gray-600">Last Backup</span>
            <span className="text-sm font-medium text-gray-900">Never (Configure backups)</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}

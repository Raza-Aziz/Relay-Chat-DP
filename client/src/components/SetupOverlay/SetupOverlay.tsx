/**
 * Main SetupOverlay component
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useChat } from '../../context/ChatContext';
import { InitialActions } from './InitialActions';
import { CreateHashView } from './CreateHashView';
import { JoinHashView } from './JoinHashView';
import './SetupOverlay.css';

import { useTheme } from '../../context/ThemeContext';
import { SunIcon, MoonIcon } from '../common/icons';

interface SetupOverlayProps {
  onSetupComplete: (hash: string) => Promise<void>;
  isHidden: boolean;
}

type ViewType = 'initial' | 'create' | 'join';

export const SetupOverlay: React.FC<SetupOverlayProps> = ({ onSetupComplete, isHidden }) => {
  const { createNewChannel } = useChat();
  const { theme, toggleTheme } = useTheme();
  
  const [view, setView] = useState<ViewType>('initial');
  const [generatedHash, setGeneratedHash] = useState<string>('');
  const [joinHash, setJoinHash] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [, setIsLoading] = useState<boolean>(false);

  // Generate hash when entering create view
  const generateHash = useCallback(async () => {
    try {
      setStatus('Generating secure hash...');
      const hash = await createNewChannel();
      setGeneratedHash(hash);
      setStatus('');
    } catch (err) {
      setStatus('Failed to generate hash. Please try again.');
      console.error('Hash generation error:', err);
    }
  }, [createNewChannel]);

  useEffect(() => {
    if (view === 'create' && !generatedHash) {
      generateHash();
    }
  }, [view, generatedHash, generateHash]);

  const handleCreateClick = () => {
    setView('create');
  };

  const handleJoinClick = () => {
    setView('join');
  };

  const handleBack = () => {
    setView('initial');
    setGeneratedHash('');
    setJoinHash('');
    setStatus('');
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(generatedHash);
  };

  const handleCreateNext = async () => {
    if (!generatedHash) {
      setStatus('Please generate a hash first.');
      return;
    }
    try {
      setIsLoading(true);
      setStatus('Connecting...');
      await onSetupComplete(generatedHash);
    } catch (err) {
      setStatus('Failed to connect. Please try again.');
      console.error('Setup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinNext = async () => {
    if (!joinHash.trim()) {
      setStatus('Please enter a hash.');
      return;
    }
    try {
      setIsLoading(true);
      setStatus('Connecting...');
      await onSetupComplete(joinHash);
    } catch (err) {
      setStatus('Failed to join channel. Please check the hash and try again.');
      console.error('Join error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`overlay ${isHidden ? 'hidden' : ''}`}>
      <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Dark Mode">
        {theme === 'light' ? <MoonIcon size={20} /> : <SunIcon size={20} />}
      </button>
      <div className="overlay-content glass">
        <div className="brand-header">
           <h1 className="relay-title">Relay</h1>
           <span className="badge">E2EE</span>
        </div>
        <p className="attribution">Design Patterns course Project by Team SHAR</p>
        <p className="tagline">Secure · Ephemeral · Peer-to-Peer</p>

        {view === 'initial' && (
          <InitialActions
            onCreateClick={handleCreateClick}
            onJoinClick={handleJoinClick}
          />
        )}

        {view === 'create' && (
          <CreateHashView
            hash={generatedHash}
            onCopyClick={handleCopyHash}
            onBack={handleBack}
            onNext={handleCreateNext}
          />
        )}

        {view === 'join' && (
          <JoinHashView
            hash={joinHash}
            onHashChange={setJoinHash}
            onBack={handleBack}
            onJoin={handleJoinNext}
          />
        )}

        {status && <div className="setup-status">{status}</div>}
      </div>
    </div>
  );
};

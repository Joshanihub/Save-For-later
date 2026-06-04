import { useEffect, useRef } from 'react';

interface PluginContainerProps {
  pluginUrl: string;
  pluginId: string;
  onMessage: (message: any) => void;
  className?: string;
}

export function PluginContainer({ pluginUrl, pluginId, onMessage, className = '' }: PluginContainerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const url = new URL(pluginUrl);
        if (event.origin !== url.origin && pluginUrl !== 'about:blank') return;
      } catch (e) {
        // invalid URL handling
        return;
      }
      
      console.log(`Plugin ${pluginId} sent:`, event.data);
      onMessage(event.data);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [pluginId, pluginUrl, onMessage]);

  // Expose sendMessage method to parent
  // In a real app we'd use forwardRef + useImperativeHandle
  
  return (
    <iframe
      ref={iframeRef}
      src={pluginUrl}
      sandbox="allow-scripts allow-forms allow-popups"
      className={`w-full border border-edge rounded-lg bg-surface-0 ${className}`}
      title={`Plugin: ${pluginId}`}
    />
  );
}

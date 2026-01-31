export const WelcomeScreen = () => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-center px-8"
         style={{ backgroundColor: 'var(--wa-chat-background)' }}>
      <div className="mb-8">
        <img 
          src="https://www.fibe.in/fibe-india.svg" 
          alt="Fibe Logo" 
          className="w-48 h-auto mx-auto"
          style={{ maxHeight: '120px' }}
        />
      </div>
      <h2 className="text-3xl font-light mb-4" style={{ color: 'var(--wa-text-secondary)' }}>
        Fibe WhatsApp Chat Portal
      </h2>
      <p className="text-sm max-w-md leading-relaxed" style={{ color: 'var(--wa-text-light)' }}>
        Empowering agents to manage conversations and build better customer connections.
      </p>
      <div className="mt-8 p-4 rounded-lg border" 
           style={{ 
             backgroundColor: 'var(--wa-panel-background)',
             borderColor: 'var(--wa-border)',
             color: 'var(--wa-text-secondary)'
           }}>
        <p className="text-xs">
          Select a chat to start messaging
        </p>
      </div>
    </div>
  );
};
export default WelcomeScreen;

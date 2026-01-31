
const FullScreenBackdropLoader = ({ isLoading = false }) => {
  return (
    <>
      {isLoading ? (
        <>
          {/* Backdrop with blur effect */}
          <div 
            className="fixed top-0 left-0 right-0 bottom-0 w-full h-full overflow-hidden z-[9999] transition-all duration-300"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)'
            }}
          ></div>
          
          {/* Loader container with modern glass morphism effect */}
          <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-full overflow-hidden flex flex-col items-center justify-center z-[10000]">
            <div 
              className="relative flex flex-col items-center justify-center rounded-2xl shadow-2xl p-8 animate-fadeIn"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)'
              }}
            >
              {/* Spinner container */}
              <div className="relative">
                {/* Outer spinning ring */}
                <div 
                  className="absolute inset-0 rounded-full animate-spin"
                  style={{
                    width: '80px',
                    height: '80px',
                    border: '3px solid transparent',
                    borderTopColor: '#3b82f6',
                    borderRightColor: '#3b82f6',
                  }}
                ></div>
                
                {/* Middle spinning ring (opposite direction) */}
                <div 
                  className="absolute inset-0 rounded-full animate-spin-reverse"
                  style={{
                    width: '80px',
                    height: '80px',
                    border: '3px solid transparent',
                    borderBottomColor: '#8b5cf6',
                    borderLeftColor: '#8b5cf6',
                    animationDuration: '1.5s'
                  }}
                ></div>
                
                {/* Inner pulsing circle */}
                <div 
                  className="flex items-center justify-center animate-pulse"
                  style={{
                    width: '80px',
                    height: '80px',
                  }}
                >
                  <div 
                    className="rounded-full"
                    style={{
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
                    }}
                  ></div>
                </div>
              </div>
              
              {/* Loading text */}
              <p 
                className="mt-6 text-sm font-semibold tracking-wide animate-pulse"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Loading...
              </p>
            </div>
          </div>
          
          <style jsx>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: scale(0.95);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
            
            @keyframes spin-reverse {
              from {
                transform: rotate(360deg);
              }
              to {
                transform: rotate(0deg);
              }
            }
            
            .animate-fadeIn {
              animation: fadeIn 0.3s ease-out;
            }
            
            .animate-spin-reverse {
              animation: spin-reverse 1s linear infinite;
            }
          `}</style>
        </>
      ) : null}
    </>
  );
};

export default FullScreenBackdropLoader;

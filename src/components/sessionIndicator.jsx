import { useSession } from "../middleware/sessionManager";

export const SessionIndicator = () => {
  const { token, isValid, sessionInfo } = useSession();

  if (!token) {
    return (
      <div className="flex items-center text-red-500 text-xs">
        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
        No Session
      </div>
    );
  }

  return (
    <div
      className={`flex items-center text-xs ${
        isValid ? "text-green-500" : "text-orange-500"
      }`}
    >
      <div
        className={`w-2 h-2 rounded-full mr-2 ${
          isValid ? "bg-green-500" : "bg-orange-500"
        }`}
      ></div>
      <span>
        {isValid ? "Active" : "Expired"} Session
        {sessionInfo?.team && (
          <span className="ml-2 text-gray-500">({sessionInfo.team})</span>
        )}
      </span>
    </div>
  );
};

export const SessionDetails = ({ isOpen, onClose }) => {
  const { token, sessionInfo } = useSession();

  if (!isOpen || !sessionInfo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Session Details</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <label className="font-semibold text-gray-700">Status:</label>
            <span
              className={`ml-2 ${
                sessionInfo.isValid ? "text-green-600" : "text-red-600"
              }`}
            >
              {sessionInfo.isValid ? "Valid" : "Expired"}
            </span>
          </div>

          <div>
            <label className="font-semibold text-gray-700">Agent ID:</label>
            <span className="ml-2">{sessionInfo.agentId || "N/A"}</span>
          </div>

          <div>
            <label className="font-semibold text-gray-700">Team:</label>
            <span className="ml-2">{sessionInfo.team || "N/A"}</span>
          </div>

          <div>
            <label className="font-semibold text-gray-700">Expires At:</label>
            <span className="ml-2">
              {sessionInfo.expiresAt
                ? new Date(sessionInfo.expiresAt).toLocaleString()
                : "N/A"}
            </span>
          </div>

          <div>
            <label className="font-semibold text-gray-700">
              Token (Last 10 chars):
            </label>
            <span className="ml-2 font-mono text-xs">
              ...{token?.slice(-10) || "N/A"}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Close
        </button>
      </div>
    </div>
  );
};

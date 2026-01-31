"use client";
import { useEffect, useState } from "react";
import { dispositionApi } from "../middleware/chat.service";

interface DispositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rcodeId: number, subRcodeId?: number, remarks?: string, dateTime?: string, rcodeName?: string, subRcodeName?: string) => void;
  agentId: string | null;
  team: string;
}

interface RcodeData {
  Remarks: number;
  DateandTime: number;
  rcodeID: number;
  subRcode: string[];
}

interface DispositionData {
  [key: string]: RcodeData;
}

export default function DispositionModal({
  isOpen,
  onClose,
  onSubmit,
  agentId,
  team,
}: DispositionModalProps) {
  const [dispositionData, setDispositionData] = useState<DispositionData>({});
  const [loading, setLoading] = useState(false);
  const [rcode, setRcode] = useState("");
  const [subRcode, setSubRcode] = useState("");
  const [remarks, setRemarks] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  // Get selected rcode data
  const selectedRcodeData = rcode ? dispositionData[rcode] : null;
  const requiresRemarks = selectedRcodeData?.Remarks === 1;
  const requiresDateTime = selectedRcodeData?.DateandTime === 1;
  const hasSubRcodes = selectedRcodeData?.subRcode && selectedRcodeData.subRcode.length > 0;

  // Fetch disposition list when modal opens
  useEffect(() => {
    if (isOpen && agentId && team) {
      fetchDispositionList();
    }
  }, [isOpen, agentId, team]);

  const fetchDispositionList = async () => {
    try {
      setLoading(true);
      const response = await dispositionApi({
        agentId: agentId,
        team: team,
        requestFor: "GET_DISPOSITION_LIST",
      });

      if (response?.statusCode === 200 && response?.payload) {
        setDispositionData(response.payload);
      }
    } catch (error) {
      console.error("Error fetching disposition list:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check if all required fields are filled
  const isFormValid = () => {
    // R code is always required
    if (!rcode) return false;

    // Check if subrcode is required and filled
    if (hasSubRcodes && !subRcode) return false;

    // Check if remarks are required and filled
    if (requiresRemarks && !remarks.trim()) return false;

    // Check if date/time are required and filled
    if (requiresDateTime && (!selectedDate || !selectedTime)) return false;

    return true;
  };

  const handleSubmit = () => {
    // Prepare submission data
    const rcodeId = selectedRcodeData?.rcodeID;
    const dateTime = selectedDate && selectedTime ? `${selectedDate}T${selectedTime}:00.000` : undefined;
    const rcodeName = rcode || undefined;
    const subRcodeName = subRcode || undefined;

    onSubmit(rcodeId!, undefined, remarks || undefined, dateTime, rcodeName, subRcodeName);
  };

  const handleCancel = () => {
    setRcode("");
    setSubRcode("");
    setRemarks("");
    setSelectedDate("");
    setSelectedTime("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-sm"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancel();
        }
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-hidden border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Close Conversation</h2>
                <p className="text-xs text-gray-500">Complete disposition details</p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto max-h-[calc(85vh-180px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-blue-100"></div>
                <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin absolute top-0"></div>
              </div>
              <p className="mt-4 text-sm text-gray-600 font-medium">Loading disposition options...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* R code Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Disposition Code <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={rcode}
                    onChange={(e) => {
                      setRcode(e.target.value);
                      setSubRcode("");
                      setRemarks("");
                      setSelectedDate("");
                      setSelectedTime("");
                    }}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm text-gray-700 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    <option value="">Select disposition code...</option>
                    {Object.keys(dispositionData).map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Sub r code Dropdown */}
              {hasSubRcodes && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Sub Disposition <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={subRcode}
                      onChange={(e) => {
                        setSubRcode(e.target.value);
                        setRemarks("");
                        setSelectedDate("");
                        setSelectedTime("");
                      }}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm text-gray-700 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                    >
                      <option value="">Select sub disposition...</option>
                      {selectedRcodeData?.subRcode.map((subRcodeName: string, index: number) => (
                        <option key={index} value={subRcodeName}>
                          {subRcodeName}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Remarks */}
              {requiresRemarks && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Remarks <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={3}
                    placeholder="Enter detailed remarks..."
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm text-gray-700 resize-none hover:border-gray-400 transition-colors"
                  />
                  <p className="mt-1 text-xs text-gray-500">{remarks.length} characters</p>
                </div>
              )}

              {/* Date and Time */}
              {requiresDateTime && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Schedule Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={selectedDate && selectedTime ? `${selectedDate}T${selectedTime}` : ""}
                    onChange={(e) => {
                      const [date, time] = e.target.value.split('T');
                      setSelectedDate(date);
                      setSelectedTime(time);
                    }}
                    min={`${new Date().toISOString().split('T')[0]}T08:00`}
                    max={`${new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]}T20:00`}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm text-gray-700 hover:border-gray-400 transition-colors"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-5 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !isFormValid()}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Submit Disposition
          </button>
        </div>
      </div>
    </div>
  );
}

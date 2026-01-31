import { useEffect, useState } from "react";

// Predefined sample messages for agents
const SAMPLE_MESSAGES = [
  {
    id: 1,
    title: "Outstanding, balance, check amount, payment status, last payment",
    message: "As per records, your current outstanding amount is ₹{Amount}.",
    category: "Outstanding Amount",
  },
  {
    id: 2,
    title: "due, overdue",
    message: "As per records, your overdue amount is ₹{Amount}.",
    category: "Overdue Amount",
  },
  {
    id: 3,
    title: "last payment, already paid, check payment",
    message:
      "Your last payment of ₹{Amount} was received on {Last Payment Date}.",
    category: "Last Payment Info",
  },
  {
    id: 4,
    title: "remind, pay later, reminder",
    message: "Request you to pay at earliest to avoid penalties.",
    category: "Friendly Reminder",
  },
  {
    id: 5,
    title: "stop calling, too many calls",
    message:
      "This is a system reminder. Request your cooperation to clear dues.",
    category: "Soft Exit Reminder",
  },
  {
    id: 6,
    title: "settlement, offer, waiver, discount, negotiation",
    message: "We can check offer eligibility. Are you interested? (Yes/No)",
    category: "Offer Interest Check",
  },
  {
    id: 7,
    title: "interested, check eligibility",
    message: "Checking eligibility. Tentative eligible amount ₹{Amount}.",
    category: "Offer Eligibility Check",
  },
  {
    id: 8,
    title: "approved?, status?",
    message: "Your offer is under review; we will update post decision.",
    category: "Offer Status Update",
  },
  {
    id: 9,
    title: "rejected, why rejected",
    message:
      "Offer rejected due to policy. Share commitment amount for re-consideration.",
    category: "Offer Rejection Update",
  },
  {
    id: 10,
    title: "nach failed, auto debit failed, emi not deducted",
    message: "Your auto debit failed. Please pay manually using link.",
    category: "NACH Failure",
  },
  {
    id: 11,
    title: "stop auto debit",
    message: "We can raise a request. Share reason to proceed.",
    category: "Cancel Auto Debit",
  },
  {
    id: 12,
    title: "app not working, link not working, technical issue",
    message: "Share screenshot; we will assist resolving.",
    category: "Tech Issue",
  },
  {
    id: 13,
    title: "wrong details, incorrect amount",
    message: "We will verify discrepancy. Share loan no., mobile, screenshot.",
    category: "Account Verification",
  },
  {
    id: 14,
    title: "speak to manager, complaint",
    message: "We will arrange a callback within 24 hours.",
    category: "Escalation",
  },
  {
    id: 15,
    title: "legal notice, court",
    message: "Share notice copy for verification and support.",
    category: "Legal Clarification",
  },
  {
    id: 16,
    title: "call me, need call, talk to agent",
    message: "Please confirm the time for callback.",
    category: "Callback Request",
  },
  {
    id: 17,
    title: "call back, arrange call, time",
    message:
      "Thank you for the confirmation. We will arrange the callback at the time you have provided.",
    category: "Post time confirmation",
  },
  {
    id: 18,
    title: "help, support, query unclear",
    message: "Connecting you with an expert now.",
    category: "Chat With Expert",
  },
  {
    id: 19,
    title: "Greetings",
    message:
      "Greetings from Fibe! Thank you for reaching out to us. How may we assist you today?",
    category: "Greetings",
  },
  {
    id: 20,
    title: "Concern, query",
    message:
      "Please allow me a moment to review your concern. We will ensure it is addressed at the earliest.",
    category: "If customer has already raised concern",
  },
  {
    id: 21,
    title: "Payment, Reminder",
    message:
      "Your Fibe loan is overdue by {DPD} days. Please pay ₹{Amount} now.\n\nNeed help? Call 020-67639797 or email care@fibe.in",
    category: "Payment Reminder",
  },
  {
    id: 22,
    title: "refused, refuses, not ready, reason, non-payment, eligible, offer",
    message:
      "Please let us know the reason for non-payment, or confirm if you wish to know your eligible offer. For assistance, contact us at 020-67639797 / care@fibe.in.",
    category: "If customer refuses to pay",
  },
  {
    id: 23,
    title: "Payment Confirmation",
    message:
      "Payment of ₹{Amount} has been received. For any assistance, contact us at 020-67639797 or care@fibe.in",
    category: "Payment Confirmation",
  },
  {
    id: 24,
    title: "failed, payment, transaction, last payment, reason",
    message:
      "Your last payment of ₹{Amount} could not be processed. Please retry. For any assistance, contact us at 020-67639797 / care@fibe.in.",
    category: "Returned payment / Failed Payment",
  },
  {
    id: 25,
    title: "Legal, notice, action",
    message:
      "Legal notice {notice name} has been issued and shared on your registered email ID. Please pay ₹{Amount} now to avoid further action.",
    category: "Legal Notice",
  },
  {
    id: 26,
    title: "Care, customer care, support, help, helpline, email id",
    message:
      "If you need any assistance, please feel free to reach out to us at our helpline number 020-67639797 or email us at care@fibe.in",
    category: "Any Help",
  },
];

export default function SlashCommands({ 
  isVisible, 
  onSelect, 
  onClose, 
  searchTerm = "",
  position = { top: 0, left: 0 }
}) {
  const [filteredMessages, setFilteredMessages] = useState(SAMPLE_MESSAGES);

  useEffect(() => {
    if (searchTerm) {
      const filtered = SAMPLE_MESSAGES.filter(msg => 
        msg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages(SAMPLE_MESSAGES);
    }
  }, [searchTerm]);

  if (!isVisible) return null;

  return (
    <div 
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto w-80"
      style={{
        bottom: position.bottom || 'auto',
        left: position.left || 0,
        top: position.top || 'auto',
        backgroundColor: 'var(--wa-panel-background)',
        borderColor: 'var(--wa-border)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}
    >
      <div className="p-2 border-b" style={{ borderColor: 'var(--wa-border)' }}>
        <p className="text-xs font-medium" style={{ color: 'var(--wa-text-secondary)' }}>
          Quick Messages - Select to use
        </p>
      </div>
      
      <div className="max-h-48 overflow-y-auto">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className="p-3 cursor-pointer border-b hover:bg-gray-50 transition-colors"
              style={{ borderColor: 'var(--wa-border)' }}
              onClick={() => onSelect(msg.message)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--wa-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <p className="text-sm leading-relaxed" style={{ color: 'var(--wa-text-primary)' }}>
                {msg.message}
              </p>
            </div>
          ))
        ) : (
          <div className="p-4 text-center">
            <p className="text-sm" style={{ color: 'var(--wa-text-secondary)' }}>
              No messages found for &quot;{searchTerm}&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
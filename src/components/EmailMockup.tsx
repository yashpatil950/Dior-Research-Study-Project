/**
 * Gmail-style email card used in Tasks 5 & 6.
 *
 * Renders the sample-screenshot layout the user provided, but with
 * the body text bumped up so participants can read it at normal
 * viewing distance.
 */

export interface MockEmail {
  id: string;
  subject: string;
  sender_name: string;
  sender_addr: string;
  timestamp: string;     // e.g. "10:32 AM (3 minutes ago)"
  body: string;
  category: "Update" | "Question/Request" | "Advertisement/Spam";
}

const initials = (s: string) =>
  s.split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

export const EmailMockup = ({ email }: { email: MockEmail }) => {
  return (
    <div className="email-mock">
      <div className="gmail-bar">
        <div className="gmail-logo">
          <span className="red">G</span>
          <span className="blue">m</span>
          <span className="yellow">a</span>
          <span className="blue">i</span>
          <span className="green">l</span>
        </div>
        <div className="search-pill">🔍 Search mail</div>
        <div className="gmail-icons">
          <span>?</span>
          <span>⚙</span>
          <span>⋮⋮⋮</span>
          <div className="gmail-avatar">A</div>
        </div>
      </div>

      <div className="toolbar">
        <span>←</span>
        <span>▼</span>
        <span>!</span>
        <span>🗑</span>
        <span>✉</span>
        <span>⏰</span>
        <span>📁</span>
        <span>🏷</span>
        <span>⋮</span>
        <span className="count">1 of 1  &lt;  &gt;</span>
      </div>

      <div className="subject-line">
        <span>{email.subject}</span>
        <span className="inbox-chip">Inbox ×</span>
      </div>

      <div className="sender-row">
        <div className="sender-avatar">{initials(email.sender_name)}</div>
        <div className="sender-info">
          <div className="sender-name">
            <strong>{email.sender_name}</strong>
            <span className="addr">&lt;{email.sender_addr}&gt;</span>
          </div>
          <div className="sender-to">to me ▾</div>
        </div>
        <div className="sender-meta">
          {email.timestamp}<br />
          <span style={{ fontSize: 16 }}>★ ↩ ⋮</span>
        </div>
      </div>

      <div className="body">{email.body}</div>

      <div className="reply-row">
        <button className="reply-btn">↩ Reply</button>
        <button className="reply-btn">↗ Forward</button>
      </div>
    </div>
  );
};

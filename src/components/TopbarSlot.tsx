import { createPortal } from "react-dom";

/**
 * Lets a full-screen task stage put its title and controls in the app's top
 * bar instead of adding another row to the page — used by the AES avatar
 * player, where every pixel of height belongs to the video.
 *
 * The host node is created once at module load and parked in the top bar by
 * <TopbarSlotHost>, so <TopbarSlot> always has somewhere to portal to and its
 * content shows up on the first render. While the slot holds anything, the top
 * bar hides its nav links to make room — see index.css.
 */
const host = document.createElement("span");
host.className = "topbar-slot";

/** Rendered once by Layout to mark where slotted content goes. */
export const TopbarSlotHost = () => (
  <span
    className="topbar-slot-mount"
    ref={(el) => {
      if (el && host.parentNode !== el) el.appendChild(host);
    }}
  />
);

export const TopbarSlot = ({ children }: { children: React.ReactNode }) =>
  createPortal(children, host);

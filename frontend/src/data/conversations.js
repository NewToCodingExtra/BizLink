export const conversationsSeed = [
  { id: "conv-1", with: "BrewCraft Coffee", avatar: "https://i.pravatar.cc/100?img=11", lastMessage: "Happy to share P&L on inquiry — when are you free for a call?", unread: 1, brandId: "brand-1" },
  { id: "conv-2", with: "FitForge Gym", avatar: "https://i.pravatar.cc/100?img=15", lastMessage: "Launch promo still active for Mindanao", unread: 0, brandId: "brand-3" },
];

export const messagesSeed = [
  { id: "m-1", conversationId: "conv-1", from: "them", text: "Hi! Thanks for your interest in BrewCraft.", time: "10:12 AM" },
  { id: "m-2", conversationId: "conv-1", from: "me", text: "Hi — can I get the detailed ROI breakdown for the ₱850K package?", time: "10:14 AM" },
  { id: "m-3", conversationId: "conv-1", from: "them", text: "Happy to share P&L on inquiry — when are you free for a call?", time: "10:15 AM" },
  { id: "m-4", conversationId: "conv-2", from: "them", text: "Hey! FitForge here — interested in the boutique gym model?", time: "Yesterday" },
  { id: "m-5", conversationId: "conv-2", from: "me", text: "Yes, looking at South Cebu locations.", time: "Yesterday" },
];

export const notificationsSeed = [
  { id: "n-1", type: "comment", message: "BrewCraft Coffee replied to your comment on Premium Coffee Franchise", read: false, timestamp: "1h ago" },
  { id: "n-2", type: "inquiry", message: "Glow Skin Wholesale viewed your inquiry", read: false, timestamp: "3h ago" },
  { id: "n-3", type: "new_post", message: "UrbanThread posted a new Resell opportunity you might like", read: true, timestamp: "1d ago" },
];

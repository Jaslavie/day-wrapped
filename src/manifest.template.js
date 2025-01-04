module.exports = {
  manifest_version: 3,
  name: "Day Wrapped",
  version: "1.0",
  description: "Your browser history, wrapped",
  permissions: [
    "storage",
    "tabs",
    "history",
    "idle"
  ],
  action: {
    default_popup: "index.html"
  }
};
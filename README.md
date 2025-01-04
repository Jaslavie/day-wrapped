### Data Structure
Visit `StorageManager.js` for data structure design.
- Cache Memory: stores most recently accessed tabs. Transfers to long term memory after 24 hours.
- Short Term Memory: stores the domains accessed in the last 24 hours and the time they were accessed.
- Long Term Memory: stores nlp summaries of the last 30 days.
- Goals: stores user's long term and short term goals.
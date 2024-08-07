// server.js
const express = require('express');
const path = require('path');
require('dotenv').config();
const btoa = require("btoa");

const app = express();

// Middleware for parsing request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import and use the middleware
const middlewareApp = require('./middleware/src/app.js');
app.use('./middleware', middlewareApp);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Define routes
app.get('/', (req, res) => {
  res.send('Welcome to the main server');
});

// Freshdesk Event Handler
exports = {
  events: [
    {
      event: "onTicketCreate",
      callback: "onTicketCreateHandler",
    },
  ],

  onTicketCreateHandler: async function (payload) {
    const freshdeskApiKey = payload.iparams.freshdesk_api_key;
    const freshdeskDomain = payload.iparams.freshdesk_domain;

    const incident = payload.data.ticket;
    const requester = payload.data.requester;

    // Check if the incident requester and their email are defined
    if (!incident || !requester || !requester.email) {
      console.error("Incident or requester email is missing.");
      return;
    }

    // Create a Freshdesk ticket
    const createFreshdeskTicket = async (incident, requester) => {
      const freshdeskUrl = `https://${freshdeskDomain}/api/v2/tickets`;

      const authString = `${freshdeskApiKey}`;
      const encodedAuth = btoa(authString + ":x");
      console.log(encodedAuth);
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Basic ${encodedAuth}`,
      };

      const ticketData = {
        subject: incident.subject,
        description: incident.description,
        email: requester.email,
        priority: incident.priority,
        status: 2, // Open
        source: 2, // Web
      };

      try {
        const response = await fetch(freshdeskUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(ticketData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Freshdesk Ticket Created: ", data);
      } catch (error) {
        console.error("Error creating Freshdesk ticket: ", error);
      }
    };

    await createFreshdeskTicket(incident, requester);
  },
};

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

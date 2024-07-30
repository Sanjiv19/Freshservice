const btoa  = require("btoa"); // Import btoa from abab

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

    // console.log('Payload received:', JSON.stringify(payload, null, 2)); // Log the payload

    const incident = payload.data.ticket;
    const requester = payload.data.requester;

    // Check if the incident requester and their email are defined
    if (!incident || !requester || !requester.email) {
      console.error("Incident or requester email is missing.");
      return;
    }

    // Create a Freshdesk ticket
    const createFreshdeskTicket = async (incident, requester) => {
      // Correct the Freshdesk URL
      const freshdeskUrl = `https://${freshdeskDomain}/api/v2/tickets`;

      // Use btoa from abab for Base64 encoding
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

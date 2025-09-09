/*
  This is a Vercel serverless function. It acts as a secure backend for your website.
  It receives a request from your frontend (index.html), makes a secure call to the
  Aviasales/Travelpayouts API using your secret tokens, and then returns the data.
*/

// Vercel automatically makes environment variables available via process.env
const API_TOKEN = process.env.TRAVELPAYOUTS_API_TOKEN;
const PARTNER_ID = process.env.TRAVELPAYOUTS_PARTNER_ID;

// Base URLs for the Aviasales/Travelpayouts API
const API_BASE_URL = 'https://api.travelpayouts.com';
const API_VERSION = 'v1';

export default async function handler(req, res) {
    // Only allow POST requests for security
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Check if the required API credentials are set as environment variables
    if (!API_TOKEN || !PARTNER_ID) {
        return res.status(500).json({ error: 'Server misconfiguration: API_TOKEN and PARTNER_ID are not set.' });
    }

    try {
        const { type, params } = req.body;
        let apiUrl = '';

        // Construct the correct API endpoint and parameters based on the search type
        if (type === 'flights') {
            const { origin, destination, departure_date, return_date } = params;
            
            // Check for required flight parameters
            if (!origin || !destination || !departure_date) {
                return res.status(400).json({ error: 'Missing flight search parameters.' });
            }

            // Aviasales requires dates in a specific format (YYYY-MM-DD)
            const depDate = departure_date;
            const retDate = return_date || ''; // Return date is optional
            
            // Example of a flights API endpoint
            apiUrl = `${API_BASE_URL}/v1/prices/monthly?currency=usd&origin=${origin}&destination=${destination}&token=${API_TOKEN}`;
            // NOTE: Aviasales has many endpoints. You will need to find the correct one for
            // a full search. The above is a placeholder for demonstration.
            
        } else if (type === 'hotels') {
            const { destination, check_in_date, check_out_date } = params;
            
            // Check for required hotel parameters
            if (!destination || !check_in_date || !check_out_date) {
                return res.status(400).json({ error: 'Missing hotel search parameters.' });
            }

            // Example of a hotels API endpoint
            apiUrl = `${API_BASE_URL}/data/hotels_search_by_cityid?locationId=${destination}&checkIn=${check_in_date}&checkOut=${check_out_date}&token=${API_TOKEN}`;
            
        } else {
            return res.status(400).json({ error: 'Invalid search type.' });
        }

        // Make the API call to Travelpayouts
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'X-Access-Token': API_TOKEN, // Some APIs might require the token in a header
                'Content-Type': 'application/json',
            },
        });

        // Check for a successful response from Travelpayouts
        if (!response.ok) {
            const errorData = await response.text();
            console.error('Travelpayouts API Error:', errorData);
            return res.status(response.status).json({ error: 'Failed to fetch data from the Aviasales API.' });
        }

        const data = await response.json();
        
        // Return the data received from Travelpayouts to the frontend
        return res.status(200).json({ results: data });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
}

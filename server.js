require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');
const twilio = require('twilio');

const app = express();
app.use(express.urlencoded({ extended: false }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// In-memory data capture for MVP
let appointments = [];

app.post('/whatsapp', async (req, res) => {
    const userMsg = req.body.Body;
    const from = req.body.From;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are Med-Agent AI. Extract test types and confirm bookings like 'BOOKING_CONFIRMED: [Test Name]'." },
                { role: "user", content: userMsg }
            ]
        });

        let aiMsg = completion.choices[0].message.content;

        if (aiMsg.includes("BOOKING_CONFIRMED")) {
            appointments.push({ patient: from, test: aiMsg.split(": ")[1], date: new Date() });
            aiMsg = `✅ Appointment for ${aiMsg.split(": ")[1]} confirmed! You will receive a reminder soon.`;
        }

        await client.messages.create({
            body: aiMsg,
            from: 'whatsapp:+14155238886', 
            to: from
        });

        res.status(200).send("Processed");
    } catch (err) {
        res.status(500).send("Error");
    }
});

app.listen(3000, () => console.log(`Med-Agent live on port 3000`));
